import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import {
  RiAddLine,
  RiArrowLeftLine,
  RiChat3Line,
  RiCheckLine,
  RiDeleteBinLine,
  RiFileTextLine,
  RiLoader4Line,
  RiMoneyDollarCircleLine,
  RiSaveLine,
  RiStickyNoteLine,
  RiUserLine,
} from "@remixicon/react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"

import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getQuote, updateQuote, type Quote, type QuoteLineItem, type QuoteStatus } from "@/lib/api"
import { formatCurrency, formatDate, formatDateTime, formatPercent } from "@/lib/format"
import { supportedLocales, type AppLocale } from "@/lib/locale"

type QuoteLineItemForm = {
  description: string
  quantity: string
  unit: string
  unit_price: string
  needs_review: boolean
}

type QuoteFormState = {
  status: QuoteStatus
  customer_name: string
  customer_company: string
  customer_email: string
  customer_phone: string
  customer_address: string
  locale: AppLocale
  title: string
  job_summary: string
  assumptions: string
  notes: string
  payment_terms: string
  currency: string
  tax_rate: string
  valid_until: string
  line_items: QuoteLineItemForm[]
}

const emptyLineItem = (): QuoteLineItemForm => ({
  description: "",
  quantity: "1",
  unit: "job",
  unit_price: "",
  needs_review: true,
})

function QuoteWorkspacePage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const { quoteId } = useParams<{ quoteId: string }>()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [form, setForm] = useState<QuoteFormState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  const loadQuote = useCallback(async (id: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getQuote(id)
      setQuote(response)
      setForm(toFormState(response))
    } catch (loadError) {
      setError(toErrorMessage(loadError, t("quote.errors.load")))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (!quoteId) {
      setError(t("quote.errors.missingId"))
      setIsLoading(false)
      return
    }

    void loadQuote(Number(quoteId))
  }, [loadQuote, quoteId, t])

  function updateField(field: keyof QuoteFormState, value: string) {
    setSavedMessage(null)
    setForm((current) => (current ? { ...current, [field]: value } : current))
  }

  function updateLineItem(index: number, field: keyof QuoteLineItemForm, value: string | boolean) {
    setSavedMessage(null)
    setForm((current) => {
      if (!current) {
        return current
      }

      const line_items = [...current.line_items]
      line_items[index] = {
        ...line_items[index],
        [field]: value,
      }

      return { ...current, line_items }
    })
  }

  function addLineItem() {
    setSavedMessage(null)
    setForm((current) =>
      current
        ? {
            ...current,
            line_items: [...current.line_items, emptyLineItem()],
          }
        : current
    )
  }

  function removeLineItem(index: number) {
    setSavedMessage(null)
    setForm((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        line_items: current.line_items.filter((_, itemIndex) => itemIndex !== index),
      }
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!quote || !form) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await updateQuote(quote.id, {
        status: form.status,
        customer_name: form.customer_name.trim(),
        customer_company: form.customer_company.trim(),
        customer_email: form.customer_email.trim() || null,
        customer_phone: form.customer_phone.trim(),
        customer_address: form.customer_address.trim(),
        locale: form.locale,
        title: form.title.trim(),
        job_summary: form.job_summary.trim(),
        assumptions: form.assumptions.trim(),
        notes: form.notes.trim(),
        payment_terms: form.payment_terms.trim(),
        currency: form.currency.trim().toUpperCase(),
        tax_rate: Number(form.tax_rate || "0") / 100,
        valid_until: form.valid_until || undefined,
        line_items: form.line_items
          .filter((item) => item.description.trim() || item.unit_price.trim())
          .map((item) => ({
            description: item.description.trim(),
            quantity: Number(item.quantity || "0"),
            unit: item.unit.trim() || "job",
            unit_price_cents: parseMoneyToCents(item.unit_price),
            needs_review: item.needs_review || parseMoneyToCents(item.unit_price) === null,
            source: "manual",
          })),
      })

      setQuote(response)
      setForm(toFormState(response))
      setSavedMessage(t("quote.footer.saved"))
    } catch (saveError) {
      setError(toErrorMessage(saveError, t("quote.errors.save")))
    } finally {
      setIsSaving(false)
    }
  }

  const preview = useMemo(() => {
    if (!form) {
      return { subtotal: 0, tax: 0, total: 0, pricingComplete: false }
    }

    const subtotal = form.line_items.reduce((total, item) => total + lineItemPreviewTotal(item), 0)
    const tax = Math.round(subtotal * (Number(form.tax_rate || "0") / 100))
    const pricingComplete =
      form.line_items.length > 0 &&
      form.line_items.every(
        (item) => item.description.trim() && parseMoneyToCents(item.unit_price) !== null && !item.needs_review
      )

    return {
      subtotal,
      tax,
      total: subtotal + tax,
      pricingComplete,
    }
  }, [form])

  if (isLoading) {
    return (
      <div className="flex min-h-[32rem] items-center justify-center rounded-[2rem] border border-dashed border-border/70 bg-white/60">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <RiLoader4Line className="size-5 animate-spin" />
          {t("quote.loading")}
        </div>
      </div>
    )
  }

  if (error && !quote) {
    return (
      <Card className="border-white/60 bg-white/75">
        <CardContent className="flex min-h-80 flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="space-y-2">
            <p className="font-heading text-2xl font-semibold tracking-tight">
              {t("quote.openErrorTitle")}
            </p>
            <p className="text-sm leading-6 text-muted-foreground">{error}</p>
          </div>
          <Button asChild variant="outline" className="h-11 rounded-full px-5 text-sm">
            <Link to="/">
              <RiArrowLeftLine className="size-4" />
              {t("quote.backToDashboard")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!quote || !form) {
    return null
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
      <div className="grid gap-6 xl:sticky xl:top-8 xl:self-start">
        <Card className="border-white/60 bg-white/75">
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                  {t("quote.workspaceShell")}
                </p>
                <CardTitle className="mt-2 text-3xl">{quote.quote_number}</CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-white/70 uppercase">
                  {t(`common.localeShort.${form.locale}`)}
                </Badge>
                <QuoteStatusBadge status={form.status} className="uppercase" />
              </div>
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              {t("quote.assistantDescription")}
            </p>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
                  <RiChat3Line className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t("quote.assistantTitle")}</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t("quote.assistantDescription")}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {t("quote.lastSaved")}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/85">
                {formatDateTime(quote.updated_at, locale)}
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {t("quote.validUntil")}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/85">
                {formatDate(form.valid_until, locale)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/60 bg-white/75">
          <CardHeader>
            <CardTitle>{t("quote.totalsPreview")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <SummaryRow label={t("quote.subtotal")} value={formatCurrency(preview.subtotal, form.currency, locale)} />
            <SummaryRow
              label={t("quote.tax", { value: formatPercent(Number(form.tax_rate || "0") / 100, locale) })}
              value={formatCurrency(preview.tax, form.currency, locale)}
            />
            <SummaryRow label={t("quote.total")} value={formatCurrency(preview.total, form.currency, locale)} emphasized />
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
              {preview.pricingComplete ? t("quote.pricingReady") : t("quote.pricingIncomplete")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/60 bg-white/75">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                {t("quote.editorEyebrow")}
              </p>
              <CardTitle className="mt-2 text-3xl">{t("quote.editorTitle")}</CardTitle>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="h-10 rounded-full px-4 text-sm">
                <Link to="/">
                  <RiArrowLeftLine className="size-4" />
                  {t("quote.back")}
                </Link>
              </Button>
              <Button
                type="submit"
                form="quote-workspace-form"
                className="h-10 rounded-full px-4 text-sm font-semibold shadow-lg shadow-primary/20"
                disabled={isSaving}
              >
                {isSaving ? <RiLoader4Line className="size-4 animate-spin" /> : <RiSaveLine className="size-4" />}
                {isSaving ? t("quote.saving") : t("quote.saveQuote")}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{quote.quote_number}</span>
            <span>•</span>
            <span>{t("quote.defaultTax", { value: formatPercent(Number(form.tax_rate || "0") / 100, locale) })}</span>
          </div>
        </CardHeader>

        <CardContent>
          <form id="quote-workspace-form" className="grid gap-6" onSubmit={handleSubmit}>
            <section className="grid gap-4 rounded-[1.75rem] border border-border/60 bg-background/65 p-5 sm:grid-cols-2">
              <SectionTitle icon={RiUserLine} title={t("quote.sections.customerBasics")} />

              <FieldBlock label={t("quote.fields.quoteTitle.label")} hint={t("quote.fields.quoteTitle.hint")}>
                <Input
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder={t("quote.fields.quoteTitle.placeholder")}
                />
              </FieldBlock>
              <FieldBlock label={t("quote.fields.status.label")} hint={t("quote.fields.status.hint")}>
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value)}
                  className="flex h-11 w-full rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground shadow-sm transition-all outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                >
                  <option value="draft">{t("status.draft")}</option>
                  <option value="ready">{t("status.ready")}</option>
                  <option value="sent">{t("status.sent")}</option>
                </select>
              </FieldBlock>
              <FieldBlock label={t("quote.fields.customerName.label")} hint={t("quote.fields.customerName.hint")}>
                <Input
                  value={form.customer_name}
                  onChange={(event) => updateField("customer_name", event.target.value)}
                  placeholder={t("quote.fields.customerName.placeholder")}
                />
              </FieldBlock>
              <FieldBlock label={t("quote.fields.company.label")} hint={t("quote.fields.company.hint")}>
                <Input
                  value={form.customer_company}
                  onChange={(event) => updateField("customer_company", event.target.value)}
                  placeholder={t("quote.fields.company.placeholder")}
                />
              </FieldBlock>
              <FieldBlock label={t("quote.fields.email.label")} hint={t("quote.fields.email.hint")}>
                <Input
                  type="email"
                  value={form.customer_email}
                  onChange={(event) => updateField("customer_email", event.target.value)}
                  placeholder={t("quote.fields.email.placeholder")}
                />
              </FieldBlock>
              <FieldBlock label={t("quote.fields.phone.label")} hint={t("quote.fields.phone.hint")}>
                <Input
                  value={form.customer_phone}
                  onChange={(event) => updateField("customer_phone", event.target.value)}
                  placeholder={t("quote.fields.phone.placeholder")}
                />
              </FieldBlock>
              <div className="sm:col-span-2">
                <FieldBlock label={t("quote.fields.address.label")} hint={t("quote.fields.address.hint")}>
                  <Textarea
                    value={form.customer_address}
                    onChange={(event) => updateField("customer_address", event.target.value)}
                    placeholder={t("quote.fields.address.placeholder")}
                  />
                </FieldBlock>
              </div>
            </section>

            <section className="grid gap-4 rounded-[1.75rem] border border-border/60 bg-background/65 p-5 sm:grid-cols-2">
              <SectionTitle icon={RiFileTextLine} title={t("quote.sections.scopeAndTerms")} />

              <FieldBlock label={t("quote.fields.locale.label")} hint={t("quote.fields.locale.hint")}>
                <select
                  value={form.locale}
                  onChange={(event) => updateField("locale", event.target.value)}
                  className="flex h-11 w-full rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground shadow-sm transition-all outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                >
                  {supportedLocales.map((localeOption) => (
                    <option key={localeOption} value={localeOption}>
                      {t(`app.language.${localeOption}`)}
                    </option>
                  ))}
                </select>
              </FieldBlock>
              <FieldBlock label={t("quote.fields.currency.label")} hint={t("quote.fields.currency.hint")}>
                <Input
                  value={form.currency}
                  onChange={(event) => updateField("currency", event.target.value)}
                  placeholder={t("quote.fields.currency.placeholder")}
                  maxLength={8}
                />
              </FieldBlock>
              <FieldBlock label={t("quote.fields.validUntil.label")} hint={t("quote.fields.validUntil.hint")}>
                <Input type="date" value={form.valid_until} onChange={(event) => updateField("valid_until", event.target.value)} />
              </FieldBlock>
              <div className="sm:col-span-2">
                <FieldBlock label={t("quote.fields.jobSummary.label")} hint={t("quote.fields.jobSummary.hint")}>
                  <Textarea
                    value={form.job_summary}
                    onChange={(event) => updateField("job_summary", event.target.value)}
                    placeholder={t("quote.fields.jobSummary.placeholder")}
                  />
                </FieldBlock>
              </div>
              <div className="sm:col-span-2">
                <FieldBlock label={t("quote.fields.assumptions.label")} hint={t("quote.fields.assumptions.hint")}>
                  <Textarea
                    value={form.assumptions}
                    onChange={(event) => updateField("assumptions", event.target.value)}
                    placeholder={t("quote.fields.assumptions.placeholder")}
                  />
                </FieldBlock>
              </div>
              <div className="sm:col-span-2">
                <FieldBlock label={t("quote.fields.paymentTerms.label")} hint={t("quote.fields.paymentTerms.hint")}>
                  <Textarea
                    value={form.payment_terms}
                    onChange={(event) => updateField("payment_terms", event.target.value)}
                    placeholder={t("quote.fields.paymentTerms.placeholder")}
                  />
                </FieldBlock>
              </div>
              <div className="sm:col-span-2">
                <FieldBlock label={t("quote.fields.internalNotes.label")} hint={t("quote.fields.internalNotes.hint")}>
                  <Textarea
                    value={form.notes}
                    onChange={(event) => updateField("notes", event.target.value)}
                    placeholder={t("quote.fields.internalNotes.placeholder")}
                  />
                </FieldBlock>
              </div>
            </section>

            <section className="grid gap-4 rounded-[1.75rem] border border-border/60 bg-background/65 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <SectionTitle icon={RiMoneyDollarCircleLine} title={t("quote.sections.lineItemsAndPricing")} />
                <Button type="button" variant="outline" className="h-10 rounded-full px-4 text-sm" onClick={addLineItem}>
                  <RiAddLine className="size-4" />
                  {t("quote.actions.addLineItem")}
                </Button>
              </div>

              {form.line_items.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/60 px-5 py-8 text-center">
                  <p className="font-medium text-foreground">{t("quote.lineItems.emptyTitle")}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t("quote.lineItems.emptyDescription")}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {form.line_items.map((item, index) => (
                    <div key={`line-item-${index}`} className="rounded-[1.5rem] border border-border/60 bg-white/70 p-4">
                      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_0.55fr_0.55fr_0.7fr_auto]">
                        <FieldBlock label={t("quote.fields.description.label")} hint={t("quote.fields.description.hint")}>
                          <Input
                            value={item.description}
                            onChange={(event) => updateLineItem(index, "description", event.target.value)}
                            placeholder={t("quote.fields.description.placeholder")}
                          />
                        </FieldBlock>
                        <FieldBlock label={t("quote.fields.quantity.label")} hint={t("quote.fields.quantity.hint")}>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.quantity}
                            onChange={(event) => updateLineItem(index, "quantity", event.target.value)}
                            placeholder={t("quote.fields.quantity.placeholder")}
                          />
                        </FieldBlock>
                        <FieldBlock label={t("quote.fields.unit.label")} hint={t("quote.fields.unit.hint")}>
                          <Input
                            value={item.unit}
                            onChange={(event) => updateLineItem(index, "unit", event.target.value)}
                            placeholder={t("quote.fields.unit.placeholder")}
                          />
                        </FieldBlock>
                        <FieldBlock label={t("quote.fields.unitPrice.label")} hint={t("quote.fields.unitPrice.hint")}>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(event) => updateLineItem(index, "unit_price", event.target.value)}
                            placeholder={t("quote.fields.unitPrice.placeholder")}
                          />
                        </FieldBlock>
                        <div className="flex items-end justify-end">
                          <Button type="button" variant="ghost" className="h-11 rounded-full px-4 text-sm" onClick={() => removeLineItem(index)}>
                            <RiDeleteBinLine className="size-4" />
                            {t("quote.actions.remove")}
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                        <label className="inline-flex items-center gap-3 text-sm text-foreground">
                          <input
                            type="checkbox"
                            checked={item.needs_review}
                            onChange={(event) => updateLineItem(index, "needs_review", event.target.checked)}
                            className="size-4 rounded border-border text-primary focus:ring-primary"
                          />
                          {t("quote.lineItems.needsReview")}
                        </label>

                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            {t("quote.lineItems.lineTotalPreview")}
                          </p>
                          <p className="mt-1 font-heading text-xl font-semibold tracking-tight">
                            {formatCurrency(lineItemPreviewTotal(item), form.currency, locale)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-border/60 bg-white/70 px-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {savedMessage ?? t("quote.footer.idle")}
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t("quote.footer.backendOwned")}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" className="h-11 rounded-full px-5 text-sm" onClick={() => void loadQuote(quote.id)}>
                  <RiLoader4Line className={isLoading ? "size-4 animate-spin" : "size-4"} />
                  {t("quote.actions.reload")}
                </Button>
                <Button type="submit" className="h-11 rounded-full px-5 text-sm font-semibold shadow-lg shadow-primary/20" disabled={isSaving}>
                  {isSaving ? <RiLoader4Line className="size-4 animate-spin" /> : <RiCheckLine className="size-4" />}
                  {isSaving ? t("quote.savingQuote") : t("quote.saveQuote")}
                </Button>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function toFormState(quote: Quote): QuoteFormState {
  return {
    status: quote.status,
    customer_name: quote.customer_name,
    customer_company: quote.customer_company,
    customer_email: quote.customer_email ?? "",
    customer_phone: quote.customer_phone,
    customer_address: quote.customer_address,
    locale: quote.locale,
    title: quote.title,
    job_summary: quote.job_summary,
    assumptions: quote.assumptions,
    notes: quote.notes,
    payment_terms: quote.payment_terms,
    currency: quote.currency,
    tax_rate: String(Number((quote.tax_rate * 100).toFixed(2))),
    valid_until: quote.valid_until,
    line_items: quote.line_items.map(toLineItemForm),
  }
}

function toLineItemForm(item: QuoteLineItem): QuoteLineItemForm {
  return {
    description: item.description,
    quantity: String(item.quantity),
    unit: item.unit,
    unit_price: item.unit_price_cents === null ? "" : formatMoneyInput(item.unit_price_cents),
    needs_review: item.needs_review,
  }
}

function parseMoneyToCents(value: string): number | null {
  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  if (Number.isNaN(parsed)) {
    return null
  }

  return Math.round(parsed * 100)
}

function formatMoneyInput(value: number): string {
  return (value / 100).toFixed(value % 100 === 0 ? 0 : 2)
}

function lineItemPreviewTotal(item: QuoteLineItemForm): number {
  const unitPrice = parseMoneyToCents(item.unit_price)
  if (unitPrice === null) {
    return 0
  }

  return Math.round(Number(item.quantity || "0") * unitPrice)
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof RiStickyNoteLine
  title: string
}) {
  return (
    <div className="sm:col-span-2 flex items-center gap-3 pb-1">
      <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="font-heading text-lg font-semibold tracking-tight text-foreground">{title}</p>
      </div>
    </div>
  )
}

function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string
  hint: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-2">
      <div className="space-y-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <p className="text-sm leading-6 text-muted-foreground">{hint}</p>
      </div>
      {children}
    </label>
  )
}

function SummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string
  value: string
  emphasized?: boolean
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={emphasized ? "font-heading text-xl font-semibold tracking-tight" : "text-sm font-medium text-foreground"}>
        {value}
      </span>
    </div>
  )
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

export default QuoteWorkspacePage
