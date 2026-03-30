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
    <div className="relative min-h-svh overflow-hidden px-6 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(71,159,169,0.3),transparent_60%)]" />
      <div className="absolute left-0 top-32 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(232,196,126,0.22),transparent_66%)] blur-3xl" />
      <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(83,183,156,0.2),transparent_65%)] blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100svh-3rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="grid gap-6">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                <RiSparkling2Line className="size-5" />
              </div>
              <div>
                <p className="font-heading text-xl font-semibold tracking-tight">AutoQuote</p>
              </div>
            </div>

            <h1 className="max-w-2xl font-heading text-5xl font-semibold tracking-tight text-balance lg:text-[4.2rem] lg:leading-[0.98]">
              {t("auth.title")}
            </h1>
            <p className="max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              {t("auth.description")}
            </p>
          </div>
        </section>

        <Card className="border-white/60 bg-white/80 shadow-2xl shadow-primary/10 backdrop-blur">
          <CardHeader className="space-y-4 p-7 sm:p-8">
            <div className="space-y-2">
              <CardTitle className="font-heading text-3xl font-semibold tracking-tight">
                {t("auth.cardTitle")}
              </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">{t("auth.cardDescription")}</p>
            </div>
          </CardHeader>

          <CardContent className="p-7 pt-0 sm:p-8 sm:pt-0">
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
                <div className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="h-12 rounded-full px-5 text-sm font-semibold shadow-lg shadow-primary/20"
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
    <label className="grid gap-2">
      <div className="space-y-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <p className="text-sm leading-6 text-muted-foreground">{hint}</p>
      </div>
      {children}
    </label>
  )
}

export default LoginPage
