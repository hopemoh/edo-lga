"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Loader2 } from "lucide-react"
import type { Staff } from "@/lib/types"
import { useUpdateStaff } from "@/hooks/use-staff"

interface RoleAssignmentModalProps {
    open: boolean
    onClose: () => void
    onSuccess: (updatedStaff: Staff) => void
    staff: Staff
}

export default function RoleAssignmentModal({ open, onClose, onSuccess, staff }: RoleAssignmentModalProps) {
    const updateMutation = useUpdateStaff()

    const onConfirm = () => {
        updateMutation.mutate(
            { id: staff.id, data: { role: "SECRETARY" } },
            {
                onSuccess: (updatedStaff: any) => {
                    onSuccess(updatedStaff)
                    onClose()
                },
            }
        )
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md antialiased">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        Assign Secretary Role
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Assigning Secretary role to:</p>
                        <p className="font-bold text-lg">{staff.name}</p>
                        <p className="text-sm text-primary font-medium">{staff.serialNumber}</p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm flex gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-amber-900">
                            <p className="font-semibold">Security Warning</p>
                            <p className="text-xs">
                                This will grant the staff member SECRETARY permissions immediately, including the ability to approve change requests at the Secretary level.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={updateMutation.isPending}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={onConfirm} className="flex-1" disabled={updateMutation.isPending}>
                            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {updateMutation.isPending ? "Assigning..." : "Assign Secretary"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
