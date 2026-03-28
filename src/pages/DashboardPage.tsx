import { useEffect, useMemo, useState } from "react"
import {
  RiAddLine,
  RiArrowRightUpLine,
  RiDraftLine,
  RiFileList3Line,
  RiLoader4Line,
  RiSettings3Line,
  RiTimeLine,
} from "@remixicon/react"
import { Link, useNavigate } from "react-router-dom"

import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createQuote, getQuotes, type QuoteListItem } from "@/lib/api"
import { formatCurrency, formatDateTime } from "@/lib/format"

function DashboardPage() {
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState<QuoteListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadQuotes()
  }, [])

  async function loadQuotes() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getQuotes()
      setQuotes(response)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load quotes")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateQuote() {
    setIsCreating(true)
    setError(null)

    try {
      const quote = await createQuote({})
      navigate(`/quotes/${quote.id}`)
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create quote")
      setIsCreating(false)
    }
  }

  const stats = useMemo(() => {
    const ready = quotes.filter((quote) => quote.status === "ready").length
    const drafts = quotes.filter((quote) => quote.status === "draft").length

    return [
      {
        label: "Total quotes",
        value: String(quotes.length),
        icon: RiFileList3Line,
      },
      {
        label: "Drafts",
        value: String(drafts),
        icon: RiDraftLine,
      },
      {
        label: "Ready to send",
        value: String(ready),
        icon: RiTimeLine,
      },
    ]
  }, [quotes])

  return (
    <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr] xl:grid-cols-[0.8fr_1.2fr]">
      <div className="grid gap-6">
        <Card className="relative overflow-hidden border-white/60 bg-white/75">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

          <CardHeader className="relative gap-4 p-7 sm:p-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                Quote dashboard
              </p>
              <h1 className="max-w-2xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.25rem] lg:leading-[1.02]">
                Create, revisit, and shape quote drafts before the assistant starts writing.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Phase 2 turns the settings foundation into real quote records, a live
                workspace, and deterministic totals the future chat assistant can build on.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="h-11 rounded-full px-5 text-sm font-semibold shadow-lg shadow-primary/20"
                onClick={() => void handleCreateQuote()}
                disabled={isCreating}
              >
                {isCreating ? <RiLoader4Line className="size-4 animate-spin" /> : <RiAddLine className="size-4" />}
                {isCreating ? "Creating draft..." : "New quote"}
              </Button>

              <Button asChild variant="outline" size="lg" className="h-11 rounded-full px-5 text-sm">
                <Link to="/settings">
                  <RiSettings3Line className="size-4" />
                  Review defaults
                </Link>
              </Button>
            </div>

            {error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}
          </CardHeader>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon

            return (
              <Card key={stat.label} className="border-white/60 bg-white/70">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="mt-2 font-heading text-3xl font-semibold tracking-tight">
                        {stat.value}
                      </p>
                    </div>
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
                      <Icon className="size-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Card className="border-white/60 bg-white/75">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Recent quotes</CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Open a draft to edit customer details, line items, and totals before chat automation lands.
            </p>
          </div>

          <Button variant="outline" className="h-10 rounded-full px-4 text-sm" onClick={() => void loadQuotes()}>
            {isLoading ? <RiLoader4Line className="size-4 animate-spin" /> : <RiTimeLine className="size-4" />}
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="grid gap-3">
          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-background/60">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <RiLoader4Line className="size-5 animate-spin" />
                Loading saved drafts...
              </div>
            </div>
          ) : quotes.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-[1.5rem] border border-dashed border-border/70 bg-background/60 px-6 text-center">
              <div className="space-y-2">
                <p className="font-heading text-2xl font-semibold tracking-tight">No quotes yet</p>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  Create the first draft and use it as the backbone for the upcoming assistant workflow.
                </p>
              </div>

              <Button className="h-11 rounded-full px-5 text-sm font-semibold" onClick={() => void handleCreateQuote()}>
                <RiAddLine className="size-4" />
                Start first quote
              </Button>
            </div>
          ) : (
            quotes.map((quote) => (
              <Link
                key={quote.id}
                to={`/quotes/${quote.id}`}
                className="block rounded-[1.5rem] border border-border/60 bg-background/70 p-5 transition-colors hover:bg-background/85"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <QuoteStatusBadge status={quote.status} />
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {quote.quote_number}
                      </span>
                    </div>

                    <div>
                      <p className="font-heading text-xl font-semibold tracking-tight text-foreground">
                        {quote.title || "Untitled quote draft"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {quote.customer_company || quote.customer_name || "Customer details not set yet"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-heading text-2xl font-semibold tracking-tight">
                      {formatCurrency(quote.total_cents, quote.currency)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {quote.pricing_complete ? "Priced" : "Needs review"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4 text-sm text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-4">
                    <span>{quote.item_count} line item{quote.item_count === 1 ? "" : "s"}</span>
                    <span>Updated {formatDateTime(quote.updated_at)}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    Open workspace
                    <RiArrowRightUpLine className="size-4" />
                  </span>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage
