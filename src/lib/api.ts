export type BusinessSettings = {
  id: number
  business_name: string
  business_email: string | null
  business_phone: string
  business_address: string
  default_currency: string
  default_tax_rate: number
  default_payment_terms: string
  default_validity_days: number
  updated_at: string
}

export type UpdateBusinessSettings = Partial<
  Omit<BusinessSettings, "id" | "updated_at">
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
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
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
