import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Workbench } from "@/components/shell/workbench"

// Server Component — middleware already guards this route,
// but we double-check here for zero-flash protection.
export default async function Page() {
  const { userId } = await auth()
  if (!userId) redirect("/login")
  return <Workbench />
}
