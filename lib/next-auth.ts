import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

/** Workspace domains that are allowed to sign in. */
const ALLOWED_DOMAINS = [
  "paragonexteriornj.com",
  "paragonexteriorsnj.com",
  "mvpmgmtgroup.com",
  "ecoaisolutions.com",
]

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // Always show the account-picker so multi-account users can choose
          prompt: "select_account",
          // Request offline access so we can refresh tokens later
          access_type: "offline",
        },
      },
    }),
  ],

  callbacks: {
    /** Block sign-in for any email not on an allowed workspace domain. */
    async signIn({ profile }) {
      const email = profile?.email ?? ""
      const domain = email.split("@")[1] ?? ""
      if (!ALLOWED_DOMAINS.includes(domain)) {
        return false
      }
      return true
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
})
