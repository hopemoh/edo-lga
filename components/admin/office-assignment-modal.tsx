"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserCheck, Loader2 } from "lucide-react"
import type { Staff } from "@/lib/types"
import { toast } from "sonner"

interface OfficeAssignmentModalProps {
  open: boolean
  onClose: () => void
  staff?: Staff
  onSuccess?: () => void
}

export default function OfficeAssignmentModal({ open, onClose, staff, onSuccess }: OfficeAssignmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [currentHolder, setCurrentHolder] = useState<Staff | null>(null)
  const [loadingHolder, setLoadingHolder] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState(staff?.id || "")

  useEffect(() => {
    if (open) {
      setSelectedStaffId(staff?.id || "")
      setCurrentHolder(null)
    }
  }, [open, staff])

  useEffect(() => {
    if (!open) return

    setLoadingHolder(true)
    const token = localStorage.getItem("token")
    fetch("/api/offices?name=SECRETARY", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0 && data[0].staff) {
          setCurrentHolder(data[0].staff)
        } else {
          setCurrentHolder(null)
        }
      })
      .catch(() => setCurrentHolder(null))
      .finally(() => setLoadingHolder(false))
  }, [open])

  useEffect(() => {
    if (!open || staff) return

    setLoadingStaff(true)
    const token = localStorage.getItem("token")
    fetch("/api/staff", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setStaffList(Array.isArray(data) ? data.filter((s: Staff) => !s.isExternal) : [])
      })
      .catch(() => setStaffList([]))
      .finally(() => setLoadingStaff(false))
  }, [open, staff])

  const onSubmit = async () => {
    if (!selectedStaffId && !staff) {
      toast.error("Please select a staff member")
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const body = {
        officeName: "SECRETARY",
        staffId: staff?.id || selectedStaffId,
      }

      const res = await fetch("/api/offices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to assign office")
        return
      }

      toast.success("Secretary office assigned successfully")
      onSuccess?.()
      onClose()
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md antialiased">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Assign Secretary Office
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {staff && (
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Assigning office to:</p>
              <p className="font-bold text-lg">{staff.name}</p>
              <p className="text-sm text-primary font-medium">{staff.serialNumber}</p>
            </div>
          )}

          <div className="space-y-4">
            {currentHolder && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-amber-800">Current Holder</p>
                <p className="text-amber-700">
                  {currentHolder.name} ({currentHolder.serialNumber})
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  This will be replaced with the new assignment.
                </p>
              </div>
            )}

            {!staff && (
              <div className="space-y-2">
                <Label htmlFor="staffId">Select Staff Member</Label>
                {loadingStaff ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading staff...
                  </div>
                ) : (
                  <Select
                    value={selectedStaffId}
                    onValueChange={setSelectedStaffId}
                  >
                    <SelectTrigger id="staffId" className="w-full">
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.serialNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm flex gap-2">
              <UserCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-blue-900">
                <p className="font-semibold">Secretary Office</p>
                <p className="text-xs">
                  The Secretary must be an existing staff member in the system.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button type="button" onClick={onSubmit} className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Assigning..." : "Assign Office"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
