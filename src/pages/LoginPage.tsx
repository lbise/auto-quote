import { useState, type FormEvent, type ReactNode } from "react"
import { RiLoader4Line, RiShieldKeyholeLine, RiSparkling2Line } from "@remixicon/react"
import { useTranslation } from "react-i18next"
import { Navigate } from "react-router-dom"

import { useAuth } from "@/components/auth/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

function LoginPage() {
  const { t } = useTranslation()
  const { session, isLoading, login } = useAuth()
  const [username, setUsername] = useState("demo")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isLoading && session.authenticated) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await login({ username: username.trim(), password })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : t("auth.errors.login"))
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-svh overflow-hidden px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Warm decorative gradients */}
      <div className="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,oklch(0.85_0.08_40_/_0.25),transparent_60%)]" />
      <div className="absolute left-0 top-40 h-64 w-64 rounded-full bg-[radial-gradient(circle,oklch(0.90_0.06_75_/_0.2),transparent_66%)] blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100svh-3rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Hero side */}
        <section className="grid gap-6">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <RiSparkling2Line className="size-5" />
              </div>
              <span className="font-heading text-lg font-semibold tracking-tight">AutoQuote</span>
            </div>

            <h1 className="max-w-lg font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
              {t("auth.title")}
            </h1>
            <p className="max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
              {t("auth.description")}
            </p>
          </div>
        </section>

        {/* Login card */}
        <Card className="shadow-md shadow-stone-900/[0.06]">
          <CardHeader className="space-y-3 p-6 sm:p-8">
            <CardTitle className="font-heading text-2xl font-semibold tracking-tight">
              {t("auth.cardTitle")}
            </CardTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("auth.cardDescription")}
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
            <form className="grid gap-5" onSubmit={handleSubmit}>
              <Field label={t("auth.fields.username.label")} hint={t("auth.fields.username.hint")}>
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder={t("auth.fields.username.placeholder")}
                  autoComplete="username"
                />
              </Field>

              <Field label={t("auth.fields.password.label")} hint={t("auth.fields.password.hint")}>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t("auth.fields.password.placeholder")}
                  autoComplete="current-password"
                />
              </Field>

              {error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="mt-1 w-full font-semibold"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? (
                  <RiLoader4Line className="size-4 animate-spin" />
                ) : (
                  <RiShieldKeyholeLine className="size-4" />
                )}
                {isSubmitting || isLoading ? t("auth.actions.signingIn") : t("auth.actions.signIn")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      {children}
    </label>
  )
}

export default LoginPage
