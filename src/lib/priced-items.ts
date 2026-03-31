import type { PricingMode } from "@/lib/api"

export type VolumeInputUnit = "l" | "ml"

export function defaultUnitForPricingMode(mode: PricingMode, customUnit = "job"): string {
  if (mode === "area_rectangle") {
    return "m2"
  }

  if (mode === "volume_direct") {
    return "l"
  }

  return customUnit.trim() || "job"
}

export function parsePositiveNumber(value: string): number | null {
  const normalized = value.trim()
  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

export function formatNumberInput(value: number): string {
  if (Number.isInteger(value)) {
    return String(value)
  }

  return value.toFixed(3).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1")
}

export function calculatePricedItemQuantity(
  pricingMode: PricingMode,
  input: {
    fixed_quantity: string
    area_width: string
    area_length: string
    volume_amount: string
    volume_unit: VolumeInputUnit
  }
): number | null {
  if (pricingMode === "fixed") {
    return parsePositiveNumber(input.fixed_quantity)
  }

  if (pricingMode === "area_rectangle") {
    const width = parsePositiveNumber(input.area_width)
    const length = parsePositiveNumber(input.area_length)

    if (width === null || length === null) {
      return null
    }

    return width * length
  }

  const amount = parsePositiveNumber(input.volume_amount)
  if (amount === null) {
    return null
  }

  return input.volume_unit === "ml" ? amount / 1000 : amount
}
