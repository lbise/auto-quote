import { type ComponentType, type ReactNode } from "react"
import {
  RiDashboardLine,
  RiSettings3Line,
  RiSparkling2Line,
} from "@remixicon/react"
import { NavLink } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const navigation: Array<{
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  end?: boolean
}> = [
  {
    to: "/",
    label: "Dashboard",
    icon: RiDashboardLine,
    end: true,
  },
  {
    to: "/settings",
    label: "Settings",
    icon: RiSettings3Line,
  },
]

function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-svh overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(71,159,169,0.22),transparent_62%)]" />
      <div className="absolute inset-y-20 right-0 w-72 rounded-full bg-[radial-gradient(circle,rgba(83,183,156,0.18),transparent_65%)] blur-3xl" />

      <div className="relative mx-auto flex min-h-svh max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10 lg:py-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/50 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <RiSparkling2Line className="size-5" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold tracking-tight">AutoQuote</p>
              <p className="text-sm text-muted-foreground">
                FastAPI and SQLite PoC for faster quote drafting
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

            <Badge variant="outline" className="bg-white/70">
              Phase 2 in progress
            </Badge>
          </div>
        </header>

        <main className="flex-1 py-8 lg:py-10">{children}</main>
      </div>
    </div>
  )
}

export { AppShell }
