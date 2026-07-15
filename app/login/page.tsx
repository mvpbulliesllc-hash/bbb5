"use client"

import { signIn } from "next-auth/react"
import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function LoginCard() {
  const [loading, setLoading] = useState(false)
  const params = useSearchParams()
  const denied = params.get("error") === "AccessDenied"

  async function handleGoogle() {
    setLoading(true)
    await signIn("google", { callbackUrl: "/" })
  }

  return (
    <div className="w-full max-w-sm px-4">
      {/* wordmark */}
      <div className="mb-10 text-center">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-text-faint">
          Paragon Exterior NJ
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-text">Back Office</h1>
        <p className="mt-1.5 text-sm text-text-faint">Authorized workspace access only.</p>
      </div>

      {/* card */}
      <div className="rounded-2xl border border-line bg-panel px-8 py-8 shadow-2xl shadow-black/60">
        {denied && (
          <div className="mb-6 rounded-lg border border-warn/30 bg-warn/5 px-4 py-3 text-sm text-warn">
            That account is not authorized. Sign in with your{" "}
            <strong>@paragonexteriornj.com</strong> or{" "}
            <strong>@mvpmgmtgroup.com</strong> workspace email.
          </div>
        )}

        <p className="mb-6 text-center text-xs text-text-faint">
          Sign in with your company Google account to continue.
        </p>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-void px-4 py-3 text-sm font-semibold text-text transition-all hover:border-line-strong hover:bg-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {/* Google G — inline SVG, no external dep */}
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-21 0-1.3-.2-2.7-.5-4z" />
            <path fill="#34A853" d="M6.3 14.7l7 5.1C15.1 16 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2c-7.6 0-14.1 4.5-17.7 11.3z" />
            <path fill="#FBBC05" d="M24 46c5.5 0 10.6-1.9 14.5-5.1l-6.7-5.5C29.8 37 27 38 24 38c-6.1 0-10.7-3.9-11.8-9.1L5.1 34.1C8.7 41.3 15.7 46 24 46z" />
            <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-1.1 3.3-3.8 5.8-7.2 7l6.7 5.5C39.9 37.6 44 31.4 44 24c0-1.3-.2-2.7-.5-4z" />
          </svg>
          {loading ? "Redirecting…" : "Sign in with Google"}
        </button>

        <p className="mt-5 text-center text-[11px] text-text-faint">
          Only <strong className="text-text-muted">@paragonexteriornj.com</strong> &amp;{" "}
          <strong className="text-text-muted">@mvpmgmtgroup.com</strong> accounts are permitted.
        </p>
      </div>

      <p className="mt-6 text-center text-[11px] text-text-faint">
        &copy; {new Date().getFullYear()} Paragon Exterior NJ &mdash; Powered by MVP Management Group
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="relative grid min-h-screen place-items-center bg-void">
      {/* grid texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-line) 1px,transparent 1px),linear-gradient(90deg,var(--color-line) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
        aria-hidden="true"
      />
      <Suspense>
        <LoginCard />
      </Suspense>
    </div>
  )
}
