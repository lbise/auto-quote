import type { AppLocale } from "@/lib/locale"

export type PricingMode = "fixed" | "area_rectangle" | "volume_direct"

export type PricedItem = {
  id: string
  name: string
  description: string
  pricing_mode: PricingMode
  unit: string
  unit_price_cents: number
  default_quantity: number
  is_active: boolean
}

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
  priced_items: PricedItem[]
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
  messages: QuoteMessage[]
  created_at: string
  updated_at: string
}

export type QuoteMessage = {
  id: number
  role: "user" | "assistant" | "system"
  content: string
  assistant_action: "ask_question" | "update_quote" | null
  created_at: string
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

export type QuoteChatPayload = {
  message: string
}

export type QuoteChatResponse = {
  action: "ask_question" | "update_quote"
  assistant_message: string
  quote: Quote
}

export type AuthSession = {
  authenticated: boolean
  user_id: number | null
  username: string | null
  trade: string | null
}

export type AuthLoginPayload = {
  username: string
  password: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ""

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
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

export function getAuthSession(): Promise<AuthSession> {
  return request<AuthSession>("/api/auth/session")
}

export function loginWithPassword(payload: AuthLoginPayload): Promise<AuthSession> {
  return request<AuthSession>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function logoutFromSession(): Promise<void> {
  return request<void>("/api/auth/logout", {
    method: "POST",
  })
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

export function deleteQuote(quoteId: number): Promise<void> {
  return request<void>(`/api/quotes/${quoteId}`, {
    method: "DELETE",
  })
}

export function sendQuoteMessage(quoteId: number, payload: QuoteChatPayload): Promise<QuoteChatResponse> {
  return request<QuoteChatResponse>(`/api/quotes/${quoteId}/chat`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export type TranscriptionResponse = {
  text: string
}

const MIME_TO_EXT: Record<string, string> = {
  "audio/webm": ".webm",
  "audio/webm;codecs=opus": ".webm",
  "audio/ogg": ".ogg",
  "audio/ogg;codecs=opus": ".ogg",
  "audio/wav": ".wav",
  "audio/mp4": ".mp4",
  "audio/mpeg": ".mp3",
  "audio/flac": ".flac",
  "audio/aac": ".aac",
  "audio/x-m4a": ".m4a",
}

export async function transcribeAudio(file: Blob, language?: string): Promise<TranscriptionResponse> {
  const ext = MIME_TO_EXT[file.type] ?? ".webm"
  const formData = new FormData()
  formData.append("file", file, `recording${ext}`)
  if (language) {
    formData.append("language", language)
  }

  const response = await fetch(`${API_BASE}/api/transcriptions`, {
    method: "POST",
    credentials: "include",
    body: formData,
  })

  if (!response.ok) {
    const contentType = response.headers.get("content-type")

    if (contentType?.includes("application/json")) {
      const data = (await response.json()) as { detail?: string }
      throw new Error(data.detail || `Transcription failed with status ${response.status}`)
    }

    const message = await response.text()
    throw new Error(message || `Transcription failed with status ${response.status}`)
  }

  return response.json() as Promise<TranscriptionResponse>
}
