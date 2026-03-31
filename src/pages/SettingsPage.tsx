import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react"
import {
  RiBankCardLine,
  RiCheckLine,
  RiDatabase2Line,
  RiLoader4Line,
  RiRefreshLine,
  RiSettings3Line,
  RiShieldCheckLine,
  RiStoreLine,
  RiTranslate2,
} from "@remixicon/react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { getSettings, updateSettings, type BusinessSettings } from "@/lib/api"
import { defaultLocale, supportedLocales, type AppLocale } from "@/lib/locale"
import { formatPercent } from "@/lib/format"

type SettingsFormState = {
  business_name: string
  business_email: string
  business_phone: string
  business_address: string
  default_locale: AppLocale
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
  default_locale: defaultLocale,
  default_currency: "USD",
  default_tax_rate: "0",
  default_payment_terms: "Paiement à réception",
  default_validity_days: "30",
}

function toFormState(settings: BusinessSettings): SettingsFormState {
  return {
    business_name: settings.business_name,
    business_email: settings.business_email ?? "",
    business_phone: settings.business_phone,
    business_address: settings.business_address,
    default_locale: settings.default_locale,
    default_currency: settings.default_currency,
    default_tax_rate: String(settings.default_tax_rate * 100),
    default_payment_terms: settings.default_payment_terms,
    default_validity_days: String(settings.default_validity_days),
  }
}

function SettingsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [form, setForm] = useState<SettingsFormState>(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await getSettings()
      setSettings(response)
      setForm(toFormState(response))
    } catch (loadError) {
      setError(toErrorMessage(loadError, t("settings.errors.load")))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

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
        default_locale: form.default_locale,
        default_currency: form.default_currency.trim().toUpperCase(),
        default_tax_rate: Number(form.default_tax_rate) / 100,
        default_payment_terms: form.default_payment_terms.trim(),
        default_validity_days: Number(form.default_validity_days),
      }

      const response = await updateSettings(payload)
      setSettings(response)
      setForm(toFormState(response))
      setSavedMessage(t("settings.saved"))
      void i18n.changeLanguage(response.default_locale)
    } catch (saveError) {
      setError(toErrorMessage(saveError, t("settings.errors.save")))
    } finally {
      setIsSaving(false)
    }
  }

  const summary = settings
    ? [
        {
          label: t("settings.summary.taxDefault"),
          value: formatPercent(settings.default_tax_rate, locale),
          icon: RiBankCardLine,
        },
        {
          label: t("settings.summary.quoteValidity"),
          value: t("settings.summary.validityDays", { count: settings.default_validity_days }),
          icon: RiShieldCheckLine,
        },
        {
          label: t("settings.summary.currency"),
          value: settings.default_currency,
          icon: RiDatabase2Line,
        },
        {
          label: t("settings.summary.language"),
          value: t(`app.language.${settings.default_locale}`),
          icon: RiTranslate2,
        },
      ]
    : []

  return (
    <div className="grid gap-5 lg:grid-cols-[1.28fr_0.72fr] lg:items-start">
      {/* ── Main form card ── */}
      <Card>
        <CardContent className="pt-6">
          {/* Page header */}
          <div className="space-y-1.5 pb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <RiSettings3Line className="size-4" />
              </div>
              <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                {t("settings.title")}
              </h1>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("settings.description")}
            </p>
          </div>

          <Separator />

          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30">
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <RiLoader4Line className="size-4 animate-spin" />
                {t("settings.loading")}
              </div>
            </div>
          ) : (
            <form className="mt-5 grid gap-5" onSubmit={handleSubmit}>
              {/* Section: Business info */}
              <section className="grid gap-4 rounded-lg border border-border/60 bg-secondary/30 p-5 sm:grid-cols-2">
                <SectionTitle icon={RiStoreLine} title={t("settings.sections.businessInfo")} />

                <FieldBlock
                  label={t("settings.form.businessName.label")}
                  hint={t("settings.form.businessName.hint")}
                >
                  <Input
                    value={form.business_name}
                    onChange={(event) => handleChange("business_name", event.target.value)}
                    placeholder={t("settings.form.businessName.placeholder")}
                  />
                </FieldBlock>
                <FieldBlock
                  label={t("settings.form.defaultCurrency.label")}
                  hint={t("settings.form.defaultCurrency.hint")}
                >
                  <Input
                    value={form.default_currency}
                    onChange={(event) => handleChange("default_currency", event.target.value)}
                    placeholder={t("settings.form.defaultCurrency.placeholder")}
                    maxLength={8}
                  />
                </FieldBlock>
                <FieldBlock
                  label={t("settings.form.businessEmail.label")}
                  hint={t("settings.form.businessEmail.hint")}
                >
                  <Input
                    type="email"
                    value={form.business_email}
                    onChange={(event) => handleChange("business_email", event.target.value)}
                    placeholder={t("settings.form.businessEmail.placeholder")}
                  />
                </FieldBlock>
                <FieldBlock
                  label={t("settings.form.businessPhone.label")}
                  hint={t("settings.form.businessPhone.hint")}
                >
                  <Input
                    value={form.business_phone}
                    onChange={(event) => handleChange("business_phone", event.target.value)}
                    placeholder={t("settings.form.businessPhone.placeholder")}
                  />
                </FieldBlock>
                <div className="sm:col-span-2">
                  <FieldBlock
                    label={t("settings.form.businessAddress.label")}
                    hint={t("settings.form.businessAddress.hint")}
                  >
                    <Textarea
                      value={form.business_address}
                      onChange={(event) => handleChange("business_address", event.target.value)}
                      placeholder={t("settings.form.businessAddress.placeholder")}
                    />
                  </FieldBlock>
                </div>
              </section>

              {/* Section: Defaults */}
              <section className="grid gap-4 rounded-lg border border-border/60 bg-secondary/30 p-5 sm:grid-cols-2">
                <SectionTitle icon={RiTranslate2} title={t("settings.sections.defaults")} />

                <FieldBlock
                  label={t("settings.form.defaultLocale.label")}
                  hint={t("settings.form.defaultLocale.hint")}
                >
                  <Select
                    value={form.default_locale}
                    onValueChange={(value) => handleChange("default_locale", value)}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedLocales.map((localeOption) => (
                        <SelectItem key={localeOption} value={localeOption}>
                          {t(`app.language.${localeOption}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldBlock>
                <FieldBlock
                  label={t("settings.form.defaultTaxRate.label")}
                  hint={t("settings.form.defaultTaxRate.hint")}
                >
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.default_tax_rate}
                    onChange={(event) => handleChange("default_tax_rate", event.target.value)}
                    placeholder={t("settings.form.defaultTaxRate.placeholder")}
                  />
                </FieldBlock>
                <FieldBlock
                  label={t("settings.form.defaultValidityDays.label")}
                  hint={t("settings.form.defaultValidityDays.hint")}
                >
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={form.default_validity_days}
                    onChange={(event) => handleChange("default_validity_days", event.target.value)}
                    placeholder={t("settings.form.defaultValidityDays.placeholder")}
                  />
                </FieldBlock>
                <div className="sm:col-span-2">
                  <FieldBlock
                    label={t("settings.form.defaultPaymentTerms.label")}
                    hint={t("settings.form.defaultPaymentTerms.hint")}
                  >
                    <Textarea
                      value={form.default_payment_terms}
                      onChange={(event) => handleChange("default_payment_terms", event.target.value)}
                      placeholder={t("settings.form.defaultPaymentTerms.placeholder")}
                    />
                  </FieldBlock>
                </div>
              </section>

              {/* Footer bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-card px-4 py-3.5">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {savedMessage ?? t("settings.footer.idle")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void loadSettings()}
                  >
                    <RiRefreshLine className={isLoading ? "size-3.5 animate-spin" : "size-3.5"} />
                    {t("settings.actions.refresh")}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSaving}
                  >
                    {isSaving ? <RiLoader4Line className="size-3.5 animate-spin" /> : <RiCheckLine className="size-3.5" />}
                    {isSaving ? t("settings.actions.saving") : t("settings.actions.save")}
                  </Button>
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
            </form>
          )}
        </CardContent>
      </Card>

      {/* ── Summary sidebar ── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2.5 pb-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RiDatabase2Line className="size-4" />
            </div>
            <p className="font-heading text-base font-semibold tracking-tight text-foreground">
              {t("settings.summary.title")}
            </p>
          </div>

          <div className="grid gap-2.5">
            {summary.map((stat) => {
              const Icon = stat.icon

              return (
                <div key={stat.label} className="rounded-lg border border-border/60 bg-secondary/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="mt-1.5 font-heading text-xl font-semibold tracking-tight">
                        {stat.value}
                      </p>
                    </div>
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof RiStoreLine
  title: string
}) {
  return (
    <div className="sm:col-span-2 flex items-center gap-2.5 pb-1">
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <p className="font-heading text-base font-semibold tracking-tight text-foreground">{title}</p>
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
    <label className="grid gap-1.5">
      <div className="space-y-0.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      {children}
    </label>
  )
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

export default SettingsPage
