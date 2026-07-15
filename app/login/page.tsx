"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Hexagon, Eye, EyeOff, LogIn, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim() || !password.trim()) {
      setError("Please enter your workspace email and password.")
      return
    }
    setLoading(true)
    const result = await signIn(email.trim().toLowerCase(), password)
    setLoading(false)
    if (result.ok) {
      router.replace("/")
    } else {
      setError(result.error ?? "Sign in failed.")
      emailRef.current?.focus()
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {/* card */}
      <div className="w-full max-w-sm rounded-2xl border border-line bg-panel shadow-2xl shadow-black/60">
        {/* brand header */}
        <div className="flex flex-col items-center gap-3 border-b border-line px-8 py-8">
          <span className="grid size-10 place-items-center rounded-xl bg-accent text-void shadow-[0_0_20px_var(--color-accent)/30]">
            <Hexagon className="size-5" />
          </span>
          <div className="text-center">
            <h1 className="text-base font-semibold tracking-tight text-text">Paragon Exterior NJ</h1>
            <p className="mt-0.5 text-[13px] text-text-faint">Back Office</p>
          </div>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} noValidate className="px-8 py-7">
          <div className="space-y-4">
            {/* email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[11px] font-medium uppercase tracking-wide text-text-faint">
                Workspace Email
              </label>
              <input
                ref={emailRef}
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@paragonexteriornj.com"
                className={cn(
                  "rounded-lg border bg-void px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-1 focus:ring-line-strong",
                  error ? "border-warn" : "border-line",
                )}
              />
            </div>

            {/* password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[11px] font-medium uppercase tracking-wide text-text-faint">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className={cn(
                    "w-full rounded-lg border bg-void px-3.5 py-2.5 pr-10 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-1 focus:ring-line-strong",
                    error ? "border-warn" : "border-line",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-muted"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* error */}
            {error ? (
              <div className="flex items-start gap-2 rounded-lg border border-warn/40 bg-warn/5 px-3 py-2.5 text-xs text-warn">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                {error}
              </div>
            ) : null}

            {/* submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-void transition-opacity disabled:opacity-50"
            >
              {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-void/30 border-t-void" />
              ) : (
                <LogIn className="size-4" />
              )}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </div>

          <p className="mt-5 text-center text-[11px] text-text-faint">
            Authorized personnel only.
            <br />
            Use your workspace email to access this platform.
          </p>
        </form>
      </div>

      {/* footer */}
      <p className="mt-6 text-[11px] text-text-faint">
        &copy; {new Date().getFullYear()} Paragon Exterior NJ. All rights reserved.
      </p>
    </main>
  )
}
