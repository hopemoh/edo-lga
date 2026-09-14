"use client"

import { useState, useEffect } from "react"
import { useLGAs } from "@/hooks/use-lgas"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import type { LGA } from "@/lib/types"
import { MapPin, Search, Home, Users, ChevronRight, Building2, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

interface StaffSidebarProps {
  selectedLGA: LGA | null
  onSelect: (lga: LGA) => void
  isAdmin?: boolean
}

export default function StaffSidebar({ selectedLGA, onSelect, isAdmin = false }: StaffSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const lgasQuery = useLGAs()

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      setCurrentUser(JSON.parse(user))
    }
  }, [])

  const lgas = lgasQuery.data ?? []
  const loading = lgasQuery.isLoading

  const filteredLGAs = lgas.filter(
    (lga) =>
      lga.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lga.zone && lga.zone.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Group LGAs by zone, handle missing zones
  const groupedLGAs = filteredLGAs.reduce((acc, lga) => {
    const zone = lga.zone || 'Uncategorized'
    if (!acc[zone]) {
      acc[zone] = []
    }
    acc[zone].push(lga)
    return acc
  }, {} as Record<string, LGA[]>)

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("currentUser")
    window.location.href = "/"
  }

  return (
    <Sidebar>
      {/* Header with branding */}
      <SidebarHeader className="border-b border-sidebar-border pb-0">
        <div className="flex items-center gap-3 px-2 py-4">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base tracking-tight">
              Edo LGSC
            </h2>
            <p className="text-xs opacity-60">Staff Management</p>
          </div>
        </div>

        {/* User Info */}
        {currentUser && (
          <div className="px-2 py-3 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                {currentUser.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.name || "User"}</p>
                <p className="text-xs opacity-60 flex items-center gap-1">
                  {currentUser.role || "Staff"}
                  {currentUser.lgaId && lgas.length > 0 && (
                    <>
                      <span className="w-1 h-1 bg-white/30 rounded-full" />
                      <span className="truncate">{lgas.find(l => l.id === currentUser.lgaId)?.name}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      {/* Navigation */}
      <div className="px-3 py-2 border-b border-sidebar-border">
        <Link href="/">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent transition-colors">
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
        </Link>
      </div>

      {/* Search */}
      {isAdmin && (
        <div className="px-3 py-3 border-b border-sidebar-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <Input
              placeholder="Search LGA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 bg-sidebar-accent border-sidebar-border focus:border-sidebar-primary"
            />
          </div>
        </div>
      )}

      <SidebarContent className="px-2">
        {isAdmin && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider opacity-50 px-3 py-2">
                Local Government Areas
              </SidebarGroupLabel>
            </SidebarGroup>

            <SidebarMenu>
              <AnimatePresence mode="popLayout">
                {Object.entries(groupedLGAs).map(([zone, lgas], zoneIndex) => (
                  <motion.div
                    key={zone}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: zoneIndex * 0.05 }}
                  >
                    {/* Zone Label */}
                    <div className="px-3 py-2 mt-3 first:mt-0">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                        {zone} Zone
                      </span>
                    </div>

                    {/* LGA Items */}
                    {lgas.map((lga, index) => (
                      <motion.div
                        key={lga.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (zoneIndex * 0.05) + (index * 0.02) }}
                      >
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            onClick={() => onSelect(lga)}
                            isActive={selectedLGA?.id === lga.id}
                            size="lg"
                            className="rounded-xl"
                          >
                            <div className={`
                          w-8 h-8 rounded-lg flex items-center justify-center transition-all
                          ${selectedLGA?.id === lga.id
                                ? "bg-sidebar-primary-foreground/20"
                                : "bg-sidebar-accent"
                              }
                        `}>
                              <MapPin className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-sm block truncate">
                                {lga.name}
                              </span>
                            </div>

                            <ChevronRight className={`
                          w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity
                          ${selectedLGA?.id === lga.id ? "opacity-100" : ""}
                        `} />
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </motion.div>
                    ))}
                  </motion.div>
                ))}
              </AnimatePresence>
            </SidebarMenu>

            {filteredLGAs.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 opacity-20 mx-auto mb-3" />
                <p className="opacity-40 text-sm">No LGAs found</p>
              </div>
            )}
          </>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent transition-colors group"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>

        <div className="px-3 pt-3 mt-2 border-t border-sidebar-border">
          <p className="text-[10px] opacity-30 text-center">
            © 2024 Edo State LGSC
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
