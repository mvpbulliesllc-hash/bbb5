"use client"

import { createContext, useContext, useState, useEffect } from "react"

// Allowed workspace email domains — swap to real OAuth at handoff
const ALLOWED_DOMAINS = ["paragonexteriornj.com", "mvpmgmtgroup.com", "ecoaisolutions.com"]

type AuthUser = { email: string; name: string }
type AuthCtx = {
  user: AuthUser | null
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  signOut: () => void
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  signIn: async () => ({ ok: false }),
  signOut: () => {},
})

const SESSION_KEY = "paragon_session"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) setUser(JSON.parse(raw))
    } catch {}
  }, [])

  async function signIn(email: string, _password: string) {
    const domain = email.split("@")[1]?.toLowerCase()
    if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
      return { ok: false, error: "Access restricted to authorized workspace accounts." }
    }
    const name = email.split("@")[0].replace(/[._]/g, " ")
    const u: AuthUser = { email, name }
    setUser(u)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(u))
    return { ok: true }
  }

  function signOut() {
    setUser(null)
    sessionStorage.removeItem(SESSION_KEY)
  }

  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
