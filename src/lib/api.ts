import type { AppLocale } from "@/lib/locale"

export type BusinessSettings = {
  id: number
  business_name: string
  business_email: string | null
  business_phone: string
  business_address: string
  default_locale: AppLocale
  default_currency: string
  default_tax_rate: number
  default_payment_terms: string
  default_validity_days: number
  updated_at: string
}

export type UpdateBusinessSettings = Partial<
  Omit<BusinessSettings, "id" | "updated_at">
>

export type QuoteStatus = "draft" | "ready" | "sent"

export type QuoteLineItem = {
  id: number
  description: string
  quantity: number
  unit: string
  unit_price_cents: number | null
  line_total_cents: number
  needs_review: boolean
  source: "manual" | "ai"
  sort_order: number
}

export type Quote = {
  id: number
  quote_number: string
  status: QuoteStatus
  customer_name: string
  customer_company: string
  customer_email: string | null
  customer_phone: string
  customer_address: string
  locale: AppLocale
  title: string
  job_summary: string
  assumptions: string
  notes: string
  payment_terms: string
  currency: string
  subtotal_cents: number
  tax_rate: number
  tax_amount_cents: number
  total_cents: number
  pricing_complete: boolean
  valid_until: string
  line_items: QuoteLineItem[]
  created_at: string
  updated_at: string
}

export type QuoteListItem = {
  id: number
  quote_number: string
  status: QuoteStatus
  customer_name: string
  customer_company: string
  locale: AppLocale
  title: string
  currency: string
  total_cents: number
  pricing_complete: boolean
  item_count: number
  updated_at: string
}

export type QuoteLineItemInput = {
  description: string
  quantity: number
  unit: string
  unit_price_cents: number | null
  needs_review: boolean
  source: "manual" | "ai"
}

export type CreateQuotePayload = Partial<
  Omit<
    Quote,
    | "id"
    | "quote_number"
    | "subtotal_cents"
    | "tax_amount_cents"
    | "total_cents"
    | "pricing_complete"
    | "created_at"
    | "updated_at"
    | "line_items"
  > & {
    line_items: QuoteLineItemInput[]
  }
>

export type UpdateQuotePayload = Partial<
  Omit<
    Quote,
    | "id"
    | "quote_number"
    | "subtotal_cents"
    | "tax_amount_cents"
    | "total_cents"
    | "pricing_complete"
    | "created_at"
    | "updated_at"
    | "line_items"
  > & {
    line_items: QuoteLineItemInput[]
  }
>

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ""

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    const contentType = response.headers.get("content-type")

    if (contentType?.includes("application/json")) {
      const data = (await response.json()) as { detail?: string }
      throw new Error(data.detail || `Request failed with status ${response.status}`)
    }

    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function getSettings(): Promise<BusinessSettings> {
  return request<BusinessSettings>("/api/settings")
}

export function updateSettings(payload: UpdateBusinessSettings): Promise<BusinessSettings> {
  return request<BusinessSettings>("/api/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function getQuotes(): Promise<QuoteListItem[]> {
  return request<QuoteListItem[]>("/api/quotes")
}

export function createQuote(payload: CreateQuotePayload): Promise<Quote> {
  return request<Quote>("/api/quotes", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function getQuote(quoteId: number): Promise<Quote> {
  return request<Quote>(`/api/quotes/${quoteId}`)
}

export function updateQuote(quoteId: number, payload: UpdateQuotePayload): Promise<Quote> {
  return request<Quote>(`/api/quotes/${quoteId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}
