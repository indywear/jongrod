"use client"

import { useEffect } from "react"
import { useRouter } from "@/i18n/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/cars")
  }, [router])

  return null
}
