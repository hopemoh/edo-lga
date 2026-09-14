"use client"

import { useEffect } from "react"
import { initAuthFromStorage } from "@/lib/store"

export default function AuthInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAuthFromStorage()
  }, [])
  return <>{children}</>
}
