import { GoogleLogin, type CredentialResponse } from "@react-oauth/google"
import {
  Brain,
  Loader2,
  MessageSquare,
  Moon,
  Sparkles,
  Sun,
  Zap,
} from "lucide-react"
import { useState } from "react"

import { APP_HEADLINE, APP_HEADLINE_ACCENT, APP_NAME } from "@/lib/brand"
import { useTheme } from "@/components/theme-provider"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: MessageSquare,
    title: "Natural conversations",
    description: "Chat with an AI that understands context and remembers you.",
  },
  {
    icon: Zap,
    title: "Real-time responses",
    description: "Watch answers stream in live, token by token.",
  },
  {
    icon: Brain,
    title: "Smart memory",
    description: "Your preferences and facts are recalled across sessions.",
  },
]

export function LoginPage() {
  const { login } = useAuth()
  const { theme, setTheme } = useTheme()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme

  const handleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setError("Google sign-in failed. Please try again.")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await login(response.credential)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-background lg:flex-row">
      {/* Theme toggle */}
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
        className="absolute top-4 right-4 z-10 flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {resolvedTheme === "dark" ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )}
      </button>

      {/* Brand panel */}
      <section className="relative flex flex-1 flex-col justify-between overflow-hidden border-b border-border px-5 py-10 sm:px-8 sm:py-12 lg:border-r lg:border-b-0 lg:px-12 lg:py-16">
        <div className="login-brand-glow pointer-events-none absolute inset-0" />

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
          </div>
        </div>

        <div className="relative my-10 max-w-md space-y-6 lg:my-0">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {APP_HEADLINE},
              <br />
              <span className="text-primary">{APP_HEADLINE_ACCENT}</span>
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              Ask questions, write code, brainstorm ideas, and get instant
              help — all in one place.
            </p>
          </div>

          <ul className="space-y-4">
            {features.map((feature) => (
              <li key={feature.title} className="flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative hidden text-xs text-muted-foreground lg:block">
          Built for speed, privacy, and seamless conversations.
        </p>
      </section>

      {/* Sign-in panel */}
      <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-6 sm:py-12 lg:px-12">
        <div className="w-full max-w-[22rem] space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-xl font-semibold tracking-tight">
              Sign in to continue
            </h2>
            <p className="text-sm text-muted-foreground">
              Use your Google account to get started in seconds.
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <div
                className={cn(
                  "flex w-full justify-center transition-opacity [&>div]:w-full [&>div]:!max-w-full",
                  isSubmitting && "pointer-events-none opacity-50"
                )}
              >
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() =>
                    setError("Google sign-in was cancelled or failed")
                  }
                  theme={resolvedTheme === "dark" ? "filled_black" : "outline"}
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="320"
                />
              </div>
            ) : (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
                Set VITE_GOOGLE_CLIENT_ID in frontend/.env
              </p>
            )}

            {isSubmitting && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Signing you in...
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </div>

          <p className="text-center text-xs leading-relaxed text-muted-foreground lg:text-left">
            By continuing, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </section>
    </div>
  )
}
