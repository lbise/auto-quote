import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react"
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
import { Link, useParams } from "react-router-dom"

import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getQuote, updateQuote, type Quote, type QuoteLineItem, type QuoteStatus } from "@/lib/api"
import { formatCurrency, formatDate, formatDateTime, formatPercent } from "@/lib/format"

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
  const { quoteId } = useParams<{ quoteId: string }>()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [form, setForm] = useState<QuoteFormState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!quoteId) {
      setError("Quote ID is missing")
      setIsLoading(false)
      return
    }

    void loadQuote(Number(quoteId))
  }, [quoteId])

  async function loadQuote(id: number) {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getQuote(id)
      setQuote(response)
      setForm(toFormState(response))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load quote")
    } finally {
      setIsLoading(false)
    }
  }

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
      setSavedMessage("Quote saved. Backend totals are now up to date.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save quote")
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
          Loading quote workspace...
        </div>
      </div>
    )
  }

  if (error && !quote) {
    return (
      <Card className="border-white/60 bg-white/75">
        <CardContent className="flex min-h-80 flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="space-y-2">
            <p className="font-heading text-2xl font-semibold tracking-tight">Could not open quote</p>
            <p className="text-sm leading-6 text-muted-foreground">{error}</p>
          </div>
          <Button asChild variant="outline" className="h-11 rounded-full px-5 text-sm">
            <Link to="/">
              <RiArrowLeftLine className="size-4" />
              Back to dashboard
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
                  Workspace shell
                </p>
                <CardTitle className="mt-2 text-3xl">{quote.quote_number}</CardTitle>
              </div>
              <QuoteStatusBadge status={form.status} className="uppercase" />
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              The manual editor is live now. The conversational assistant slot is ready for the next phase and will use this saved quote shape.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
                  <RiChat3Line className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Assistant panel arrives next</p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Next phase will let the owner chat here and apply structured updates into the draft on the right.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Last saved
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/85">
                {formatDateTime(quote.updated_at)}
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Valid until
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/85">{formatDate(form.valid_until)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/60 bg-white/75">
          <CardHeader>
            <CardTitle>Totals preview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <SummaryRow label="Subtotal" value={formatCurrency(preview.subtotal, form.currency)} />
            <SummaryRow label={`Tax (${formatPercent(Number(form.tax_rate || "0") / 100)})`} value={formatCurrency(preview.tax, form.currency)} />
            <SummaryRow label="Total" value={formatCurrency(preview.total, form.currency)} emphasized />
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
              {preview.pricingComplete
                ? "All line items are priced and ready for the next phase of automation."
                : "At least one line item still needs pricing or review before the quote is fully ready."}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/60 bg-white/75">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Quote editor
              </p>
              <CardTitle className="mt-2 text-3xl">Shape the draft before AI starts helping</CardTitle>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="h-10 rounded-full px-4 text-sm">
                <Link to="/">
                  <RiArrowLeftLine className="size-4" />
                  Back
                </Link>
              </Button>
              <Button
                type="submit"
                form="quote-workspace-form"
                className="h-10 rounded-full px-4 text-sm font-semibold shadow-lg shadow-primary/20"
                disabled={isSaving}
              >
                {isSaving ? <RiLoader4Line className="size-4 animate-spin" /> : <RiSaveLine className="size-4" />}
                {isSaving ? "Saving..." : "Save quote"}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{quote.quote_number}</span>
            <span>•</span>
            <span>{formatPercent(Number(form.tax_rate || "0") / 100)} default tax</span>
          </div>
        </CardHeader>

        <CardContent>
          <form id="quote-workspace-form" className="grid gap-6" onSubmit={handleSubmit}>
            <section className="grid gap-4 rounded-[1.75rem] border border-border/60 bg-background/65 p-5 sm:grid-cols-2">
              <SectionTitle icon={RiUserLine} title="Customer and quote basics" />

              <FieldBlock label="Quote title" hint="Short label shown on lists and previews.">
                <Input value={form.title} onChange={(event) => updateField("title", event.target.value)} placeholder="Office repainting quote" />
              </FieldBlock>
              <FieldBlock label="Status" hint="Keep drafts editable until they are ready to share.">
                <select
                  value={form.status}
                  onChange={(event) => updateField("status", event.target.value)}
                  className="flex h-11 w-full rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground shadow-sm transition-all outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                >
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="sent">Sent</option>
                </select>
              </FieldBlock>
              <FieldBlock label="Customer name" hint="Primary contact for the quote.">
                <Input value={form.customer_name} onChange={(event) => updateField("customer_name", event.target.value)} placeholder="Morgan Lee" />
              </FieldBlock>
              <FieldBlock label="Company" hint="Optional company or site name.">
                <Input value={form.customer_company} onChange={(event) => updateField("customer_company", event.target.value)} placeholder="Harbor Studio" />
              </FieldBlock>
              <FieldBlock label="Email" hint="Useful for quote follow-up and later send flows.">
                <Input type="email" value={form.customer_email} onChange={(event) => updateField("customer_email", event.target.value)} placeholder="morgan@harbor.studio" />
              </FieldBlock>
              <FieldBlock label="Phone" hint="Optional but helpful for quick clarifications.">
                <Input value={form.customer_phone} onChange={(event) => updateField("customer_phone", event.target.value)} placeholder="(555) 901-2233" />
              </FieldBlock>
              <div className="sm:col-span-2">
                <FieldBlock label="Address" hint="Customer or job site address.">
                  <Textarea value={form.customer_address} onChange={(event) => updateField("customer_address", event.target.value)} placeholder={"410 River Street\nSuite 8\nPortland, OR 97204"} />
                </FieldBlock>
              </div>
            </section>

            <section className="grid gap-4 rounded-[1.75rem] border border-border/60 bg-background/65 p-5 sm:grid-cols-2">
              <SectionTitle icon={RiFileTextLine} title="Scope and terms" />

              <FieldBlock label="Currency" hint="ISO code used for every line item.">
                <Input value={form.currency} onChange={(event) => updateField("currency", event.target.value)} placeholder="USD" maxLength={8} />
              </FieldBlock>
              <FieldBlock label="Valid until" hint="The quote remains open until this date.">
                <Input type="date" value={form.valid_until} onChange={(event) => updateField("valid_until", event.target.value)} />
              </FieldBlock>
              <div className="sm:col-span-2">
                <FieldBlock label="Job summary" hint="What the work actually covers.">
                  <Textarea value={form.job_summary} onChange={(event) => updateField("job_summary", event.target.value)} placeholder="Interior repainting for a small office with two meeting rooms." />
                </FieldBlock>
              </div>
              <div className="sm:col-span-2">
                <FieldBlock label="Assumptions" hint="Use this for dependencies, access constraints, or exclusions.">
                  <Textarea value={form.assumptions} onChange={(event) => updateField("assumptions", event.target.value)} placeholder="Client provides clear access to the site during working hours." />
                </FieldBlock>
              </div>
              <div className="sm:col-span-2">
                <FieldBlock label="Payment terms" hint="Loaded from settings but still editable per quote.">
                  <Textarea value={form.payment_terms} onChange={(event) => updateField("payment_terms", event.target.value)} placeholder="Payment due within 14 days of acceptance." />
                </FieldBlock>
              </div>
              <div className="sm:col-span-2">
                <FieldBlock label="Internal notes" hint="Visible only to you in the workspace for now.">
                  <Textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Follow up with material lead time before sending." />
                </FieldBlock>
              </div>
            </section>

            <section className="grid gap-4 rounded-[1.75rem] border border-border/60 bg-background/65 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <SectionTitle icon={RiMoneyDollarCircleLine} title="Line items and pricing" />
                <Button type="button" variant="outline" className="h-10 rounded-full px-4 text-sm" onClick={addLineItem}>
                  <RiAddLine className="size-4" />
                  Add line item
                </Button>
              </div>

              {form.line_items.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/60 px-5 py-8 text-center">
                  <p className="font-medium text-foreground">No line items yet</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Add at least one priced line item so totals can be calculated and the quote can move forward.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {form.line_items.map((item, index) => (
                    <div key={`line-item-${index}`} className="rounded-[1.5rem] border border-border/60 bg-white/70 p-4">
                      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_0.55fr_0.55fr_0.7fr_auto]">
                        <FieldBlock label="Description" hint="Customer-facing line item label.">
                          <Input value={item.description} onChange={(event) => updateLineItem(index, "description", event.target.value)} placeholder="Interior wall preparation and painting" />
                        </FieldBlock>
                        <FieldBlock label="Quantity" hint="Supports decimals when needed.">
                          <Input type="number" min="0" step="0.1" value={item.quantity} onChange={(event) => updateLineItem(index, "quantity", event.target.value)} placeholder="1" />
                        </FieldBlock>
                        <FieldBlock label="Unit" hint="Examples: job, day, room.">
                          <Input value={item.unit} onChange={(event) => updateLineItem(index, "unit", event.target.value)} placeholder="job" />
                        </FieldBlock>
                        <FieldBlock label="Unit price" hint="Leave blank to keep it in review.">
                          <Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(event) => updateLineItem(index, "unit_price", event.target.value)} placeholder="1500" />
                        </FieldBlock>
                        <div className="flex items-end justify-end">
                          <Button type="button" variant="ghost" className="h-11 rounded-full px-4 text-sm" onClick={() => removeLineItem(index)}>
                            <RiDeleteBinLine className="size-4" />
                            Remove
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
                          Needs review
                        </label>

                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Line total preview
                          </p>
                          <p className="mt-1 font-heading text-xl font-semibold tracking-tight">
                            {formatCurrency(lineItemPreviewTotal(item), form.currency)}
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
                  {savedMessage ?? "Save the draft after edits so the backend stays authoritative."}
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Backend-controlled totals and validity
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" className="h-11 rounded-full px-5 text-sm" onClick={() => void loadQuote(quote.id)}>
                  <RiLoader4Line className={isLoading ? "size-4 animate-spin" : "size-4"} />
                  Reload
                </Button>
                <Button type="submit" className="h-11 rounded-full px-5 text-sm font-semibold shadow-lg shadow-primary/20" disabled={isSaving}>
                  {isSaving ? <RiLoader4Line className="size-4 animate-spin" /> : <RiCheckLine className="size-4" />}
                  {isSaving ? "Saving quote..." : "Save quote"}
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

export default QuoteWorkspacePage
