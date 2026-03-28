export const supportedLocales = ["fr", "en"] as const

export type AppLocale = (typeof supportedLocales)[number]

export const defaultLocale: AppLocale = "fr"
export const localeStorageKey = "autoquote-locale"

export function isSupportedLocale(value: string): value is AppLocale {
  return supportedLocales.includes(value as AppLocale)
}

export function getStoredLocale(): AppLocale | null {
  if (typeof window === "undefined") {
    return null
  }

  const value = window.localStorage.getItem(localeStorageKey)
  return value && isSupportedLocale(value) ? value : null
}

export function setStoredLocale(locale: AppLocale) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(localeStorageKey, locale)
}
