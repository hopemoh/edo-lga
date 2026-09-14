"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthStore, initAuthFromStorage } from "@/lib/store"
import { toast } from "sonner"
import { AlertTriangle, CheckCircle, Info, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"

interface ErrorLog {
  id: string
  timestamp: string
  level: "ERROR" | "WARNING" | "INFO"
  source: string
  message: string
  stack: string | null
  userId: string | null
  userRole: string | null
  requestMethod: string | null
  requestPath: string | null
  resolved: boolean
  resolvedBy: string | null
  resolvedAt: string | null
}

export default function ErrorLogsPage() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState<string>("")
  const [sourceFilter, setSourceFilter] = useState("")
  const [resolvedFilter, setResolvedFilter] = useState<string>("")
  const [page, setPage] = useState(0)
  const limit = 50

  useEffect(() => {
    initAuthFromStorage()
  }, [])

  useEffect(() => {
    if (!user) {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
      }
      return
    }
    if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role)) {
      return
    }
    fetchLogs()
  }, [user, levelFilter, sourceFilter, resolvedFilter, page, router])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const params = new URLSearchParams()
      if (levelFilter) params.set("level", levelFilter)
      if (sourceFilter) params.set("source", sourceFilter)
      if (resolvedFilter) params.set("resolved", resolvedFilter)
      params.set("limit", String(limit))
      params.set("offset", String(page * limit))

      const res = await fetch(`/api/error-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setLogs(data.data)
        setTotal(data.total)
      }
    } catch {
      toast.error("Couldn't load error logs. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const markResolved = async (id: string) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/error-logs/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        toast.success("Error log marked as resolved")
        fetchLogs()
      } else {
        toast.error("Couldn't save your changes. Please try again.")
      }
    } catch {
      toast.error("Couldn't save your changes. Please try again.")
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Only employees with ADMIN, SECRETARY, or CHAIRMAN user role can view error logs.</p>
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        </Card>
      </div>
    )
  }

  const totalPages = Math.ceil(total / limit)

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "ERROR":
        return <Badge className="bg-red-100 text-red-800 border-red-200">ERROR</Badge>
      case "WARNING":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">WARNING</Badge>
      case "INFO":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">INFO</Badge>
      default:
        return <Badge>{level}</Badge>
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "ERROR":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "WARNING":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case "INFO":
        return <Info className="w-4 h-4 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold">System Error Logs</h1>
            <p className="text-sm text-muted-foreground">{total} total entries &middot; Auto-cleanup after 7 days</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v === "all" ? "" : v); setPage(0) }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
              <SelectItem value="WARNING">WARNING</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Filter by source..."
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(0) }}
            className="w-60"
          />

          <Select value={resolvedFilter} onValueChange={(v) => { setResolvedFilter(v === "all" ? "" : v); setPage(0) }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="false">Unresolved</SelectItem>
              <SelectItem value="true">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => { setLevelFilter(""); setSourceFilter(""); setResolvedFilter(""); setPage(0) }}>
            Clear Filters
          </Button>
        </div>

        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Loading error logs...</p>
          </Card>
        ) : logs.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-medium">No error logs found</p>
            <p className="text-sm text-muted-foreground">System is running cleanly.</p>
          </Card>
        ) : (
          <>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border/50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Level</th>
                      <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                      <th className="px-4 py-3 text-left font-medium">Source</th>
                      <th className="px-4 py-3 text-left font-medium">Method</th>
                      <th className="px-4 py-3 text-left font-medium">Message</th>
                      <th className="px-4 py-3 text-left font-medium">User</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-border/30 hover:bg-secondary/5">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getLevelIcon(log.level)}
                            {getLevelBadge(log.level)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono">{log.source}</td>
                        <td className="px-4 py-3">
                          {log.requestMethod && (
                            <Badge variant="outline" className="text-xs">{log.requestMethod}</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate text-xs" title={log.message}>
                          {log.message}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {log.userRole || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {log.resolved ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Resolved
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 border-red-200">Unresolved</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {!log.resolved && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markResolved(log.id)}
                              className="text-green-600 hover:bg-green-50 text-xs"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Resolve
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages} &middot; {total} total
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
