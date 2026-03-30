import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import type { BusinessSettings, Quote } from "@/lib/api"
import { formatCurrency, formatDate } from "@/lib/format"

function QuotePrintSheet({
  quote,
  settings,
  locale,
}: {
  quote: Quote
  settings: BusinessSettings | null
  locale?: string
}) {
  const { t } = useTranslation()

  const reviewItems = quote.line_items.filter(
    (item) => item.needs_review || item.unit_price_cents === null
  )

  return (
    <section className="print-sheet hidden text-slate-900">
      <div className="mx-auto max-w-5xl bg-white px-10 py-10">
        <header className="grid gap-8 border-b border-slate-200 pb-8 md:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {t("quote.print.from")}
              </p>
              <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-slate-950">
                {settings?.business_name || "AutoQuote"}
              </h1>
            </div>

            <div className="space-y-1 text-sm leading-6 text-slate-600">
              {settings?.business_email ? <p>{settings.business_email}</p> : null}
              {settings?.business_phone ? <p>{settings.business_phone}</p> : null}
              {settings?.business_address ? (
                <p className="whitespace-pre-line">{settings.business_address}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {t("quote.print.preparedFor")}
              </p>
              <p className="mt-3 font-heading text-2xl font-semibold tracking-tight text-slate-950">
                {quote.customer_company || quote.customer_name || t("common.notSetYet")}
              </p>
            </div>

            <div className="space-y-1 text-sm leading-6 text-slate-600">
              {quote.customer_name ? <p>{quote.customer_name}</p> : null}
              {quote.customer_email ? <p>{quote.customer_email}</p> : null}
              {quote.customer_phone ? <p>{quote.customer_phone}</p> : null}
              {quote.customer_address ? (
                <p className="whitespace-pre-line">{quote.customer_address}</p>
              ) : null}
            </div>
          </div>
        </header>

        <section className="grid gap-6 border-b border-slate-200 py-8 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              {quote.quote_number}
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-slate-950">
              {quote.title || t("common.untitledQuote")}
            </h2>
            {quote.job_summary ? (
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{quote.job_summary}</p>
            ) : null}
          </div>

          <div className="grid gap-3 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            <MetaRow label={t("quote.fields.status.label")} value={t(`status.${quote.status}`)} />
            <MetaRow label={t("quote.print.issuedOn")} value={formatDate(quote.created_at, locale)} />
            <MetaRow label={t("quote.validUntil")} value={formatDate(quote.valid_until, locale)} />
            <MetaRow label={t("quote.fields.currency.label")} value={quote.currency} />
          </div>
        </section>

        {reviewItems.length > 0 ? (
          <section className="mt-8 rounded-[1.75rem] border border-amber-200 bg-amber-50 p-6 text-amber-950">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
              {t("quote.print.reviewNoticeTitle")}
            </p>
            <p className="mt-3 text-sm leading-7 text-amber-900">
              {t("quote.print.reviewNoticeDescription", { count: reviewItems.length })}
            </p>
          </section>
        ) : null}

        <section className="mt-8 overflow-hidden rounded-[1.75rem] border border-slate-200">
          <div className="grid grid-cols-[minmax(0,1.9fr)_0.45fr_0.55fr_0.7fr_0.7fr] gap-3 bg-slate-100 px-6 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            <span>{t("quote.fields.description.label")}</span>
            <span>{t("quote.print.quantity")}</span>
            <span>{t("quote.fields.unit.label")}</span>
            <span>{t("quote.print.unitPrice")}</span>
            <span className="text-right">{t("quote.print.lineTotal")}</span>
          </div>

          <div className="divide-y divide-slate-200 bg-white">
            {quote.line_items.map((item) => (
              <div key={item.id} className="grid grid-cols-[minmax(0,1.9fr)_0.45fr_0.55fr_0.7fr_0.7fr] gap-3 px-6 py-5 text-sm text-slate-700">
                <div>
                  <p className="font-medium text-slate-950">{item.description}</p>
                  {item.needs_review || item.unit_price_cents === null ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                      {t("quote.lineItems.needsReview")}
                    </p>
                  ) : null}
                </div>
                <span>{item.quantity}</span>
                <span>{item.unit}</span>
                <span>
                  {item.unit_price_cents === null
                    ? t("quote.print.notPriced")
                    : formatCurrency(item.unit_price_cents, quote.currency, locale)}
                </span>
                <span className="text-right font-medium text-slate-950">
                  {formatCurrency(item.line_total_cents, quote.currency, locale)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-8 md:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-6">
            {quote.assumptions ? (
              <PrintSection title={t("quote.print.assumptions")}>
                <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{quote.assumptions}</p>
              </PrintSection>
            ) : null}

            {quote.payment_terms ? (
              <PrintSection title={t("quote.print.paymentTerms")}>
                <p className="whitespace-pre-line text-sm leading-7 text-slate-700">{quote.payment_terms}</p>
              </PrintSection>
            ) : null}

          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
            <div className="grid gap-3">
              <TotalRow
                label={t("quote.subtotal")}
                value={formatCurrency(quote.subtotal_cents, quote.currency, locale)}
              />
              <TotalRow
                label={t("quote.tax", { value: `${Math.round(quote.tax_rate * 100)}%` })}
                value={formatCurrency(quote.tax_amount_cents, quote.currency, locale)}
              />
              <div className="border-t border-slate-200 pt-3">
                <TotalRow
                  label={t("quote.total")}
                  value={formatCurrency(quote.total_cents, quote.currency, locale)}
                  emphasized
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}

function PrintSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{title}</p>
      <div className="mt-3 rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4">{children}</div>
    </section>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  )
}

function TotalRow({
  label,
  value,
  emphasized = false,
}: {
  label: string
  value: string
  emphasized?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={emphasized ? "font-heading text-2xl font-semibold tracking-tight text-slate-950" : "font-medium text-slate-900"}>
        {value}
      </span>
    </div>
  )
}

export { QuotePrintSheet }
