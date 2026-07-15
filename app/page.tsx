"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Workbench } from "@/components/shell/workbench"

export default function Page() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user === null) {
      router.replace("/login")
    }
  }, [user, router])

  if (!user) {
    // render nothing while redirecting — avoids a flash of the workbench
    return <div className="min-h-screen bg-background" />
  }

  return <Workbench />
}
