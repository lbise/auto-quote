import { type ComponentType, type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react"
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
  RiTranslate2,
} from "@remixicon/react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getSettings, updateSettings, type BusinessSettings } from "@/lib/api"
import { defaultLocale, supportedLocales, type AppLocale } from "@/lib/locale"
import { formatDateTime, formatPercent } from "@/lib/format"

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
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
      <Card className="relative overflow-hidden border-white/60 bg-white/75">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

        <CardHeader className="gap-5 p-7 sm:p-8">
          <Badge variant="secondary" className="w-fit bg-white/80">
            {t("settings.badge")}
          </Badge>

          <div className="space-y-4">
            <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.02]">
              {t("settings.title")}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {t("settings.description")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-white/70">
              {t("settings.badges.sqlite")}
            </Badge>
            <Badge variant="outline" className="bg-white/70">
              {t("settings.badges.fastapi")}
            </Badge>
            <Badge variant="outline" className="bg-white/70">
              {t("settings.badges.phase1")}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-7 pb-7 sm:px-8 sm:pb-8">
          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-background/60">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <RiLoader4Line className="size-5 animate-spin" />
                {t("settings.loading")}
              </div>
            </div>
          ) : (
            <form className="grid gap-6" onSubmit={handleSubmit}>
              <section className="grid gap-4 rounded-[1.75rem] border border-border/60 bg-background/65 p-5 sm:grid-cols-2">
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

              <section className="grid gap-4 rounded-[1.75rem] border border-border/60 bg-background/65 p-5 sm:grid-cols-2">
                <FieldBlock
                  label={t("settings.form.defaultLocale.label")}
                  hint={t("settings.form.defaultLocale.hint")}
                >
                  <select
                    value={form.default_locale}
                    onChange={(event) => handleChange("default_locale", event.target.value)}
                    className="flex h-11 w-full rounded-xl border border-border/70 bg-background/80 px-4 py-3 text-sm text-foreground shadow-sm transition-all outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                  >
                    {supportedLocales.map((localeOption) => (
                      <option key={localeOption} value={localeOption}>
                        {t(`app.language.${localeOption}`)}
                      </option>
                    ))}
                  </select>
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

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-border/60 bg-white/70 px-4 py-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {savedMessage ?? t("settings.footer.idle")}
                  </p>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {t("settings.footer.backendOwned")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full px-5 text-sm"
                    onClick={() => void loadSettings()}
                  >
                    <RiRefreshLine className={isLoading ? "size-4 animate-spin" : "size-4"} />
                    {t("settings.actions.refresh")}
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="h-11 rounded-full px-5 text-sm font-semibold shadow-lg shadow-primary/20"
                    disabled={isSaving}
                  >
                    {isSaving ? <RiLoader4Line className="size-4 animate-spin" /> : <RiCheckLine className="size-4" />}
                    {isSaving ? t("settings.actions.saving") : t("settings.actions.save")}
                  </Button>
                </div>
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
            <CardTitle>{t("settings.summary.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {summary.map((stat) => {
              const Icon = stat.icon

              return (
                <div key={stat.label} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {stat.label}
                      </p>
                      <p className="mt-2 font-heading text-2xl font-semibold tracking-tight">{stat.value}</p>
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
            <CardTitle>{t("settings.assistantInputs.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <SignalRow
              icon={RiMailLine}
              label={t("settings.assistantInputs.contactDetails")}
              value={settings?.business_email || t("common.notSetYet")}
            />
            <SignalRow
              icon={RiPhoneLine}
              label={t("settings.assistantInputs.phone")}
              value={settings?.business_phone || t("common.notSetYet")}
            />
            <SignalRow
              icon={RiMapPinLine}
              label={t("settings.assistantInputs.address")}
              value={settings?.business_address || t("common.notSetYet")}
            />
          </CardContent>
        </Card>

        <Card className="border-white/60 bg-white/70">
          <CardHeader>
            <CardTitle>{t("settings.backend.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {t("settings.backend.persistenceLabel")}
              </p>
              <p className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                {t("settings.backend.persistenceValue")}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("settings.backend.persistenceDescription")}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {t("settings.backend.lastSaved")}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/85">
                {settings ? formatDateTime(settings.updated_at, locale) : t("common.notSetYet")}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {t("settings.backend.nextUnlock")}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/85">
                {t("settings.backend.nextUnlockDescription")}
              </p>
            </div>
          </CardContent>
        </Card>
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
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground/85">{value}</p>
      </div>
    </div>
  )
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

export default SettingsPage
