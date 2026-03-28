import { type ComponentType, type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react"
import {
  RiBankCardLine,
  RiCheckLine,
  RiDatabase2Line,
  RiLoader4Line,
  RiMailLine,
  RiMapPinLine,
  RiPhoneLine,
  RiRefreshLine,
  RiShieldCheckLine,
  RiSparkling2Line,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getSettings, updateSettings, type BusinessSettings } from "@/lib/api"
import { formatDateTime, formatPercent } from "@/lib/format"

type SettingsFormState = {
  business_name: string
  business_email: string
  business_phone: string
  business_address: string
  default_currency: string
  default_tax_rate: string
  default_payment_terms: string
  default_validity_days: string
}

const emptyForm: SettingsFormState = {
  business_name: "",
  business_email: "",
  business_phone: "",
  business_address: "",
  default_currency: "USD",
  default_tax_rate: "0",
  default_payment_terms: "Payment due on receipt",
  default_validity_days: "30",
}

function toFormState(settings: BusinessSettings): SettingsFormState {
  return {
    business_name: settings.business_name,
    business_email: settings.business_email ?? "",
    business_phone: settings.business_phone,
    business_address: settings.business_address,
    default_currency: settings.default_currency,
    default_tax_rate: String(settings.default_tax_rate * 100),
    default_payment_terms: settings.default_payment_terms,
    default_validity_days: String(settings.default_validity_days),
  }
}

function App() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [form, setForm] = useState<SettingsFormState>(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadSettings()
  }, [])

  async function loadSettings() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getSettings()
      setSettings(response)
      setForm(toFormState(response))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load settings")
    } finally {
      setIsLoading(false)
    }
  }

  function handleChange(field: keyof SettingsFormState, value: string) {
    setSavedMessage(null)
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const payload = {
        business_name: form.business_name.trim(),
        business_email: form.business_email.trim() || null,
        business_phone: form.business_phone.trim(),
        business_address: form.business_address.trim(),
        default_currency: form.default_currency.trim().toUpperCase(),
        default_tax_rate: Number(form.default_tax_rate) / 100,
        default_payment_terms: form.default_payment_terms.trim(),
        default_validity_days: Number(form.default_validity_days),
      }

      const response = await updateSettings(payload)
      setSettings(response)
      setForm(toFormState(response))
      setSavedMessage("Defaults saved and ready for quote generation.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const summary = useMemo(() => {
    if (!settings) {
      return []
    }

    return [
      {
        label: "Tax default",
        value: formatPercent(settings.default_tax_rate),
        icon: RiBankCardLine,
      },
      {
        label: "Quote validity",
        value: `${settings.default_validity_days} days`,
        icon: RiShieldCheckLine,
      },
      {
        label: "Currency",
        value: settings.default_currency,
        icon: RiDatabase2Line,
      },
    ]
  }, [settings])

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
                Business defaults for faster quote drafting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-white/70">
              Phase 1
            </Badge>
            <Button
              variant="outline"
              className="h-10 rounded-full px-4 text-sm"
              onClick={() => void loadSettings()}
            >
              <RiRefreshLine className={isLoading ? "size-4 animate-spin" : "size-4"} />
              Refresh
            </Button>
          </div>
        </header>

        <main className="grid flex-1 gap-6 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:py-10">
          <Card className="relative overflow-hidden border-white/60 bg-white/75">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

            <CardHeader className="gap-5 p-7 sm:p-8">
              <Badge variant="secondary" className="w-fit bg-white/80">
                Settings workspace
              </Badge>

              <div className="space-y-4">
                <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.02]">
                  Dial in the defaults your quote assistant should reuse every time.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  This screen stores the business details, payment terms, tax rate, and
                  validity rules the backend will inject into each new quote draft.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white/70">
                  SQLite-backed
                </Badge>
                <Badge variant="outline" className="bg-white/70">
                  FastAPI connected
                </Badge>
                <Badge variant="outline" className="bg-white/70">
                  Ready for quote flow
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="px-7 pb-7 sm:px-8 sm:pb-8">
              {isLoading ? (
                <div className="flex min-h-80 items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-background/60">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <RiLoader4Line className="size-5 animate-spin" />
                    Loading business defaults...
                  </div>
                </div>
              ) : (
                <form className="grid gap-6" onSubmit={handleSubmit}>
                  <section className="grid gap-4 rounded-[1.75rem] border border-border/60 bg-background/65 p-5 sm:grid-cols-2">
                    <FieldBlock label="Business name" hint="Appears on every generated quote.">
                      <Input
                        value={form.business_name}
                        onChange={(event) => handleChange("business_name", event.target.value)}
                        placeholder="Northline Painting Co."
                      />
                    </FieldBlock>
                    <FieldBlock label="Default currency" hint="ISO code used for pricing.">
                      <Input
                        value={form.default_currency}
                        onChange={(event) => handleChange("default_currency", event.target.value)}
                        placeholder="USD"
                        maxLength={8}
                      />
                    </FieldBlock>
                    <FieldBlock label="Business email" hint="Used for quote headers and follow-up.">
                      <Input
                        type="email"
                        value={form.business_email}
                        onChange={(event) => handleChange("business_email", event.target.value)}
                        placeholder="quotes@northline.co"
                      />
                    </FieldBlock>
                    <FieldBlock label="Business phone" hint="Shown to prospects on the quote.">
                      <Input
                        value={form.business_phone}
                        onChange={(event) => handleChange("business_phone", event.target.value)}
                        placeholder="(555) 246-8100"
                      />
                    </FieldBlock>
                    <div className="sm:col-span-2">
                      <FieldBlock label="Business address" hint="Multi-line address block for the quote header.">
                        <Textarea
                          value={form.business_address}
                          onChange={(event) => handleChange("business_address", event.target.value)}
                          placeholder={"410 River Street\nSuite 8\nPortland, OR 97204"}
                        />
                      </FieldBlock>
                    </div>
                  </section>

                  <section className="grid gap-4 rounded-[1.75rem] border border-border/60 bg-background/65 p-5 sm:grid-cols-2">
                    <FieldBlock label="Default tax rate" hint="Enter a percentage like 20 for 20%.">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={form.default_tax_rate}
                        onChange={(event) => handleChange("default_tax_rate", event.target.value)}
                        placeholder="20"
                      />
                    </FieldBlock>
                    <FieldBlock label="Quote validity" hint="How long a draft should remain valid.">
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={form.default_validity_days}
                        onChange={(event) => handleChange("default_validity_days", event.target.value)}
                        placeholder="30"
                      />
                    </FieldBlock>
                    <div className="sm:col-span-2">
                      <FieldBlock label="Payment terms" hint="Inserted into quote terms until a niche-specific template exists.">
                        <Textarea
                          value={form.default_payment_terms}
                          onChange={(event) => handleChange("default_payment_terms", event.target.value)}
                          placeholder="Payment due within 14 days of acceptance."
                        />
                      </FieldBlock>
                    </div>
                  </section>

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-border/60 bg-white/70 px-4 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {savedMessage ?? "Save your defaults before building the quote workspace."}
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        Backend-owned settings row
                      </p>
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="h-11 rounded-full px-5 text-sm font-semibold shadow-lg shadow-primary/20"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <RiLoader4Line className="size-4 animate-spin" />
                      ) : (
                        <RiCheckLine className="size-4" />
                      )}
                      {isSaving ? "Saving..." : "Save defaults"}
                    </Button>
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  ) : null}
                </form>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border-white/60 bg-white/75">
              <CardHeader>
                <CardTitle>Defaults snapshot</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {summary.map((stat) => {
                  const Icon = stat.icon

                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-border/60 bg-background/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                            {stat.label}
                          </p>
                          <p className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                            {stat.value}
                          </p>
                        </div>
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
                          <Icon className="size-4" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="border-white/60 bg-white/75">
              <CardHeader>
                <CardTitle>Quote assistant inputs</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <SignalRow
                  icon={RiMailLine}
                  label="Contact details"
                  value={settings?.business_email || "Email not set yet"}
                />
                <SignalRow
                  icon={RiPhoneLine}
                  label="Phone"
                  value={settings?.business_phone || "Phone not set yet"}
                />
                <SignalRow
                  icon={RiMapPinLine}
                  label="Address"
                  value={settings?.business_address || "Address not set yet"}
                />
              </CardContent>
            </Card>

            <Card className="border-white/60 bg-white/70">
              <CardHeader>
                <CardTitle>Backend status</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Persistence
                  </p>
                  <p className="mt-2 font-heading text-2xl font-semibold tracking-tight">SQLite</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Defaults are stored in the backend settings row and reused across demo sessions.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Last saved
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/85">
                    {settings ? formatDateTime(settings.updated_at) : "Not loaded yet"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Next unlock
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/85">
                    Quote CRUD and the workspace editor can now rely on real business defaults.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string
  hint: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-2">
      <div className="space-y-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <p className="text-sm leading-6 text-muted-foreground">{hint}</p>
      </div>
      {children}
    </label>
  )
}

function SignalRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-4">
      <div className="mt-0.5 flex size-10 items-center justify-center rounded-2xl bg-secondary text-foreground">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground/85">{value}</p>
      </div>
    </div>
  )
}

export default App
