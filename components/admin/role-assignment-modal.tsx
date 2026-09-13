"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldCheck, Loader2 } from "lucide-react"
import type { Staff } from "@/lib/types"

interface RoleAssignmentModalProps {
    open: boolean
    onClose: () => void
    onSuccess: (updatedStaff: Staff) => void
    staff: Staff
}

type Role = "STAFF" | "ADMIN" | "SECRETARY" | "CHAIRMAN"

const ROLES: Role[] = ["STAFF", "ADMIN", "SECRETARY", "CHAIRMAN"]

export default function RoleAssignmentModal({ open, onClose, onSuccess, staff }: RoleAssignmentModalProps) {
    const [role, setRole] = useState<Role>((staff.role as Role) || "STAFF")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async () => {
        setLoading(true)
        setError("")

        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/staff/${staff.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role })
            })

            if (response.ok) {
                const updatedStaff = await response.json()
                onSuccess(updatedStaff)
                onClose()
            } else {
                const data = await response.json()
                setError(data.error || "Couldn't save your changes. Please try again.")
            }
        } catch (err) {
            setError("You appear to be offline. Please check your connection.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md antialiased">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        Assign System Role
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Assigning role for:</p>
                        <p className="font-bold text-lg">{staff.name}</p>
                        <p className="text-sm text-primary font-medium">{staff.serialNumber}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">Select System Role</Label>
                            <Select value={role} onValueChange={(value: Role) => setRole(value)}>
                                <SelectTrigger id="role" className="w-full">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROLES.map((r) => (
                                        <SelectItem key={r} value={r}>
                                            {r.charAt(0) + r.slice(1).toLowerCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm flex gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-amber-900">
                                <p className="font-semibold">Security Warning</p>
                                <p className="text-xs">
                                    Changing a staff member's role will grant them the corresponding system permissions immediately.
                                </p>
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {loading ? "Updating..." : "Update Role"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
