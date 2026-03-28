export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(value === 0 ? 0 : 1)}%`
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
