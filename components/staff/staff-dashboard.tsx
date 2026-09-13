"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import StaffSidebar from "./staff-sidebar"
import StaffTable from "./staff-table"
import ActivityLog from "./activity-log"
import ApprovalLogsList from "./approval-logs-list"
import DisciplineList from "./discipline-list"
import FileUploadModal from "./file-upload-modal"
import StaffFormModal from "../admin/staff-form-modal"
import StatusRankFormModal from "../admin/status-rank-form-modal"
import LGAFormModal from "../admin/lga-form-modal"
import ChangeRequests from "../admin/change-requests"
import ContentFormModal from "../admin/content-form-modal"
import HighlightsFormModal from "../admin/highlights-form-modal"
import DisciplineFormModal from "../admin/discipline-form-modal"
import SystemSettingsModal from "../admin/system-settings-modal"
import type { LogEntry, Staff, LGA } from "@/lib/types"
import { LogOut, Upload, Plus, Settings, Edit, Users, MapPin, Activity, Bell, Star, ShieldAlert, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { generateDummyStaff } from "@/lib/dummy-data"

export default function StaffDashboard() {
  const router = useRouter()
  const [selectedLGA, setSelectedLGA] = useState<LGA | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [staff, setStaff] = useState<Staff[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [changeRequestCount, setChangeRequestCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [view, setView] = useState<"staff" | "logs" | "requests" | "approvals" | "discipline">("staff")
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [showStaffForm, setShowStaffForm] = useState(false)
  const [showStatusForm, setShowStatusForm] = useState(false)
  const [showLGAForm, setShowLGAForm] = useState(false)
  const [showContentForm, setShowContentForm] = useState(false)
  const [showHighlightsForm, setShowHighlightsForm] = useState(false)
  const [showDisciplineForm, setShowDisciplineForm] = useState(false)
  const [showSystemSettings, setShowSystemSettings] = useState(false)
  const [loading, setLoading] = useState(false)
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [currentUser, setCurrentUser] = useState<any>(null)
  const isAdmin = useMemo(() => {
    if (!currentUser) return false
    const role = currentUser.role?.toUpperCase()
    const adminRoles = ['ADMIN', 'SECRETARY', 'CHAIRMAN']
    const isUserAdmin = adminRoles.includes(role)
    return isUserAdmin
  }, [currentUser])

  useEffect(() => {
    const userStr = typeof window !== "undefined" ? localStorage.getItem("currentUser") : null
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
      } catch (e) {
      }
    }
  }, [])

  useEffect(() => {
    fetchStaff()
    if (isAdmin) {
      fetchLogs()
      fetchChangeRequestCount()
    }
  }, [selectedLGA, isAdmin])

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      let url = '/api/staff'

      // For non-admin users, filter by their LGA
      if (!isAdmin && currentUser?.lgaId) {
        url = `/api/staff?lgaId=${currentUser.lgaId}`
      } else if (selectedLGA) {
        url = `/api/staff?lgaId=${selectedLGA.id}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.length === 0) {
          // Fallback to dummy data if no staff in DB
          const dummyData = generateDummyStaff(selectedLGA?.id || currentUser?.lgaId || "all")
          setStaff(dummyData)
        } else {
          setStaff(data)
        }
      } else {
        // Fallback to dummy data on error
        setStaff(generateDummyStaff(selectedLGA?.id || currentUser?.lgaId || "all"))
      }
    } catch (error) {
      setStaff(generateDummyStaff(selectedLGA?.id || currentUser?.lgaId || "all"))
    } finally {
      setLoading(false)
    }
  }


  const fetchChangeRequestCount = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/change-requests', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Count all requests that chairman hasn't approved yet
        // This includes: PENDING, ADMIN_APPROVED, and SECRETARY_APPROVED
        const pendingCount = data.filter((req: any) =>
          req.status === 'PENDING' ||
          req.status === 'ADMIN_APPROVED' ||
          req.status === 'SECRETARY_APPROVED'
        ).length
        setChangeRequestCount(pendingCount)
      }
    } catch (error) {
    }
  }


  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/logs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.length === 0) {
          setLogs([
            { id: '1', timestamp: new Date(), action: 'UPDATE', details: 'System initialized', userFullName: 'System Admin', userRank: 'Admin', userRole: 'SECRETARY' } as any
          ])
        } else {
          setLogs(data)
        }
      }
    } catch (error) {
    }
  }

  const handleLGASelect = (lga: LGA) => {
    setSelectedLGA(lga)
    setCurrentPage(1)
    setSearchTerm("")
  }

  const handleImport = async (importedStaff: Staff[]) => {
    fetchStaff() // Refresh the staff list
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  const filteredStaff = useMemo(() => {
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof s.status === 'string' ? s.status : (s.status as any).name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.rank?.name || '').toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [staff, searchTerm])

  const itemsPerPage = 35
  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedStaff = filteredStaff.slice(startIndex, startIndex + itemsPerPage)

  const handleUpdateStaff = (updatedStaff: Staff) => {
    setStaff((prev) => prev.map((s) => (s.id === updatedStaff.id ? updatedStaff : s)))
  }

  const handleOpenAddStaffModal = () => {
    setIsEditing(false)
    setStaffToEdit(null)
    setShowStaffForm(true)
  }

  const handleOpenEditStaffModal = (staff: Staff) => {
    setIsEditing(true)
    setStaffToEdit(staff)
    setShowStaffForm(true)
  }

  const handleCloseStaffModal = () => {
    setShowStaffForm(false)
    setStaffToEdit(null)
    setIsEditing(false)
  }

  const handleStaffFormSuccess = () => {
    handleCloseStaffModal()
    fetchStaff()
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-linear-to-br from-gray-50 via-white to-emerald-50/30">
        <StaffSidebar selectedLGA={selectedLGA} onSelect={handleLGASelect} isAdmin={isAdmin} />

        <SidebarInset className="flex flex-col">
          {/* Header */}
          <div className="border-b border-border/50 bg-white/80 backdrop-blur-md sticky top-0 z-40">
            <div className="px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="hover:bg-primary/10 hover:text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Staff Manager
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {selectedLGA ? `Managing ${selectedLGA.name}` : 'Select an LGA to begin'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  {currentUser?.role || 'Staff'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto px-4 md:px-6 lg:px-8 py-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="h-full">
                <Card className="p-6 border-0 bg-linear-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/20 h-full">
                  <div className="flex items-center justify-between h-full">
                    <div>
                      <p className="text-4xl font-bold">{staff.length}</p>
                      <p className="text-sm text-white/80">Total Staff</p>
                    </div>
                    <Users className="w-10 h-10 text-white/30" />
                  </div>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="h-full">
                <Card className="p-6 border-0 bg-linear-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20 h-full">
                  <div className="flex items-center justify-between h-full">
                    <div>
                      <p className="text-2xl font-bold truncate max-w-[150px]">{selectedLGA?.name || "None"}</p>
                      <p className="text-sm text-white/80">Selected LGA</p>
                    </div>
                    <MapPin className="w-10 h-10 text-white/30" />
                  </div>
                </Card>
              </motion.div>
              {isAdmin && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="h-full">
                  <Card className="p-6 border-0 bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 h-full">
                    <div className="flex items-center justify-between h-full">
                      <div>
                        <p className="text-4xl font-bold">{logs.length}</p>
                        <p className="text-sm text-white/80">Total Activities</p>
                      </div>
                      <Activity className="w-10 h-10 text-white/30" />
                    </div>
                  </Card>
                </motion.div>
              )}
              {isAdmin && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="h-full">
                  <Card className="p-6 border-0 bg-linear-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 h-full">
                    <div className="flex items-center justify-between h-full">
                      <div>
                        <p className="text-4xl font-bold">{changeRequestCount}</p>
                        <p className="text-sm text-white/80">Pending Requests</p>
                      </div>
                      <Bell className="w-10 h-10 text-white/30" />
                    </div>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Main Content */}
            <div className="space-y-6 mb-8">
              {/* Action Buttons */}
              {isAdmin && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleOpenAddStaffModal}
                    className="bg-linear-to-r from-primary to-accent"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowFileUpload(true)}
                    disabled={!selectedLGA}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Import
                  </Button>
                  {selectedLGA && (
                    <Button
                      variant="outline"
                      onClick={() => setShowLGAForm(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Update LGA
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowStatusForm(true)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Status, Ranks & Qualifications
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowContentForm(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Manage Content
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowHighlightsForm(true)}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Highlights & Execs
                  </Button>
                  {currentUser?.role?.toUpperCase() === 'CHAIRMAN' && (
                    <Button
                      variant="outline"
                      onClick={() => setShowSystemSettings(true)}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      System Settings
                    </Button>
                  )}
                </div>
              )}

              {/* View Tabs */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={view === "staff" ? "default" : "outline"}
                  onClick={() => setView("staff")}
                  className={view === "staff" ? "bg-linear-to-r from-primary to-accent" : ""}
                >
                  Staff Management
                </Button>
                <Button
                  variant={view === "logs" ? "default" : "outline"}
                  onClick={() => setView("logs")}
                  className={view === "logs" ? "bg-linear-to-r from-primary to-accent" : ""}
                >
                  Activity Logs
                </Button>
                {isAdmin && (
                  <Button
                    variant={view === "requests" ? "default" : "outline"}
                    onClick={() => setView("requests")}
                    className={`${view === "requests" ? "bg-linear-to-r from-primary to-accent" : ""} relative`}
                  >
                    Change Requests
                    {changeRequestCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {changeRequestCount}
                      </span>
                    )}
                  </Button>
                )}
                <Button
                  variant={view === "discipline" ? "default" : "outline"}
                  onClick={() => setView("discipline")}
                  className={view === "discipline" ? "bg-linear-to-r from-primary to-accent" : ""}
                >
                  Disciplinary Cases
                </Button>
                {isAdmin && (
                  <Button
                    variant={view === "approvals" ? "default" : "outline"}
                    onClick={() => setView("approvals")}
                    className={view === "approvals" ? "bg-linear-to-r from-primary to-accent" : ""}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approval Logs
                  </Button>
                )}
              </div>
            </div>

            {/* Content based on view */}
            {view === "staff" ? (
              <motion.div key="staff" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Search Bar */}
                <Input
                  placeholder="Search by name, phone, status, or rank..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="border-primary/30 focus:border-primary mb-6"
                />

                {/* Staff Table */}
                <StaffTable
                  staff={paginatedStaff}
                  onUpdate={handleUpdateStaff}
                  onEdit={handleOpenEditStaffModal}
                  isAdmin={isAdmin}
                  currentUser={currentUser}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStaff.length)} of{" "}
                      {filteredStaff.length}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-2">
                        {totalPages > 1 && Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page ? "bg-linear-to-r from-primary to-accent" : ""}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : view === "logs" ? (
              <motion.div key="logs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ActivityLog logs={logs} />
              </motion.div>
            ) : view === "requests" ? (
              <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ChangeRequests />
              </motion.div>
            ) : view === "discipline" ? (
              <motion.div key="discipline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DisciplineList isAdmin={isAdmin} />
              </motion.div>
            ) : (
              <motion.div key="approvals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ApprovalLogsList isAdmin={isAdmin} />
              </motion.div>
            )}
          </div>
        </SidebarInset>
      </div>

      {selectedLGA && (
        <FileUploadModal
          open={showFileUpload}
          onClose={() => setShowFileUpload(false)}
          onImport={handleImport}
          lgaId={selectedLGA.id}
        />
      )
      }

      <StaffFormModal
        open={showStaffForm}
        onClose={handleCloseStaffModal}
        onSuccess={handleStaffFormSuccess}
        lgaId={selectedLGA?.id}
        isEditing={isEditing}
        staffToEdit={staffToEdit}
        currentUserRole={currentUser?.role}
      />

      <LGAFormModal
        open={showLGAForm}
        onClose={() => setShowLGAForm(false)}
        onSuccess={() => {
          // Refresh LGA list if needed
        }}
        lgaId={selectedLGA?.id}
      />

      <StatusRankFormModal
        open={showStatusForm}
        onClose={() => setShowStatusForm(false)}
        onSuccess={() => { }}
      />

      <ContentFormModal
        open={showContentForm}
        onClose={() => setShowContentForm(false)}
        onSuccess={() => { }}
      />

      <HighlightsFormModal
        open={showHighlightsForm}
        onClose={() => setShowHighlightsForm(false)}
      />

      <SystemSettingsModal
        open={showSystemSettings}
        onClose={() => setShowSystemSettings(false)}
      />


    </SidebarProvider >
  )
}
