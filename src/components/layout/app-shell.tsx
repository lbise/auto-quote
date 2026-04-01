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
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
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
    <div className="relative min-h-svh">
      <div className="relative mx-auto flex min-h-svh max-w-7xl flex-col px-5 py-5 sm:px-6 lg:px-8 lg:py-6">
        <header
          className="flex items-center justify-between gap-4 pb-5"
          data-print-hidden="true"
        >
          {/* Logo + Brand */}
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <RiSparkling2Line className="size-4" />
            </div>
            <span className="font-heading text-base font-semibold tracking-tight">
              AutoQuote
            </span>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden items-center gap-1 sm:flex">
            {navigation.map((item) => {
              const Icon = item.icon

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )
                  }
                >
                  <Icon className="size-4" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          {/* Right: Locale + User */}
          <div className="flex items-center gap-2">
            {/* Locale toggle */}
            <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card p-0.5">
              {supportedLocales.map((locale) => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => void i18n.changeLanguage(locale)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                    i18n.resolvedLanguage === locale
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                  aria-label={`${t("app.language.label")}: ${t(`app.language.${locale}`)}`}
                >
                  {t(`common.localeShort.${locale}`)}
                </button>
              ))}
            </div>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* User */}
            <span className="text-xs font-medium text-muted-foreground">
              {session.display_name || session.username || t("auth.sharedUser")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => void handleLogout()}
            >
              <RiLogoutBoxRLine className="size-3.5" />
              {t("auth.actions.signOut")}
            </Button>
          </div>
        </header>

        <Separator className="mb-6" data-print-hidden="true" />

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

export { AppShell }
