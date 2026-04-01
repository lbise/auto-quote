import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  RiAddLine,
  RiArrowLeftLine,
  RiChat3Line,
  RiCloseLine,
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiFileTextLine,
  RiLoader4Line,
  RiMic2Line,
  RiMoneyDollarCircleLine,
  RiPrinterLine,
  RiRobot2Line,
  RiSaveLine,
  RiSendPlaneLine,
  RiStopCircleLine,
  RiStickyNoteLine,
  RiUserLine,
} from "@remixicon/react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate, useParams } from "react-router-dom"

import { QuotePrintSheet } from "@/components/quotes/quote-print-sheet"
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useVoiceRecorder } from "@/hooks/use-voice-recorder"
import {
  deleteQuote,
  getQuote,
  getSettings,
  sendQuoteMessage,
  updateQuote,
  type BusinessSettings,
  type PricedItem,
  type Quote,
  type QuoteLineItem,
  type QuoteStatus,
} from "@/lib/api"
import { formatCurrency, formatDate, formatDateTime, formatPercent } from "@/lib/format"
import { supportedLocales, type AppLocale } from "@/lib/locale"
import { calculatePricedItemQuantity, formatNumberInput, parseNumberInput, type VolumeInputUnit } from "@/lib/priced-items"

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

type CatalogInsertState = {
  priced_item_id: string
  fixed_quantity: string
  area_width: string
  area_length: string
  volume_amount: string
  volume_unit: VolumeInputUnit
}

const emptyLineItem = (): QuoteLineItemForm => ({
  description: "",
  quantity: "1",
  unit: "job",
  unit_price: "",
  needs_review: true,
})

const emptyCatalogInsertState: CatalogInsertState = {
  priced_item_id: "",
  fixed_quantity: "1",
  area_width: "",
  area_length: "",
  volume_amount: "",
  volume_unit: "l",
}

function QuoteWorkspacePage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const navigate = useNavigate()
  const { quoteId } = useParams<{ quoteId: string }>()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [form, setForm] = useState<QuoteFormState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isChatting, setIsChatting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chatError, setChatError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [chatInput, setChatInput] = useState("")
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [catalogInsert, setCatalogInsert] = useState<CatalogInsertState>(emptyCatalogInsertState)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const voice = useVoiceRecorder({
    language: form?.locale,
    onTranscript: (text) => {
      setChatInput((current) => {
        const trimmed = current.trimEnd()
        return trimmed ? `${trimmed} ${text}` : text
      })
    },
  })

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

  useEffect(() => {
    let active = true

    void getSettings()
      .then((response) => {
        if (active) {
          setBusinessSettings(response)
        }
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [])

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [quote?.messages.length])

  function updateField(field: keyof QuoteFormState, value: string) {
    setSavedMessage(null)
    setChatError(null)
    setForm((current) => (current ? { ...current, [field]: value } : current))
  }

  function updateLineItem(index: number, field: keyof QuoteLineItemForm, value: string | boolean) {
    setSavedMessage(null)
    setChatError(null)
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

  function updateCatalogInsertField(field: keyof CatalogInsertState, value: string) {
    setSavedMessage(null)
    setCatalogError(null)
    setCatalogInsert((current) => ({ ...current, [field]: value }))
  }

  function selectPricedItem(itemId: string) {
    setSavedMessage(null)
    setCatalogError(null)
    setCatalogInsert(buildCatalogInsertState(activePricedItems.find((item) => item.id === itemId) ?? null))
  }

  function addLineItem() {
    setSavedMessage(null)
    setChatError(null)
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
    setChatError(null)
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
        tax_rate: (parseNumberInput(form.tax_rate) ?? 0) / 100,
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
    const tax = Math.round(subtotal * ((parseNumberInput(form.tax_rate) ?? 0) / 100))
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

  const activePricedItems = useMemo(
    () => (businessSettings?.priced_items ?? []).filter((item) => item.is_active),
    [businessSettings]
  )

  const selectedPricedItem = useMemo(
    () =>
      activePricedItems.find((item) => item.id === catalogInsert.priced_item_id) ?? activePricedItems[0] ?? null,
    [activePricedItems, catalogInsert.priced_item_id]
  )

  const pricedItemPreview = useMemo(() => {
    if (!selectedPricedItem) {
      return null
    }

    const quantity = calculatePricedItemQuantity(selectedPricedItem.pricing_mode, catalogInsert)

    return {
      description: selectedPricedItem.description || selectedPricedItem.name,
      quantity,
      unit: selectedPricedItem.unit,
      totalCents: quantity === null ? 0 : Math.round(quantity * selectedPricedItem.unit_price_cents),
    }
  }, [catalogInsert, selectedPricedItem])

  const hasUnsavedChanges = useMemo(() => {
    if (!quote || !form) {
      return false
    }

    return JSON.stringify(form) !== JSON.stringify(toFormState(quote))
  }, [form, quote])

  useEffect(() => {
    if (activePricedItems.length === 0) {
      setCatalogInsert(emptyCatalogInsertState)
      return
    }

    setCatalogInsert((current) => {
      if (activePricedItems.some((item) => item.id === current.priced_item_id)) {
        return current
      }

      return buildCatalogInsertState(activePricedItems[0])
    })
  }, [activePricedItems])

  async function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!quote || !chatInput.trim() || hasUnsavedChanges) {
      return
    }

    setIsChatting(true)
    setChatError(null)

    try {
      const response = await sendQuoteMessage(quote.id, { message: chatInput.trim() })
      setQuote(response.quote)
      setForm(toFormState(response.quote))
      setChatInput("")
      setSavedMessage(
        response.action === "update_quote" ? t("quote.footer.saved") : null
      )
    } catch (sendError) {
      setChatError(toErrorMessage(sendError, t("quote.chat.errors.send")))
    } finally {
      setIsChatting(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  function addPricedItemToQuote() {
    if (!form || !selectedPricedItem) {
      return
    }

    const quantity = calculatePricedItemQuantity(selectedPricedItem.pricing_mode, catalogInsert)
    if (quantity === null) {
      setCatalogError(t(`quote.pricedItems.errors.${selectedPricedItem.pricing_mode}`))
      return
    }

    setCatalogError(null)
    setSavedMessage(null)
    setChatError(null)
    setForm((current) =>
      current
        ? {
            ...current,
            line_items: [
              ...current.line_items,
              {
                description: selectedPricedItem.description || selectedPricedItem.name,
                quantity: formatNumberInput(quantity),
                unit: selectedPricedItem.unit,
                unit_price: formatMoneyInput(selectedPricedItem.unit_price_cents),
                needs_review: false,
              },
            ],
          }
        : current
    )
    setCatalogInsert(buildCatalogInsertState(selectedPricedItem))
  }

  async function handleDeleteQuote() {
    if (!quote) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      await deleteQuote(quote.id)
      navigate("/", { replace: true })
    } catch (deleteError) {
      setError(toErrorMessage(deleteError, t("quote.errors.delete")))
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[28rem] items-center justify-center rounded-xl border border-dashed border-border bg-card">
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <RiLoader4Line className="size-4 animate-spin" />
          {t("quote.loading")}
        </div>
      </div>
    )
  }

  if (error && !quote) {
    return (
      <Card>
        <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="space-y-1.5">
            <p className="font-heading text-lg font-semibold tracking-tight">
              {t("quote.openErrorTitle")}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">{error}</p>
          </div>
          <Button asChild variant="outline">
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

  const reviewItems = form.line_items
    .map((item, index) => {
      const missingPrice = parseMoneyToCents(item.unit_price) === null
      const flagged = item.needs_review || missingPrice

      if (!flagged) {
        return null
      }

      return {
        key: `${index}-${item.description}`,
        label: item.description.trim() || t("quote.review.untitledLineItem", { index: index + 1 }),
        reason: missingPrice ? t("quote.review.reasons.missingPrice") : t("quote.review.reasons.markedForReview"),
      }
    })
    .filter((item): item is { key: string; label: string; reason: string } => item !== null)

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[0.4fr_0.6fr]" data-print-hidden="true">
        {/* ── Left column: Sidebar with Tabs ── */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <Card className="flex flex-col overflow-hidden">
            {/* Sidebar header */}
            <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <QuoteStatusBadge status={form.status} />
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  {quote.quote_number}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{formatDateTime(quote.updated_at, locale)}</span>
              </div>
            </div>

            <Separator />

            {/* Tabs */}
            <Tabs defaultValue="chat" className="flex-1">
              <TabsList className="mx-5 mt-4 w-auto">
                <TabsTrigger value="chat" className="gap-1.5">
                  <RiChat3Line className="size-3.5" />
                  {t("quote.tabs.chat")}
                </TabsTrigger>
                <TabsTrigger value="totals" className="gap-1.5">
                  <RiMoneyDollarCircleLine className="size-3.5" />
                  {t("quote.tabs.totals")}
                </TabsTrigger>
                <TabsTrigger value="review" className="gap-1.5">
                  <RiErrorWarningLine className="size-3.5" />
                  {t("quote.tabs.review")}
                  {reviewItems.length > 0 && (
                    <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                      {reviewItems.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* ── Chat Tab ── */}
              <TabsContent value="chat" className="flex flex-col px-5 pb-5">
                {/* Chat hint */}
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {hasUnsavedChanges ? t("quote.chat.hintSaveFirst") : t("quote.chat.hintReady")}
                </p>

                {/* Chat messages */}
                <div
                  ref={chatScrollRef}
                  className="mt-3 flex max-h-[28rem] min-h-[14rem] flex-col gap-2.5 overflow-y-auto rounded-lg border border-border/60 bg-secondary/30 p-3"
                >
                  {quote.messages.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <RiRobot2Line className="size-5" />
                      </div>
                      <p className="font-heading text-sm font-semibold tracking-tight">
                        {t("quote.chat.emptyTitle")}
                      </p>
                      <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                        {t("quote.chat.emptyDescription")}
                      </p>
                    </div>
                  ) : (
                    quote.messages.map((message) => {
                      const isAssistant = message.role === "assistant"

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={[
                              "max-w-[90%] rounded-lg px-3.5 py-2.5 text-sm",
                              isAssistant
                                ? "border border-border/60 bg-card text-foreground shadow-sm"
                                : "bg-primary text-primary-foreground",
                            ].join(" ")}
                          >
                            {/* Role & action badges */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isAssistant ? "text-primary" : "text-primary-foreground/70"}`}>
                                {isAssistant ? t("quote.chat.roles.assistant") : t("quote.chat.roles.owner")}
                              </span>
                              {message.assistant_action ? (
                                <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                                  {t(`quote.chat.actions.${message.assistant_action}`)}
                                </Badge>
                              ) : null}
                            </div>

                            <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}

                  {isChatting && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3.5 py-2.5 shadow-sm">
                        <RiLoader4Line className="size-3.5 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">{t("quote.chat.sending")}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat input */}
                <form className="mt-3 grid gap-2.5" onSubmit={handleChatSubmit}>
                  {/* Recording indicator */}
                  {voice.state === "recording" && (
                    <div className="flex items-center gap-2.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                      <span className="relative flex size-2.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                        <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
                      </span>
                      <span className="text-xs font-medium text-primary">
                        {t("quote.voice.recording")}
                      </span>
                      <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
                        {Math.floor(voice.elapsed / 60)}:{String(voice.elapsed % 60).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        onClick={voice.cancel}
                        className="ml-1 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-destructive"
                        aria-label={t("quote.voice.cancel")}
                      >
                        <RiCloseLine className="size-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Transcribing indicator */}
                  {voice.state === "transcribing" && (
                    <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
                      <RiLoader4Line className="size-3.5 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {t("quote.voice.transcribing")}
                      </span>
                    </div>
                  )}

                  <Textarea
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder={t("quote.chat.inputPlaceholder")}
                    className="min-h-20 resize-none text-[13px]"
                    disabled={voice.state === "recording" || voice.state === "transcribing"}
                  />

                  {/* Voice error */}
                  {voice.state === "error" && voice.error ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                      {t(voice.error, { defaultValue: voice.error })}
                    </div>
                  ) : null}

                  {chatError ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                      {chatError}
                    </div>
                  ) : null}

                   <div className="flex gap-2">
                    {voice.supported && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {voice.state === "recording" ? (
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon-sm"
                              onClick={voice.stop}
                              aria-label={t("quote.voice.stop")}
                            >
                              <RiStopCircleLine className="size-4" />
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={voice.start}
                              disabled={voice.state === "transcribing" || isChatting}
                              aria-label={t("quote.voice.record")}
                            >
                              <RiMic2Line className="size-4" />
                            </Button>
                          )}
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {voice.state === "recording" ? t("quote.voice.stop") : t("quote.voice.record")}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    )}

                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isChatting || !chatInput.trim() || hasUnsavedChanges || isSaving || isDeleting || voice.state === "recording" || voice.state === "transcribing"}
                    >
                      {isChatting ? <RiLoader4Line className="size-4 animate-spin" /> : <RiSendPlaneLine className="size-4" />}
                      {isChatting ? t("quote.chat.sending") : t("quote.chat.send")}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* ── Totals Tab ── */}
              <TabsContent value="totals" className="px-5 pb-5">
                <div className="mt-3 grid gap-2.5">
                  <SummaryRow label={t("quote.subtotal")} value={formatCurrency(preview.subtotal, form.currency, locale)} />
                  <SummaryRow
                    label={t("quote.tax", { value: formatPercent((parseNumberInput(form.tax_rate) ?? 0) / 100, locale) })}
                    value={formatCurrency(preview.tax, form.currency, locale)}
                  />
                  <Separator />
                  <SummaryRow label={t("quote.total")} value={formatCurrency(preview.total, form.currency, locale)} emphasized />
                  <div className="rounded-lg border border-border/60 bg-secondary/40 p-3 text-xs leading-relaxed text-muted-foreground">
                    {preview.pricingComplete ? t("quote.pricingReady") : t("quote.pricingIncomplete")}
                  </div>

                  <Separator className="my-1" />

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {t("quote.validUntil")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatDate(form.valid_until, locale)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {t("quote.lastSaved")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {formatDateTime(quote.updated_at, locale)}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ── Review Tab ── */}
              <TabsContent value="review" className="px-5 pb-5">
                <div className="mt-3 grid gap-3">
                  <div
                    className={[
                      "rounded-lg border p-3.5 text-sm leading-relaxed",
                      reviewItems.length > 0
                        ? "border-amber-300/60 bg-amber-50 text-amber-900"
                        : "border-emerald-300/60 bg-emerald-50 text-emerald-900",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={[
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                          reviewItems.length > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700",
                        ].join(" ")}
                      >
                        <RiErrorWarningLine className="size-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {reviewItems.length > 0
                            ? t("quote.review.needsAttention", { count: reviewItems.length })
                            : t("quote.review.readyToPrint")}
                        </p>
                        <p className="mt-0.5 text-xs opacity-80">
                          {hasUnsavedChanges ? t("quote.review.saveBeforePrint") : t("quote.review.printHint")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {reviewItems.length > 0 ? (
                    <div className="grid gap-2">
                      {reviewItems.map((item) => (
                        <div key={item.key} className="rounded-lg border border-amber-200 bg-card px-3.5 py-2.5">
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handlePrint}
                    disabled={hasUnsavedChanges || isSaving || isChatting || isDeleting}
                  >
                    <RiPrinterLine className="size-4" />
                    {t("quote.actions.print")}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* ── Right column: Quote editor ── */}
        <div className="grid gap-5">
          {/* Sticky action bar */}
          <div className="sticky top-0 z-10 -mx-1 rounded-xl border border-border/70 bg-card/95 px-5 py-3 shadow-sm backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button asChild variant="ghost" size="icon-sm">
                  <Link to="/">
                    <RiArrowLeftLine className="size-4" />
                  </Link>
                </Button>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-primary">
                    {t("quote.editorEyebrow")}
                  </p>
                  <p className="text-sm font-semibold tracking-tight text-foreground">
                    {quote.quote_number}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {t("quote.defaultTax", { value: formatPercent((parseNumberInput(form.tax_rate) ?? 0) / 100, locale) })}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {savedMessage && (
                  <span className="text-xs text-emerald-600 font-medium">{savedMessage}</span>
                )}
                {hasUnsavedChanges && (
                  <span className="text-xs text-amber-600 font-medium">{t("quote.footer.idle")}</span>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeleting || isSaving || isChatting}
                >
                  <RiDeleteBinLine className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={hasUnsavedChanges || isSaving || isChatting || isDeleting}
                >
                  <RiPrinterLine className="size-3.5" />
                  {t("quote.actions.print")}
                </Button>
                <Button
                  type="submit"
                  form="quote-workspace-form"
                  size="sm"
                  disabled={isSaving || isDeleting}
                >
                  {isSaving ? <RiLoader4Line className="size-3.5 animate-spin" /> : <RiSaveLine className="size-3.5" />}
                  {isSaving ? t("quote.saving") : t("quote.saveQuote")}
                </Button>
              </div>
            </div>
          </div>

          {/* Editor form */}
          <Card>
            <CardContent className="pt-6">
              <form id="quote-workspace-form" className="grid gap-6" onSubmit={handleSubmit}>
                {/* Section: Customer basics */}
                <section className="grid gap-4 rounded-lg border border-border/60 bg-secondary/30 p-5 sm:grid-cols-2">
                  <SectionTitle icon={RiUserLine} title={t("quote.sections.customerBasics")} />

                  <FieldBlock label={t("quote.fields.quoteTitle.label")} hint={t("quote.fields.quoteTitle.hint")}>
                    <Input
                      value={form.title}
                      onChange={(event) => updateField("title", event.target.value)}
                      placeholder={t("quote.fields.quoteTitle.placeholder")}
                    />
                  </FieldBlock>
                  <FieldBlock label={t("quote.fields.status.label")} hint={t("quote.fields.status.hint")}>
                    <Select
                      value={form.status}
                      onValueChange={(value) => updateField("status", value)}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">{t("status.draft")}</SelectItem>
                        <SelectItem value="ready">{t("status.ready")}</SelectItem>
                        <SelectItem value="sent">{t("status.sent")}</SelectItem>
                      </SelectContent>
                    </Select>
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

                {/* Section: Scope and terms */}
                <section className="grid gap-4 rounded-lg border border-border/60 bg-secondary/30 p-5 sm:grid-cols-2">
                  <SectionTitle icon={RiFileTextLine} title={t("quote.sections.scopeAndTerms")} />

                  <FieldBlock label={t("quote.fields.locale.label")} hint={t("quote.fields.locale.hint")}>
                    <Select
                      value={form.locale}
                      onValueChange={(value) => updateField("locale", value)}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {supportedLocales.map((localeOption) => (
                          <SelectItem key={localeOption} value={localeOption}>
                            {t(`app.language.${localeOption}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                {/* Section: Line items */}
                <section className="grid gap-4 rounded-lg border border-border/60 bg-secondary/30 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <SectionTitle icon={RiMoneyDollarCircleLine} title={t("quote.sections.lineItemsAndPricing")} />
                    <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                      <RiAddLine className="size-3.5" />
                      {t("quote.actions.addLineItem")}
                    </Button>
                  </div>

                  {activePricedItems.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-card px-4 py-5 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{t("quote.pricedItems.emptyTitle")}</p>
                      <p className="mt-1.5 leading-relaxed">{t("quote.pricedItems.emptyDescription")}</p>
                      <Button asChild variant="outline" size="sm" className="mt-3">
                        <Link to="/settings">{t("quote.pricedItems.goToSettings")}</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 rounded-lg border border-border/60 bg-card p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{t("quote.pricedItems.title")}</p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {t("quote.pricedItems.description")}
                          </p>
                        </div>

                        <Button type="button" size="sm" onClick={addPricedItemToQuote} disabled={!selectedPricedItem}>
                          <RiAddLine className="size-3.5" />
                          {t("quote.pricedItems.add")}
                        </Button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.15fr)_0.85fr]">
                        <FieldBlock label={t("quote.pricedItems.fields.item.label")} hint={t("quote.pricedItems.fields.item.hint")}>
                          <Select value={selectedPricedItem?.id ?? ""} onValueChange={selectPricedItem}>
                            <SelectTrigger className="h-10 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {activePricedItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FieldBlock>

                        {selectedPricedItem?.pricing_mode === "fixed" ? (
                          <FieldBlock label={t("quote.pricedItems.fields.fixedQuantity.label")} hint={t("quote.pricedItems.fields.fixedQuantity.hint")}>
                            <Input
                              type="number"
                              min="0.001"
                              step="0.001"
                              value={catalogInsert.fixed_quantity}
                              onChange={(event) => updateCatalogInsertField("fixed_quantity", event.target.value)}
                              placeholder={t("quote.pricedItems.fields.fixedQuantity.placeholder")}
                            />
                          </FieldBlock>
                        ) : null}

                        {selectedPricedItem?.pricing_mode === "area_rectangle" ? (
                          <div className="grid gap-3 md:col-span-2 md:grid-cols-2 xl:col-span-1 xl:grid-cols-2">
                            <FieldBlock label={t("quote.pricedItems.fields.areaWidth.label")} hint={t("quote.pricedItems.fields.areaWidth.hint")}>
                              <Input
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={catalogInsert.area_width}
                                onChange={(event) => updateCatalogInsertField("area_width", event.target.value)}
                                placeholder={t("quote.pricedItems.fields.areaWidth.placeholder")}
                              />
                            </FieldBlock>
                            <FieldBlock label={t("quote.pricedItems.fields.areaLength.label")} hint={t("quote.pricedItems.fields.areaLength.hint")}>
                              <Input
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={catalogInsert.area_length}
                                onChange={(event) => updateCatalogInsertField("area_length", event.target.value)}
                                placeholder={t("quote.pricedItems.fields.areaLength.placeholder")}
                              />
                            </FieldBlock>
                          </div>
                        ) : null}

                        {selectedPricedItem?.pricing_mode === "volume_direct" ? (
                          <div className="grid gap-3 md:col-span-2 md:grid-cols-[minmax(0,1fr)_0.55fr] xl:col-span-1 xl:grid-cols-[minmax(0,1fr)_0.55fr]">
                            <FieldBlock label={t("quote.pricedItems.fields.volumeAmount.label")} hint={t("quote.pricedItems.fields.volumeAmount.hint")}>
                              <Input
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={catalogInsert.volume_amount}
                                onChange={(event) => updateCatalogInsertField("volume_amount", event.target.value)}
                                placeholder={t("quote.pricedItems.fields.volumeAmount.placeholder")}
                              />
                            </FieldBlock>
                            <FieldBlock label={t("quote.pricedItems.fields.volumeUnit.label")} hint={t("quote.pricedItems.fields.volumeUnit.hint")}>
                              <Select
                                value={catalogInsert.volume_unit}
                                onValueChange={(value) => updateCatalogInsertField("volume_unit", value)}
                              >
                                <SelectTrigger className="h-10 w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="l">l</SelectItem>
                                  <SelectItem value="ml">ml</SelectItem>
                                </SelectContent>
                              </Select>
                            </FieldBlock>
                          </div>
                        ) : null}
                      </div>

                      {selectedPricedItem ? (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-secondary/30 px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {selectedPricedItem.description || selectedPricedItem.name}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {t(`quote.pricedItems.modeHints.${selectedPricedItem.pricing_mode}`)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                              {t("quote.pricedItems.preview")}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {!pricedItemPreview || pricedItemPreview.quantity === null
                                ? t("quote.pricedItems.previewPending")
                                : t("quote.pricedItems.previewQuantity", {
                                    quantity: formatNumberInput(pricedItemPreview.quantity),
                                    unit: pricedItemPreview.unit,
                                  })}
                            </p>
                            <p className="mt-1 font-heading text-lg font-semibold tracking-tight">
                              {formatCurrency(pricedItemPreview?.totalCents ?? 0, form.currency, locale)}
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {catalogError ? (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                          {catalogError}
                        </div>
                      ) : null}
                    </div>
                  )}

                  {form.line_items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-card px-5 py-8 text-center">
                      <p className="text-sm font-medium text-foreground">{t("quote.lineItems.emptyTitle")}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {t("quote.lineItems.emptyDescription")}
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {form.line_items.map((item, index) => (
                        <div
                          key={`line-item-${index}`}
                          className={[
                            "rounded-lg border bg-card p-4",
                            item.needs_review || parseMoneyToCents(item.unit_price) === null
                              ? "border-amber-300/60 bg-amber-50/50"
                              : "border-border/60",
                          ].join(" ")}
                        >
                          <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_0.55fr_0.55fr_0.7fr_auto]">
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
                                step="0.001"
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
                              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => removeLineItem(index)}>
                                <RiDeleteBinLine className="size-3.5" />
                                {t("quote.actions.remove")}
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
                            <div className="grid gap-1.5">
                              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                                <input
                                  type="checkbox"
                                  checked={item.needs_review}
                                  onChange={(event) => updateLineItem(index, "needs_review", event.target.checked)}
                                  className="size-3.5 rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="text-xs">{t("quote.lineItems.needsReview")}</span>
                              </label>

                              {item.needs_review || parseMoneyToCents(item.unit_price) === null ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <Badge variant="outline" className="border-amber-300/60 bg-amber-50 text-amber-800 text-[10px]">
                                    {t("quote.lineItems.needsReview")}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground">
                                    {parseMoneyToCents(item.unit_price) === null
                                      ? t("quote.review.reasons.missingPrice")
                                      : t("quote.review.reasons.markedForReview")}
                                  </p>
                                </div>
                              ) : null}
                            </div>

                            <div className="text-right">
                              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                {t("quote.lineItems.lineTotalPreview")}
                              </p>
                              <p className="mt-0.5 font-heading text-lg font-semibold tracking-tight">
                                {formatCurrency(lineItemPreviewTotal(item), form.currency, locale)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {error ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("quote.actions.deleteQuote")}</DialogTitle>
            <DialogDescription>
              {t("quote.confirmDelete")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)}>
              {t("dashboard.recent.confirmDeleteCancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={() => void handleDeleteQuote()}
            >
              {isDeleting ? <RiLoader4Line className="size-3.5 animate-spin" /> : <RiDeleteBinLine className="size-3.5" />}
              {t("dashboard.recent.confirmDeleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuotePrintSheet quote={quote} settings={businessSettings} locale={locale} />
    </>
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

function buildCatalogInsertState(item: PricedItem | null): CatalogInsertState {
  if (!item) {
    return emptyCatalogInsertState
  }

  return {
    priced_item_id: item.id,
    fixed_quantity: formatNumberInput(item.default_quantity),
    area_width: "",
    area_length: "",
    volume_amount: "",
    volume_unit: "l",
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
    <div className="sm:col-span-2 flex items-center gap-2.5 pb-1">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <p className="font-heading text-base font-semibold tracking-tight text-foreground">{title}</p>
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
    <label className="grid gap-1.5">
      <div className="space-y-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
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
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3.5 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={emphasized ? "font-heading text-lg font-semibold tracking-tight" : "text-sm font-medium text-foreground"}>
        {value}
      </span>
    </div>
  )
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

export default QuoteWorkspacePage
