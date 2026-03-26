import {
  type RemixiconComponentType,
  RiArrowRightUpLine,
  RiCheckboxCircleFill,
  RiFlashlightLine,
  RiLayoutGridLine,
  RiPaletteLine,
  RiSparkling2Line,
  RiStackLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const highlights = [
  "Button",
  "Badge",
  "Input",
  "Card",
]

const notes = [
  "Vite starter content removed",
  "Tailwind-first layout with reusable primitives",
  "Responsive shell for real product work",
]

const featureCards: {
  icon: RemixiconComponentType
  title: string
  description: string
}[] = [
  {
    icon: RiLayoutGridLine,
    title: "Clear layout",
    description:
      "A lightweight landing shell replaces the default demo so the app feels like a real starting point.",
  },
  {
    icon: RiPaletteLine,
    title: "Shared styling",
    description:
      "The page leans on theme tokens and shadcn conventions, so new sections can stay visually consistent.",
  },
  {
    icon: RiStackLine,
    title: "Easy to extend",
    description:
      "Each block is simple enough to swap for real data, forms, or dashboard content when the app grows.",
  },
]

const statCards = [
  {
    label: "Starter status",
    value: "Ready",
    detail: "A cleaner base for your first real screen.",
  },
  {
    label: "Responsive",
    value: "Mobile-first",
    detail: "Hero and side cards collapse into a single column cleanly.",
  },
  {
    label: "UI kit",
    value: "4 pieces",
    detail: "Enough shadcn building blocks to keep moving without boilerplate.",
  },
]

function App() {
  return (
    <div className="relative min-h-svh overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(71,159,169,0.22),transparent_62%)]" />

      <div className="relative mx-auto flex min-h-svh max-w-6xl flex-col px-6 py-6 sm:px-8 lg:px-10 lg:py-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <RiSparkling2Line className="size-5" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold tracking-tight">
                AutoQuote
              </p>
              <p className="text-sm text-muted-foreground">
                React, TypeScript, Tailwind and shadcn
              </p>
            </div>
          </div>

          <Button variant="outline" className="h-10 rounded-full px-4 text-sm">
            Component starter
          </Button>
        </header>

        <main className="grid flex-1 gap-6 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:py-10">
          <Card className="relative overflow-hidden border-white/60 bg-white/75">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

            <CardHeader className="gap-5 p-7 sm:p-8">
              <Badge variant="secondary" className="w-fit bg-white/80">
                Simple shadcn app
              </Badge>

              <div className="space-y-4">
                <h1 className="max-w-2xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.35rem] lg:leading-[1.02]">
                  A cleaner demo screen that feels like the start of a real product.
                </h1>
                <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                  The default Vite example is gone. In its place is a compact, polished
                  app shell built from shadcn-style components and ready for actual
                  feature work.
                </p>
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Input
                  type="email"
                  placeholder="name@company.com"
                  aria-label="Email"
                  className="h-12 rounded-full bg-white/85 px-5"
                />
                <Button className="h-12 rounded-full px-5 text-sm font-semibold shadow-lg shadow-primary/20">
                  Start with this layout
                  <RiArrowRightUpLine className="size-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {highlights.map((item) => (
                  <Badge key={item} variant="outline" className="bg-white/70">
                    {item}
                  </Badge>
                ))}
              </div>
            </CardHeader>

            <CardContent className="grid gap-4 px-7 pb-7 sm:px-8 sm:pb-8">
              <Card className="border-border/60 bg-background/75">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">What changed</CardTitle>
                      <CardDescription>
                        Small, practical improvements over the stock starter.
                      </CardDescription>
                    </div>
                    <Badge className="gap-1 rounded-full px-3 py-1.5 tracking-[0.16em]">
                      <RiFlashlightLine className="size-3.5" />
                      Fresh setup
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {notes.map((note) => (
                    <div
                      key={note}
                      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white/70 px-4 py-3"
                    >
                      <RiCheckboxCircleFill className="size-5 shrink-0 text-primary" />
                      <p className="text-sm text-foreground/85">{note}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border-white/60 bg-white/75">
              <CardHeader>
                <CardTitle>Quick preview</CardTitle>
                <CardDescription>
                  A simple right rail for stats, context, or onboarding details.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {statCards.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-border/60 bg-background/70 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {stat.detail}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {featureCards.map((feature) => {
                const Icon = feature.icon

                return (
                  <Card key={feature.title} className="border-white/60 bg-white/70">
                    <CardHeader>
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-foreground">
                        <Icon className="size-5" />
                      </div>
                      <CardTitle>{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm leading-6 text-muted-foreground">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                    <CardFooter>
                      <Badge variant="muted">Starter block</Badge>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
