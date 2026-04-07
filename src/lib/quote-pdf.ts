import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { TFunction } from "i18next"

import type { BusinessSettings, Quote, QuoteLineItem } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/format"

type BuildQuotePdfOptions = {
  quote: Quote
  settings: BusinessSettings | null
  locale?: string
  t: TFunction
  autoPrint?: boolean
}

const PAGE_MARGIN = 40
const PAGE_BOTTOM_MARGIN = 44

export function buildQuotePdfBlob({ quote, settings, locale, t, autoPrint = false }: BuildQuotePdfOptions): Blob {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
    compress: true,
  })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - PAGE_MARGIN * 2
  const leftColumnWidth = 290
  const gap = 24
  const rightColumnWidth = contentWidth - leftColumnWidth - gap

  let y = 42

  const leftBottom = drawPartyBlock(pdf, {
    x: PAGE_MARGIN,
    y,
    width: leftColumnWidth,
    eyebrow: t("quote.print.from"),
    title: settings?.business_name || "AutoQuote",
    lines: [settings?.business_email, settings?.business_phone, settings?.business_address].filter(Boolean) as string[],
  })

  const rightBottom = drawPartyBlock(pdf, {
    x: PAGE_MARGIN + leftColumnWidth + gap,
    y,
    width: rightColumnWidth,
    eyebrow: t("quote.print.preparedFor"),
    title: quote.customer_company || quote.customer_name || t("common.notSetYet"),
    lines: [quote.customer_name, quote.customer_email, quote.customer_phone, quote.customer_address].filter(Boolean) as string[],
  })

  y = Math.max(leftBottom, rightBottom) + 26

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(9)
  pdf.setTextColor(100, 116, 139)
  pdf.text(quote.quote_number, PAGE_MARGIN, y)
  y += 18

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(22)
  pdf.setTextColor(15, 23, 42)
  const titleLines = pdf.splitTextToSize(quote.title || t("common.untitledQuote"), 300)
  pdf.text(titleLines, PAGE_MARGIN, y)

  const metaStartX = PAGE_MARGIN + leftColumnWidth + gap
  const metaStartY = y - 8
  const metaRows = [
    [t("quote.fields.status.label"), t(`status.${quote.status}`)],
    [t("quote.print.issuedOn"), formatDate(quote.created_at, locale)],
    [t("quote.validUntil"), formatDate(quote.valid_until, locale)],
    [t("quote.fields.currency.label"), quote.currency],
  ] as const

  let metaY = metaStartY
  for (const [label, value] of metaRows) {
    metaY = drawMetaRow(pdf, metaStartX, metaY, rightColumnWidth, label, value)
  }

  y = Math.max(y + titleLines.length * 22, metaY) + 8

  if (quote.job_summary) {
    y += 8
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(10)
    pdf.setTextColor(71, 85, 105)
    const summaryLines = pdf.splitTextToSize(quote.job_summary, contentWidth)
    pdf.text(summaryLines, PAGE_MARGIN, y)
    y += summaryLines.length * 14 + 14
  }

  const reviewItems = quote.line_items.filter((item) => item.needs_review || item.unit_price_cents === null)
  if (reviewItems.length > 0) {
    y = ensurePageSpace(pdf, y, 78, pageHeight)
    pdf.setFillColor(255, 247, 237)
    pdf.setDrawColor(253, 186, 116)
    pdf.roundedRect(PAGE_MARGIN, y, contentWidth, 56, 12, 12, "FD")
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9)
    pdf.setTextColor(180, 83, 9)
    pdf.text(t("quote.print.reviewNoticeTitle").toUpperCase(), PAGE_MARGIN + 16, y + 18)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(10)
    pdf.setTextColor(120, 53, 15)
    const reviewLines = pdf.splitTextToSize(
      t("quote.print.reviewNoticeDescription", { count: reviewItems.length }),
      contentWidth - 32
    )
    pdf.text(reviewLines, PAGE_MARGIN + 16, y + 36)
    y += 76
  }

  const quantityFormatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })

  autoTable(pdf, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    head: [[
      t("quote.fields.description.label"),
      t("quote.print.quantity"),
      t("quote.fields.unit.label"),
      t("quote.print.unitPrice"),
      t("quote.print.lineTotal"),
    ]],
    body: quote.line_items.map((item) => buildLineItemRow(item, quote.currency, locale, quantityFormatter, t)),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 7,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 1,
      overflow: "linebreak",
      valign: "top",
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [100, 116, 139],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 225 },
      1: { cellWidth: 58, halign: "right" },
      2: { cellWidth: 52 },
      3: { cellWidth: 88, halign: "right" },
      4: { cellWidth: 88, halign: "right" },
    },
  })

  y = ((pdf as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 24

  if (quote.assumptions) {
    y = drawTextSection(pdf, pageHeight, {
      x: PAGE_MARGIN,
      y,
      width: contentWidth,
      title: t("quote.print.assumptions"),
      body: quote.assumptions,
    })
  }

  if (quote.payment_terms) {
    y = drawTextSection(pdf, pageHeight, {
      x: PAGE_MARGIN,
      y,
      width: contentWidth,
      title: t("quote.print.paymentTerms"),
      body: quote.payment_terms,
    })
  }

  y = ensurePageSpace(pdf, y, 96, pageHeight)
  drawTotalsBox(pdf, {
    x: pageWidth - PAGE_MARGIN - 200,
    y,
    width: 200,
    rows: [
      [t("quote.subtotal"), formatCurrency(quote.subtotal_cents, quote.currency, locale)],
      [t("quote.tax", { value: `${Math.round(quote.tax_rate * 1000) / 10}%` }), formatCurrency(quote.tax_amount_cents, quote.currency, locale)],
      [t("quote.total"), formatCurrency(quote.total_cents, quote.currency, locale)],
    ],
  })

  if (autoPrint) {
    pdf.autoPrint({ variant: "non-conform" })
  }

  return pdf.output("blob")
}

function buildLineItemRow(
  item: QuoteLineItem,
  currency: string,
  locale: string | undefined,
  quantityFormatter: Intl.NumberFormat,
  t: TFunction
): string[] {
  const description = item.needs_review || item.unit_price_cents === null
    ? `${item.description}\n${t("quote.lineItems.needsReview")}`
    : item.description

  return [
    description,
    quantityFormatter.format(item.quantity),
    item.unit,
    item.unit_price_cents === null ? t("quote.print.notPriced") : formatCurrency(item.unit_price_cents, currency, locale),
    formatCurrency(item.line_total_cents, currency, locale),
  ]
}

function drawPartyBlock(
  pdf: jsPDF,
  {
    x,
    y,
    width,
    eyebrow,
    title,
    lines,
  }: {
    x: number
    y: number
    width: number
    eyebrow: string
    title: string
    lines: string[]
  }
): number {
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(9)
  pdf.setTextColor(100, 116, 139)
  pdf.text(eyebrow.toUpperCase(), x, y)

  const titleLines = pdf.splitTextToSize(title, width)
  pdf.setFontSize(18)
  pdf.setTextColor(15, 23, 42)
  pdf.text(titleLines, x, y + 22)

  if (lines.length === 0) {
    return y + 22 + titleLines.length * 18
  }

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  pdf.setTextColor(71, 85, 105)
  const bodyLines = pdf.splitTextToSize(lines.join("\n"), width)
  pdf.text(bodyLines, x, y + 22 + titleLines.length * 18 + 14)
  return y + 22 + titleLines.length * 18 + 14 + bodyLines.length * 13
}

function drawMetaRow(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string
): number {
  pdf.setDrawColor(226, 232, 240)
  pdf.line(x, y + 12, x + width, y + 12)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(8)
  pdf.setTextColor(100, 116, 139)
  pdf.text(label.toUpperCase(), x, y)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  pdf.setTextColor(15, 23, 42)
  pdf.text(value, x + width, y, { align: "right" })
  return y + 24
}

function drawTextSection(
  pdf: jsPDF,
  pageHeight: number,
  {
    x,
    y,
    width,
    title,
    body,
  }: {
    x: number
    y: number
    width: number
    title: string
    body: string
  }
): number {
  const bodyLines = pdf.splitTextToSize(body, width - 24)
  const height = 18 + bodyLines.length * 13 + 20
  const nextY = ensurePageSpace(pdf, y, height + 16, pageHeight)

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(9)
  pdf.setTextColor(100, 116, 139)
  pdf.text(title.toUpperCase(), x, nextY)

  pdf.setDrawColor(226, 232, 240)
  pdf.roundedRect(x, nextY + 10, width, height, 12, 12)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  pdf.setTextColor(51, 65, 85)
  pdf.text(bodyLines, x + 12, nextY + 28)

  return nextY + height + 26
}

function drawTotalsBox(
  pdf: jsPDF,
  {
    x,
    y,
    width,
    rows,
  }: {
    x: number
    y: number
    width: number
    rows: [string, string][]
  }
) {
  const height = 78
  pdf.setFillColor(248, 250, 252)
  pdf.setDrawColor(226, 232, 240)
  pdf.roundedRect(x, y, width, height, 12, 12, "FD")

  rows.forEach(([label, value], index) => {
    const rowY = y + 18 + index * 20
    const emphasized = index === rows.length - 1
    pdf.setFont("helvetica", emphasized ? "bold" : "normal")
    pdf.setFontSize(emphasized ? 12 : 10)
    pdf.setTextColor(emphasized ? 15 : 71, emphasized ? 23 : 85, emphasized ? 42 : 105)
    pdf.text(label, x + 14, rowY)
    pdf.text(value, x + width - 14, rowY, { align: "right" })
  })
}

function ensurePageSpace(pdf: jsPDF, y: number, requiredHeight: number, pageHeight: number): number {
  if (y + requiredHeight <= pageHeight - PAGE_BOTTOM_MARGIN) {
    return y
  }

  pdf.addPage()
  return PAGE_MARGIN
}
