"use client"

import { SignIn } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function LoginCard() {
  const params = useSearchParams()
  const domainError = params.get("error") === "domain"

  return (
    <div className="w-full max-w-sm px-4">
      {/* wordmark */}
      <div className="mb-8 text-center">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-text-faint">
          Paragon Exterior NJ
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-text">Back Office</h1>
        <p className="mt-1.5 text-sm text-text-faint">Authorized workspace access only.</p>
      </div>

      {/* domain rejection banner */}
      {domainError && (
        <div className="mb-5 rounded-lg border border-warn/30 bg-warn/5 px-4 py-3 text-center text-sm text-warn">
          That account is not authorized. Use your{" "}
          <strong>@paragonexteriornj.com</strong> Google account.
        </div>
      )}

      {/* Clerk widget — dark themed, matches the obsidian shell */}
      <SignIn
        appearance={{
          baseTheme: dark,
          variables: {
            colorBackground: "#0f0f0f",
            colorInputBackground: "#141414",
            colorInputText: "#e8e8e8",
            colorText: "#e8e8e8",
            colorTextSecondary: "#6b6b6b",
            colorPrimary: "#e8e8e8",
            colorDanger: "#e8a838",
            borderRadius: "0.625rem",
            fontFamily: "var(--font-geist-sans)",
            fontSize: "0.875rem",
          },
          elements: {
            card: "shadow-2xl shadow-black/60 border border-white/10 !bg-[#0f0f0f]",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            // Show only the Google social button — disable email/password entirely
            socialButtonsBlockButton:
              "border border-white/10 bg-[#141414] text-white hover:bg-white/5 transition-colors w-full",
            socialButtonsBlockButtonText: "font-medium",
            dividerLine: "bg-white/8",
            dividerText: "text-white/30 text-xs",
            footerAction: "hidden",
            footer: "hidden",
            formFieldInput: "hidden",
            formFieldLabel: "hidden",
            formButtonPrimary: "hidden",
            identityPreviewEditButton: "text-white/50 hover:text-white",
          },
        }}
        routing="hash"
        afterSignInUrl="/"
        // Hide all sign-in methods except Google
        initialValues={{ emailAddress: "" }}
      />

      <p className="mt-6 text-center text-[11px] text-text-faint">
        &copy; {new Date().getFullYear()} Paragon Exterior NJ &mdash; Internal use only
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="relative grid min-h-screen place-items-center bg-void">
      {/* subtle grid texture */}
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
