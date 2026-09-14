"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldCheck, Loader2 } from "lucide-react"
import type { Staff } from "@/lib/types"
import { useUpdateStaff } from "@/hooks/use-staff"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { roleAssignmentSchema } from "@/lib/validations"
import type { z } from "zod"

type RoleAssignmentFormValues = z.infer<typeof roleAssignmentSchema>

interface RoleAssignmentModalProps {
    open: boolean
    onClose: () => void
    onSuccess: (updatedStaff: Staff) => void
    staff: Staff
}

type Role = "STAFF" | "ADMIN" | "SECRETARY" | "CHAIRMAN"

const ROLES: Role[] = ["STAFF", "ADMIN", "SECRETARY", "CHAIRMAN"]

export default function RoleAssignmentModal({ open, onClose, onSuccess, staff }: RoleAssignmentModalProps) {
    const updateMutation = useUpdateStaff()

    const { handleSubmit, formState: { errors }, setValue, watch } = useForm<RoleAssignmentFormValues>({
        resolver: zodResolver(roleAssignmentSchema),
        defaultValues: {
            role: (staff.role as Role) || "STAFF",
        },
    })

    const currentRole = watch("role")

    const onSubmit = (data: RoleAssignmentFormValues) => {
        updateMutation.mutate(
            { id: staff.id, data: { role: data.role } },
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
                        Assign System Role
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Assigning role for:</p>
                        <p className="font-bold text-lg">{staff.name}</p>
                        <p className="text-sm text-primary font-medium">{staff.serialNumber}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="role">Select System Role</Label>
                            <Select value={currentRole} onValueChange={(value: Role) => setValue("role", value)}>
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
                            {errors.role && (
                                <p className="text-sm text-destructive">{errors.role.message}</p>
                            )}
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
                    </div>

                    <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={updateMutation.isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={updateMutation.isPending}>
                            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {updateMutation.isPending ? "Updating..." : "Update Role"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
