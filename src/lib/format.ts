export function formatPercent(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: value === 0 ? 0 : 1,
    maximumFractionDigits: value === 0 ? 0 : 1,
  }).format(value)
}

export function formatDateTime(value: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function formatDate(value: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(value))
}

export function formatCurrency(valueInCents: number, currency: string, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(valueInCents / 100)
  } catch {
    return `${currency} ${(valueInCents / 100).toFixed(2)}`
  }
}
