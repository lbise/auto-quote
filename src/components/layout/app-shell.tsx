import { type ComponentType, type ReactNode, useEffect } from "react"
import {
  RiDashboardLine,
  RiLogoutBoxRLine,
  RiSettings3Line,
  RiSparkling2Line,
} from "@remixicon/react"
import { useTranslation } from "react-i18next"
import { NavLink, useNavigate } from "react-router-dom"

import { useAuth } from "@/components/auth/use-auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getSettings } from "@/lib/api"
import { getStoredLocale, isSupportedLocale, supportedLocales } from "@/lib/locale"
import { cn } from "@/lib/utils"

function AppShell({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation()
  const { session, logout } = useAuth()
  const navigate = useNavigate()

  const navigation: Array<{
    to: string
    label: string
    icon: ComponentType<{ className?: string }>
    end?: boolean
  }> = [
    {
      to: "/",
      label: t("app.navigation.dashboard"),
      icon: RiDashboardLine,
      end: true,
    },
    {
      to: "/settings",
      label: t("app.navigation.settings"),
      icon: RiSettings3Line,
    },
  ]

  useEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage || "fr"
  }, [i18n.resolvedLanguage])

  useEffect(() => {
    if (getStoredLocale()) {
      return
    }

    let active = true

    void getSettings()
      .then((settings) => {
        if (!active || !isSupportedLocale(settings.default_locale)) {
          return
        }

        if (settings.default_locale !== i18n.resolvedLanguage) {
          void i18n.changeLanguage(settings.default_locale)
        }
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [i18n])

  async function handleLogout() {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="relative min-h-svh overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(71,159,169,0.22),transparent_62%)]" />
      <div className="absolute inset-y-20 right-0 w-72 rounded-full bg-[radial-gradient(circle,rgba(83,183,156,0.18),transparent_65%)] blur-3xl" />

      <div className="relative mx-auto flex min-h-svh max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10 lg:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/50 pb-6" data-print-hidden="true">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <RiSparkling2Line className="size-5" />
            </div>
            <p className="font-heading text-lg font-semibold tracking-tight">AutoQuote</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-white/60 bg-white/70 p-1 shadow-sm backdrop-blur">
              {supportedLocales.map((locale) => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => void i18n.changeLanguage(locale)}
                  className={cn(
                    "rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors",
                    i18n.resolvedLanguage === locale
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
                  )}
                  aria-label={`${t("app.language.label")}: ${t(`app.language.${locale}`)}`}
                >
                  {t(`common.localeShort.${locale}`)}
                </button>
              ))}
            </div>

            <nav className="flex items-center gap-1 rounded-full border border-white/60 bg-white/70 p-1 shadow-sm backdrop-blur">
              {navigation.map((item) => {
                const Icon = item.icon

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
                      )
                    }
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
            <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/70 p-1 pr-2 shadow-sm backdrop-blur">
              <Badge variant="secondary" className="rounded-full px-3 py-2">
                {session.username || t("auth.sharedUser")}
              </Badge>
              <Button variant="ghost" className="h-9 rounded-full px-3 text-sm" onClick={() => void handleLogout()}>
                <RiLogoutBoxRLine className="size-4" />
                {t("auth.actions.signOut")}
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 py-8 lg:py-10">{children}</main>
      </div>
    </div>
  )
}

export { AppShell }
