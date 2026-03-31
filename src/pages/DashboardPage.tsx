import { useCallback, useEffect, useMemo, useState } from "react"
import {
  RiAddLine,
  RiArrowRightUpLine,
  RiDeleteBinLine,
  RiDraftLine,
  RiFileList3Line,
  RiFilter3Line,
  RiLoader4Line,
  RiSearchLine,
  RiSettings3Line,
  RiTimeLine,
} from "@remixicon/react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"

import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { createQuote, deleteQuote, getQuotes, type QuoteListItem } from "@/lib/api"
import { formatCurrency, formatDateTime } from "@/lib/format"

function DashboardPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState<QuoteListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [deletingQuoteId, setDeletingQuoteId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<QuoteListItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "ready" | "sent">("all")

  const loadQuotes = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getQuotes()
      setQuotes(response)
    } catch (loadError) {
      setError(toErrorMessage(loadError, t("dashboard.errors.loadQuotes")))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadQuotes()
  }, [loadQuotes])

  async function handleCreateQuote() {
    setIsCreating(true)
    setError(null)

    try {
      const quote = await createQuote({})
      navigate(`/quotes/${quote.id}`)
    } catch (createError) {
      setError(toErrorMessage(createError, t("dashboard.errors.createQuote")))
      setIsCreating(false)
    }
  }

  async function handleDeleteQuote(quote: QuoteListItem) {
    setDeletingQuoteId(quote.id)
    setError(null)

    try {
      await deleteQuote(quote.id)
      setQuotes((current) => current.filter((item) => item.id !== quote.id))
    } catch (deleteError) {
      setError(toErrorMessage(deleteError, t("dashboard.errors.deleteQuote")))
    } finally {
      setDeletingQuoteId(null)
      setDeleteTarget(null)
    }
  }

  const readyCount = quotes.filter((quote) => quote.status === "ready").length
  const draftCount = quotes.filter((quote) => quote.status === "draft").length

  const stats = [
    {
      label: t("dashboard.stats.totalQuotes"),
      value: String(quotes.length),
      icon: RiFileList3Line,
    },
    {
      label: t("dashboard.stats.drafts"),
      value: String(draftCount),
      icon: RiDraftLine,
    },
    {
      label: t("dashboard.stats.readyToSend"),
      value: String(readyCount),
      icon: RiTimeLine,
    },
  ]

  const filteredQuotes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return quotes.filter((quote) => {
      const matchesStatus = statusFilter === "all" || quote.status === statusFilter
      if (!matchesStatus) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const haystack = [
        quote.quote_number,
        quote.title,
        quote.customer_name,
        quote.customer_company,
        quote.currency,
      ]
        .join(" ")
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  }, [quotes, searchTerm, statusFilter])

  const hasActiveFilters = searchTerm.trim() !== "" || statusFilter !== "all"
  const filterOptions: Array<{ value: "all" | "draft" | "ready" | "sent"; label: string }> = [
    { value: "all", label: t("dashboard.filters.status.all") },
    { value: "draft", label: t("status.draft") },
    { value: "ready", label: t("status.ready") },
    { value: "sent", label: t("status.sent") },
  ]

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] xl:grid-cols-[0.78fr_1.22fr]">
        {/* Left column: Hero + Stats */}
        <div className="grid gap-5 self-start">
          <Card>
            <CardHeader className="gap-4 p-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  {t("dashboard.eyebrow")}
                </p>
                <h1 className="max-w-2xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  {t("dashboard.title")}
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {t("dashboard.description")}
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <Button
                  onClick={() => void handleCreateQuote()}
                  disabled={isCreating}
                >
                  {isCreating ? <RiLoader4Line className="size-4 animate-spin" /> : <RiAddLine className="size-4" />}
                  {isCreating ? t("dashboard.creatingDraft") : t("dashboard.newQuote")}
                </Button>

                <Button asChild variant="outline">
                  <Link to="/settings">
                    <RiSettings3Line className="size-4" />
                    {t("dashboard.reviewDefaults")}
                  </Link>
                </Button>
              </div>

              {error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
            </CardHeader>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon

              return (
                <Card key={stat.label}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="mt-1.5 font-heading text-2xl font-semibold tracking-tight">
                          {stat.value}
                        </p>
                      </div>
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Right column: Quote list */}
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{t("dashboard.recent.title")}</CardTitle>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {t("dashboard.recent.description")}
              </p>
            </div>

            <Button variant="outline" size="sm" onClick={() => void loadQuotes()}>
              {isLoading ? <RiLoader4Line className="size-3.5 animate-spin" /> : <RiTimeLine className="size-3.5" />}
              {t("dashboard.recent.refresh")}
            </Button>
          </CardHeader>

          <CardContent className="grid gap-3">
            {/* Search + Filters */}
            <div className="grid gap-3 rounded-lg border border-border/60 bg-secondary/40 p-3">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <label className="relative block">
                  <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={t("dashboard.filters.searchPlaceholder")}
                    className="pl-9"
                  />
                </label>

                {hasActiveFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setStatusFilter("all")
                    }}
                  >
                    {t("dashboard.filters.clear")}
                  </Button>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                  <RiFilter3Line className="size-3" />
                  {t("dashboard.filters.status.label")}
                </Badge>
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    className={[
                      "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                      statusFilter === option.value
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quote list */}
            {isLoading ? (
              <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <RiLoader4Line className="size-4 animate-spin" />
                  {t("dashboard.recent.loading")}
                </div>
              </div>
            ) : quotes.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-secondary/30 px-6 text-center">
                <div className="space-y-1.5">
                  <p className="font-heading text-lg font-semibold tracking-tight">
                    {t("dashboard.recent.emptyTitle")}
                  </p>
                  <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {t("dashboard.recent.emptyDescription")}
                  </p>
                </div>

                <Button onClick={() => void handleCreateQuote()}>
                  <RiAddLine className="size-4" />
                  {t("dashboard.recent.emptyAction")}
                </Button>
              </div>
            ) : filteredQuotes.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-secondary/30 px-6 text-center">
                <div className="space-y-1.5">
                  <p className="font-heading text-lg font-semibold tracking-tight">
                    {t("dashboard.recent.emptyFilteredTitle")}
                  </p>
                  <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {t("dashboard.recent.emptyFilteredDescription")}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("")
                    setStatusFilter("all")
                  }}
                >
                  {t("dashboard.filters.clear")}
                </Button>
              </div>
            ) : (
              filteredQuotes.map((quote) => (
                <div
                  key={quote.id}
                  className="group rounded-lg border border-border/70 bg-card p-4 transition-colors hover:border-border hover:shadow-sm"
                >
                  <Link to={`/quotes/${quote.id}`} className="block">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <QuoteStatusBadge status={quote.status} />
                          <Badge variant="outline" className="uppercase text-muted-foreground">
                            {t(`common.localeShort.${quote.locale}`)}
                          </Badge>
                          <span className="text-xs font-medium tracking-wide text-muted-foreground">
                            {quote.quote_number}
                          </span>
                        </div>

                        <div>
                          <p className="font-heading text-base font-semibold tracking-tight text-foreground">
                            {quote.title || t("common.untitledQuote")}
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {quote.customer_company || quote.customer_name || t("dashboard.recent.missingCustomer")}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-heading text-xl font-semibold tracking-tight">
                          {formatCurrency(quote.total_cents, quote.currency, locale)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {quote.pricing_complete ? t("dashboard.recent.priced") : t("dashboard.recent.needsReview")}
                        </p>
                      </div>
                    </div>
                  </Link>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>{t("dashboard.recent.lineItems", { count: quote.item_count })}</span>
                      <span>{t("dashboard.recent.updated", { value: formatDateTime(quote.updated_at, locale) })}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteTarget(quote)}
                        disabled={deletingQuoteId === quote.id}
                      >
                        {deletingQuoteId === quote.id ? <RiLoader4Line className="size-3.5 animate-spin" /> : <RiDeleteBinLine className="size-3.5" />}
                        {deletingQuoteId === quote.id ? t("dashboard.recent.deleting") : t("dashboard.recent.delete")}
                      </Button>

                      <Link
                        to={`/quotes/${quote.id}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {t("dashboard.recent.openWorkspace")}
                        <RiArrowRightUpLine className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.recent.confirmDeleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("dashboard.recent.confirmDelete")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              {t("dashboard.recent.confirmDeleteCancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deletingQuoteId !== null}
              onClick={() => deleteTarget && void handleDeleteQuote(deleteTarget)}
            >
              {deletingQuoteId !== null ? <RiLoader4Line className="size-3.5 animate-spin" /> : <RiDeleteBinLine className="size-3.5" />}
              {t("dashboard.recent.confirmDeleteConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

export default DashboardPage
