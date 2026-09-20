"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Loader2, KeyRound } from "lucide-react"
import type { Staff } from "@/lib/types"
import { toast } from "sonner"

interface CreateChairmanModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface ChairmanForm {
  name: string
  phoneNumber: string
  dateOfBirth: string
  dateOfFirstAppt: string
  sex: string
}

export default function CreateChairmanModal({ open, onClose, onSuccess }: CreateChairmanModalProps) {
  const [loading, setLoading] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [currentHolder, setCurrentHolder] = useState<Staff | null>(null)
  const [loadingHolder, setLoadingHolder] = useState(false)
  const [form, setForm] = useState<ChairmanForm>({
    name: "",
    phoneNumber: "",
    dateOfBirth: "",
    dateOfFirstAppt: "",
    sex: "Male",
  })

  useEffect(() => {
    if (open) {
      setForm({ name: "", phoneNumber: "", dateOfBirth: "", dateOfFirstAppt: "", sex: "Male" })
      setCurrentHolder(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    setLoadingHolder(true)
    const token = localStorage.getItem("token")
    fetch("/api/offices?name=CHAIRMAN", {
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

  const handleResetPassword = async () => {
    if (!currentHolder) return
    setResettingPassword(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/staff/${currentHolder.id}/reset-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to reset password")
        return
      }
      toast.success(`${currentHolder.name}'s password has been reset. They will use phone + DOB to login.`)
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setResettingPassword(false)
    }
  }

  const onSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!form.phoneNumber.trim()) {
      toast.error("Phone number is required for login")
      return
    }
    if (!form.dateOfBirth) {
      toast.error("Date of birth is required for first login")
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/offices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          officeName: "CHAIRMAN",
          name: form.name.trim(),
          phoneNumber: form.phoneNumber.trim(),
          dateOfBirth: form.dateOfBirth,
          dateOfFirstAppt: form.dateOfFirstAppt || undefined,
          sex: form.sex,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to create chairman office")
        return
      }

      const result = await res.json()
      toast.success("Chairman office created successfully")
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
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto antialiased">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Create Chairman Office
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {loadingHolder && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking current holder...
            </div>
          )}

          {currentHolder && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <p className="font-semibold text-amber-800">Current Chairman</p>
              <p className="text-amber-700">
                {currentHolder.name}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Creating a new chairman will replace the current holder.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetPassword}
                disabled={resettingPassword}
                className="mt-3 bg-white hover:bg-gray-50 text-amber-700 border-amber-300 text-xs"
              >
                {resettingPassword ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <KeyRound className="w-3 h-3 mr-1" />
                )}
                {resettingPassword ? "Resetting..." : "Reset Chairman Password"}
              </Button>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm flex gap-2">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-blue-900">
              <p className="font-semibold">External Record</p>
              <p className="text-xs">
                A minimal staff record will be created for login purposes. The Chairman does not belong to any LGA.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter full name"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number * (for login)</Label>
              <input
                id="phoneNumber"
                type="tel"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="e.g. 08012345678"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth * (for first login)</Label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfFirstAppt">Date of First Appointment</Label>
                <input
                  id="dateOfFirstAppt"
                  type="date"
                  value={form.dateOfFirstAppt}
                  onChange={(e) => setForm({ ...form, dateOfFirstAppt: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sex">Sex</Label>
                <Select
                  value={form.sex}
                  onValueChange={(value) => setForm({ ...form, sex: value })}
                >
                  <SelectTrigger id="sex" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button type="button" onClick={onSubmit} className="flex-1" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? "Creating..." : "Create Chairman"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
