import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Routes that don't require auth
const isPublicRoute = createRouteMatcher(["/login(.*)", "/api/webhooks(.*)"])

// Allowed email domains — only these can access the back office
const ALLOWED_DOMAINS = ["paragonexteriornj.com", "mvpmgmtgroup.com", "ecoaisolutions.com"]

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next()

  const { userId, sessionClaims } = await auth()

  // Not signed in — redirect to login
  if (!userId) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirect_url", req.url)
    return NextResponse.redirect(loginUrl)
  }

  // Domain check — reject accounts outside allowed workspace domains
  const email = (sessionClaims?.email as string) ?? ""
  const domain = email.split("@")[1] ?? ""
  if (!ALLOWED_DOMAINS.includes(domain)) {
    const deniedUrl = new URL("/login?error=domain", req.url)
    return NextResponse.redirect(deniedUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
