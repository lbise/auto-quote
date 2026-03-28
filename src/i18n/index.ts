import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import { defaultLocale, getStoredLocale, isSupportedLocale, setStoredLocale } from "@/lib/locale"

import { resources } from "./resources"

void i18n.use(initReactI18next).init({
  resources,
  lng: getStoredLocale() ?? defaultLocale,
  fallbackLng: defaultLocale,
  supportedLngs: ["fr", "en"],
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
})

i18n.on("languageChanged", (language) => {
  if (isSupportedLocale(language)) {
    setStoredLocale(language)
  }
})

export { i18n }
