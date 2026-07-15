import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { HomeShell } from "@/components/shell/home-shell"

// Server Component — auth check on the server, zero flash.
export default async function Page() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  return <HomeShell />
}
