"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

const StaffDashboard = dynamic(() => import("@/components/staff/staff-dashboard"), { ssr: false })

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    const mustChangePassword = localStorage.getItem("mustChangePassword")
    if (!user) {
      router.push("/login")
    } else if (mustChangePassword === "true") {
      router.push("/change-password")
    } else {
      setIsAuthenticated(true)
    }
  }, [router])

  if (!isAuthenticated) {
    return null
  }

  return <StaffDashboard />
}
