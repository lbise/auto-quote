import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react"
import {
  RiAddLine,
  RiBankCardLine,
  RiCheckLine,
  RiDatabase2Line,
  RiDeleteBinLine,
  RiLoader4Line,
  RiMoneyDollarCircleLine,
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
import {
  getSettings,
  updateSettings,
  type BusinessSettings,
  type PricedItem,
  type PricingMode,
} from "@/lib/api"
import { formatPercent } from "@/lib/format"
import { defaultLocale, supportedLocales, type AppLocale } from "@/lib/locale"
import { defaultUnitForPricingMode, formatNumberInput, parseNumberInput, parsePositiveNumber } from "@/lib/priced-items"

type PricedItemFormState = {
  id: string
  name: string
  description: string
  pricing_mode: PricingMode
  unit: string
  unit_price: string
  default_quantity: string
  is_active: boolean
}

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
  priced_items: PricedItemFormState[]
}

const emptyForm: SettingsFormState = {
  business_name: "",
  business_email: "",
  business_phone: "",
  business_address: "",
  default_locale: defaultLocale,
  default_currency: "CHF",
  default_tax_rate: "7.7",
  default_payment_terms: "Paiement à réception",
  default_validity_days: "30",
  priced_items: [],
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
    setError(null)
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updatePricedItem(
    index: number,
    field: keyof PricedItemFormState,
    value: string | boolean
  ) {
    setSavedMessage(null)
    setError(null)
    setForm((current) => {
      const priced_items = [...current.priced_items]
      priced_items[index] = {
        ...priced_items[index],
        [field]: value,
      }

      return { ...current, priced_items }
    })
  }

  function updatePricedItemMode(index: number, pricingMode: PricingMode) {
    setSavedMessage(null)
    setError(null)
    setForm((current) => {
      const priced_items = [...current.priced_items]
      const existing = priced_items[index]
      priced_items[index] = {
        ...existing,
        pricing_mode: pricingMode,
        unit: defaultUnitForPricingMode(pricingMode, existing.unit),
        default_quantity:
          pricingMode === "fixed"
            ? existing.default_quantity || "1"
            : "1",
      }

      return { ...current, priced_items }
    })
  }

  function addPricedItem() {
    setSavedMessage(null)
    setError(null)
    setForm((current) => ({
      ...current,
      priced_items: [...current.priced_items, emptyPricedItem()],
    }))
  }

  function removePricedItem(index: number) {
    setSavedMessage(null)
    setError(null)
    setForm((current) => ({
      ...current,
      priced_items: current.priced_items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    const pricedItemError = validatePricedItems(form.priced_items, t)
    if (pricedItemError) {
      setError(pricedItemError)
      setIsSaving(false)
      return
    }

    try {
      const payload = {
        business_name: form.business_name.trim(),
        business_email: form.business_email.trim() || null,
        business_phone: form.business_phone.trim(),
        business_address: form.business_address.trim(),
        default_locale: form.default_locale,
        default_currency: form.default_currency.trim().toUpperCase(),
        default_tax_rate: (parseNumberInput(form.default_tax_rate) ?? 0) / 100,
        default_payment_terms: form.default_payment_terms.trim(),
        default_validity_days: Number(form.default_validity_days),
        priced_items: form.priced_items
          .filter((item) => !isBlankPricedItem(item))
          .map((item) => ({
            id: item.id,
            name: item.name.trim(),
            description: item.description.trim() || item.name.trim(),
            pricing_mode: item.pricing_mode,
            unit: defaultUnitForPricingMode(item.pricing_mode, item.unit),
            unit_price_cents: parseMoneyToCents(item.unit_price) ?? 0,
            default_quantity:
              item.pricing_mode === "fixed"
                ? parsePositiveNumber(item.default_quantity) ?? 1
                : 1,
            is_active: item.is_active,
          })),
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

  const activePricedItemCount = settings?.priced_items.filter((item) => item.is_active).length ?? 0
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
        {
          label: t("settings.summary.pricedItems"),
          value: t("settings.summary.activePricedItems", { count: activePricedItemCount }),
          icon: RiMoneyDollarCircleLine,
        },
      ]
    : []

  return (
    <div className="grid gap-5 lg:grid-cols-[1.28fr_0.72fr] lg:items-start">
      <Card>
        <CardContent className="pt-6">
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

              <section className="grid gap-4 rounded-lg border border-border/60 bg-secondary/30 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <SectionTitle icon={RiMoneyDollarCircleLine} title={t("settings.sections.pricedItems")} />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t("settings.catalog.description")}
                    </p>
                  </div>

                  <Button type="button" variant="outline" size="sm" onClick={addPricedItem}>
                    <RiAddLine className="size-3.5" />
                    {t("settings.catalog.addItem")}
                  </Button>
                </div>

                {form.priced_items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-card px-4 py-6 text-center">
                    <p className="text-sm font-medium text-foreground">{t("settings.catalog.emptyTitle")}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {t("settings.catalog.emptyDescription")}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {form.priced_items.map((item, index) => (
                      <div key={item.id} className="grid gap-4 rounded-lg border border-border/60 bg-card p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {item.name.trim()
                                ? item.name
                                : t("settings.catalog.untitledItem", { index: index + 1 })}
                            </p>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {t(`settings.catalog.modeHints.${item.pricing_mode}`)}
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removePricedItem(index)}
                          >
                            <RiDeleteBinLine className="size-3.5" />
                            {t("settings.catalog.removeItem")}
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <FieldBlock
                            label={t("settings.catalog.fields.name.label")}
                            hint={t("settings.catalog.fields.name.hint")}
                          >
                            <Input
                              value={item.name}
                              onChange={(event) => updatePricedItem(index, "name", event.target.value)}
                              placeholder={t("settings.catalog.fields.name.placeholder")}
                            />
                          </FieldBlock>

                          <FieldBlock
                            label={t("settings.catalog.fields.pricingMode.label")}
                            hint={t("settings.catalog.fields.pricingMode.hint")}
                          >
                            <Select
                              value={item.pricing_mode}
                              onValueChange={(value) => updatePricedItemMode(index, value as PricingMode)}
                            >
                              <SelectTrigger className="h-10 w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">{t("settings.catalog.modes.fixed")}</SelectItem>
                                <SelectItem value="area_rectangle">{t("settings.catalog.modes.area_rectangle")}</SelectItem>
                                <SelectItem value="volume_direct">{t("settings.catalog.modes.volume_direct")}</SelectItem>
                              </SelectContent>
                            </Select>
                          </FieldBlock>

                          <div className="md:col-span-2">
                            <FieldBlock
                              label={t("settings.catalog.fields.description.label")}
                              hint={t("settings.catalog.fields.description.hint")}
                            >
                              <Input
                                value={item.description}
                                onChange={(event) => updatePricedItem(index, "description", event.target.value)}
                                placeholder={t("settings.catalog.fields.description.placeholder")}
                              />
                            </FieldBlock>
                          </div>

                          <FieldBlock
                            label={t("settings.catalog.fields.unitPrice.label")}
                            hint={t("settings.catalog.fields.unitPrice.hint")}
                          >
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(event) => updatePricedItem(index, "unit_price", event.target.value)}
                              placeholder={t("settings.catalog.fields.unitPrice.placeholder")}
                            />
                          </FieldBlock>

                          {item.pricing_mode === "fixed" ? (
                            <>
                              <FieldBlock
                                label={t("settings.catalog.fields.unit.label")}
                                hint={t("settings.catalog.fields.unit.hint")}
                              >
                                <Input
                                  value={item.unit}
                                  onChange={(event) => updatePricedItem(index, "unit", event.target.value)}
                                  placeholder={t("settings.catalog.fields.unit.placeholder")}
                                />
                              </FieldBlock>
                              <FieldBlock
                                label={t("settings.catalog.fields.defaultQuantity.label")}
                                hint={t("settings.catalog.fields.defaultQuantity.hint")}
                              >
                                <Input
                                  type="number"
                                  min="0.001"
                                  step="0.001"
                                  value={item.default_quantity}
                                  onChange={(event) => updatePricedItem(index, "default_quantity", event.target.value)}
                                  placeholder={t("settings.catalog.fields.defaultQuantity.placeholder")}
                                />
                              </FieldBlock>
                            </>
                          ) : (
                            <FieldBlock
                              label={t("settings.catalog.fields.unit.label")}
                              hint={t("settings.catalog.autoUnitHint")}
                            >
                              <Input value={defaultUnitForPricingMode(item.pricing_mode, item.unit)} readOnly />
                            </FieldBlock>
                          )}

                          <div className="md:col-span-2">
                            <label className="inline-flex items-center gap-2 text-sm text-foreground">
                              <input
                                type="checkbox"
                                checked={item.is_active}
                                onChange={(event) => updatePricedItem(index, "is_active", event.target.checked)}
                                className="size-3.5 rounded border-border text-primary focus:ring-primary"
                              />
                              <span>{t("settings.catalog.fields.active")}</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

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
    priced_items: settings.priced_items.map(toPricedItemFormState),
  }
}

function toPricedItemFormState(item: PricedItem): PricedItemFormState {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    pricing_mode: item.pricing_mode,
    unit: defaultUnitForPricingMode(item.pricing_mode, item.unit),
    unit_price: formatMoneyInput(item.unit_price_cents),
    default_quantity: formatNumberInput(item.default_quantity),
    is_active: item.is_active,
  }
}

function emptyPricedItem(): PricedItemFormState {
  return {
    id: createLocalId(),
    name: "",
    description: "",
    pricing_mode: "fixed",
    unit: "job",
    unit_price: "",
    default_quantity: "1",
    is_active: true,
  }
}

function isBlankPricedItem(item: PricedItemFormState): boolean {
  return !item.name.trim() && !item.description.trim() && !item.unit_price.trim()
}

function validatePricedItems(
  items: PricedItemFormState[],
  t: ReturnType<typeof useTranslation>["t"]
): string | null {
  for (const item of items) {
    if (isBlankPricedItem(item)) {
      continue
    }

    const label = item.name.trim() || t("settings.catalog.fallbackItemName")

    if (!item.name.trim()) {
      return t("settings.errors.pricedItemName")
    }

    if (parseMoneyToCents(item.unit_price) === null) {
      return t("settings.errors.pricedItemPrice", { name: label })
    }

    if (item.pricing_mode === "fixed" && !item.unit.trim()) {
      return t("settings.errors.pricedItemUnit", { name: label })
    }

    if (item.pricing_mode === "fixed" && parsePositiveNumber(item.default_quantity) === null) {
      return t("settings.errors.pricedItemQuantity", { name: label })
    }
  }

  return null
}

function createLocalId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `priced-item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function parseMoneyToCents(value: string): number | null {
  const normalized = value.trim()

  if (!normalized) {
    return null
  }

  const parsed = Number(normalized)
  if (Number.isNaN(parsed)) {
    return null
  }

  return Math.round(parsed * 100)
}

function formatMoneyInput(value: number): string {
  return (value / 100).toFixed(value % 100 === 0 ? 0 : 2)
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
