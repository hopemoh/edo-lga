"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UserCheck, UserX, Loader2, ArrowRightLeft } from "lucide-react"
import { useDelegation, useCreateDelegation, useRevokeDelegation } from "@/hooks/use-delegations"
import type { Staff } from "@/lib/types"

interface DelegationModalProps {
  open: boolean
  onClose: () => void
  staff: Staff
}

export default function DelegationModal({ open, onClose, staff }: DelegationModalProps) {
  const { data: delegationData } = useDelegation()
  const createDelegation = useCreateDelegation()
  const revokeDelegation = useRevokeDelegation()

  const activeDelegation = delegationData?.delegation
  const isCurrentDelegate = activeDelegation?.delegateId === staff.id

  const handleDelegate = () => {
    createDelegation.mutate(staff.id, {
      onSuccess: () => onClose(),
    })
  }

  const handleRevoke = () => {
    revokeDelegation.mutate(undefined, {
      onSuccess: () => onClose(),
    })
  }

  const isLoading = createDelegation.isPending || revokeDelegation.isPending

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            {isCurrentDelegate ? "Revoke Delegation" : activeDelegation ? "Switch Delegate" : "Delegate Approval"}
          </DialogTitle>
          <DialogDescription>
            {isCurrentDelegate
              ? `Revoke ${staff.name}'s authority to approve on your behalf?`
              : activeDelegation
                ? `Replace ${activeDelegation.delegateName} with ${staff.name} as your delegate?`
                : `Delegate ${staff.name} to approve change requests on your behalf. Both you and the delegate will be logged in the audit trail.`
            }
          </DialogDescription>
        </DialogHeader>

        {!isCurrentDelegate && !activeDelegation && (
          <div className="py-3">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm font-medium text-primary mb-1">Delegate to</p>
              <p className="text-lg font-semibold">{staff.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Role: {staff.role} | They will inherit your approval permissions.
              </p>
            </div>
          </div>
        )}

        {activeDelegation && !isCurrentDelegate && (
          <div className="py-3 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Current</p>
                <p className="text-sm font-semibold">{activeDelegation.delegateName}</p>
              </div>
              <ArrowRightLeft className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1 bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">New</p>
                <p className="text-sm font-semibold">{staff.name}</p>
              </div>
            </div>
          </div>
        )}

        {isCurrentDelegate && (
          <div className="py-3">
            <div className="bg-muted/50 border border-border/50 rounded-lg p-4">
              <p className="text-sm">
                <span className="font-semibold">{staff.name}</span> is currently your delegate.
                They have CHAIRMAN-level approval permissions.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          {isCurrentDelegate ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevoke}
              disabled={isLoading}
            >
              {revokeDelegation.isPending ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <UserX className="w-3 h-3 mr-1" />
              )}
              Revoke
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleDelegate}
              disabled={isLoading}
            >
              {createDelegation.isPending ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <UserCheck className="w-3 h-3 mr-1" />
              )}
              {activeDelegation ? "Switch Delegate" : "Confirm Delegate"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
