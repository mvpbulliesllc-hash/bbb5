import { auth } from "@/lib/next-auth"
import { redirect } from "next/navigation"
import { Workbench } from "@/components/shell/workbench"

// Server Component — auth check happens on the server, zero flash.
export default async function Page() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  return <Workbench />
}
