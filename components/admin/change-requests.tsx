"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle, Clock, AlertCircle, Eye } from "lucide-react"
import { motion } from "framer-motion"
import AuditLogViewer from "./audit-log-viewer"
import { useChangeRequests, useApproveRequest, useRejectRequest, useCorrectRequest } from "@/hooks/use-change-requests"

interface ChangeRequest {
  id: string
  staff: { name: string }
  requestedBy: string
  reason: string
  status: string
  createdAt: string
  updatedAt: string
  changes: any
  oldValues?: any
  type?: 'DATA' | 'DOCUMENT'
  isAdminCorrectable?: boolean
  correctionWindowExpiresAt?: string
  adminApprovedBy?: string
  adminApprovedByName?: string
  secretaryApprovedBy?: string
  secretaryApprovedByName?: string
  chairmanApprovedBy?: string
  chairmanApprovedByName?: string
  rejectedBy?: string
  rejectedReason?: string
}

export default function ChangeRequests() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({})
  const [approvalComment, setApprovalComment] = useState<Record<string, string>>({})
  const [showAudit, setShowAudit] = useState<string | null>(null)

  const { data: requests = [], isLoading: loading } = useChangeRequests({ includeAudit: true } as any)
  const approveMutation = useApproveRequest()
  const rejectMutation = useRejectRequest()
  const correctMutation = useCorrectRequest()

  useEffect(() => {
    const user = localStorage.getItem("currentUser")
    if (user) {
      setCurrentUser(JSON.parse(user))
    }
  }, [])

  const approveRequest = (id: string) => {
    approveMutation.mutate(
      { id, comments: approvalComment[id] || undefined },
      {
        onSuccess: () => {
          setApprovalComment(prev => {
            const newComments = { ...prev }
            delete newComments[id]
            return newComments
          })
        },
        onError: (err: any) => {
          alert(`Error: ${err.message || "Couldn't save your changes. Please try again."}`)
        },
      }
    )
  }

  const rejectRequest = (id: string) => {
    const reason = rejectionReason[id]?.trim()
    if (!reason) {
      alert('Please provide a rejection reason')
      return
    }

    rejectMutation.mutate(
      { id, reason },
      {
        onSuccess: () => {
          setRejectionReason(prev => {
            const newReasons = { ...prev }
            delete newReasons[id]
            return newReasons
          })
        },
        onError: (err: any) => {
          alert(`Error: ${err.message || "Couldn't save your changes. Please try again."}`)
        },
      }
    )
  }

  const correctRequest = (id: string) => {
    const request = (requests as ChangeRequest[]).find(r => r.id === id)
    if (!request) return

    correctMutation.mutate(
      { id, changes: request.changes, reason: `Admin correction within 24-hour window` },
      {
        onError: (err: any) => {
          alert(`Error: ${err.message || "Couldn't save your changes. Please try again."}`)
        },
      }
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      'PENDING': { color: 'bg-yellow-500', icon: Clock, label: 'Awaiting Admin Approval' },
      'ADMIN_APPROVED': { color: 'bg-blue-500', icon: CheckCircle, label: 'Admin Approved' },
      'ADMIN_CORRECTED': { color: 'bg-blue-600', icon: CheckCircle, label: 'Admin Corrected' },
      'SECRETARY_APPROVED': { color: 'bg-purple-500', icon: CheckCircle, label: 'Secretary Approved' },
      'CHAIRMAN_APPROVED': { color: 'bg-green-500', icon: CheckCircle, label: 'Chairman Approved' },
      'COMPLETED': { color: 'bg-emerald-600', icon: CheckCircle, label: 'Completed' },
      'REJECTED': { color: 'bg-red-500', icon: XCircle, label: 'Rejected' }
    }

    const config = statusConfig[status] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const canApprove = (request: ChangeRequest): boolean => {
    if (!currentUser) return false

    const role = currentUser.role?.toUpperCase()
    const status = request.status?.toUpperCase()

    return (
      (role === 'ADMIN' && status === 'PENDING') ||
      (role === 'SECRETARY' && status === 'ADMIN_APPROVED') ||
      (role === 'CHAIRMAN' && status === 'SECRETARY_APPROVED')
    )
  }

  const canReject = (request: ChangeRequest): boolean => {
    if (!currentUser) return false

    const role = currentUser.role?.toUpperCase()
    const status = request.status?.toUpperCase()

    return (
      (role === 'SECRETARY' && status === 'ADMIN_APPROVED') ||
      (role === 'CHAIRMAN' && status === 'SECRETARY_APPROVED')
    )
  }

  const isWithinCorrectionWindow = (request: ChangeRequest): boolean => {
    if (!request.correctionWindowExpiresAt) return false
    const expiresAt = new Date(request.correctionWindowExpiresAt)
    return new Date() < expiresAt
  }

  const canCorrect = (request: ChangeRequest): boolean => {
    if (!currentUser || currentUser.role !== 'ADMIN') return false
    return request.status === 'PENDING' && isWithinCorrectionWindow(request)
  }

  const getTimeRemaining = (request: ChangeRequest): string | null => {
    if (!request.correctionWindowExpiresAt) return null
    const expiresAt = new Date(request.correctionWindowExpiresAt)
    const now = new Date()
    const diffMs = expiresAt.getTime() - now.getTime()

    if (diffMs <= 0) return 'Expired'

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m remaining`
  }

  if (loading) {
    return <div className="text-center py-8">Loading change requests...</div>
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Change Requests & Approval Flow</h3>

      {(requests as ChangeRequest[]).length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No change requests found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {(requests as ChangeRequest[]).map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{request.staff.name}</h4>
                      {request.status === 'REJECTED' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Requested by: {request.requestedBy}
                    </p>
                  </div>
                  <div className="flex gap-2 items-start">
                    {getStatusBadge(request.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAudit(showAudit === request.id ? null : request.id)}
                      title="View audit trail"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm mb-3">
                  <strong>Reason:</strong> {request.reason}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="text-muted-foreground">
                    <strong>Created:</strong> {new Date(request.createdAt).toLocaleString()}
                  </div>
                  <div className="text-muted-foreground">
                    <strong>Last Updated:</strong> {new Date(request.updatedAt).toLocaleString()}
                  </div>
                </div>

                {/* Rejection details */}
                {request.status === 'REJECTED' && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 mb-3 text-sm">
                    <strong className="text-red-700">Rejection Reason:</strong>
                    <p className="text-red-600 mt-1">{request.rejectedReason}</p>
                  </div>
                )}

                {/* Approval timeline */}
                {request.status !== 'PENDING' && request.status !== 'REJECTED' && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3 text-sm space-y-1">
                    {request.adminApprovedBy && (
                      <p className="text-blue-700">✓ Admin Approved by {request.adminApprovedByName || request.adminApprovedBy}</p>
                    )}
                    {request.secretaryApprovedBy && (
                      <p className="text-blue-700">✓ Secretary Approved by {request.secretaryApprovedByName || request.secretaryApprovedBy}</p>
                    )}
                    {request.chairmanApprovedBy && (
                      <p className="text-blue-700">✓ Chairman Approved by {request.chairmanApprovedByName || request.chairmanApprovedBy}</p>
                    )}
                  </div>
                )}

                {/* Correction window notice */}
                {canCorrect(request) && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-3 text-sm">
                    <p className="text-amber-800 font-semibold">Admin Correction Window</p>
                    <p className="text-amber-700">{getTimeRemaining(request)}</p>
                    <p className="text-amber-600 text-xs mt-1">
                      You can correct this document without going through the full approval chain.
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-3">
                  {canApprove(request) && (
                    <div>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder={`Add approval comment (optional)`}
                          value={approvalComment[request.id] || ''}
                          onChange={(e) => setApprovalComment(prev => ({
                            ...prev,
                            [request.id]: e.target.value
                          }))}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <Button
                          onClick={() => approveRequest(request.id)}
                          disabled={approveMutation.isPending}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {approveMutation.isPending ? 'Processing...' : `Approve as ${currentUser?.role}`}
                        </Button>
                      </div>
                    </div>
                  )}

                  {canReject(request) && (
                    <div>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Rejection reason (required)"
                          value={rejectionReason[request.id] || ''}
                          onChange={(e) => setRejectionReason(prev => ({
                            ...prev,
                            [request.id]: e.target.value
                          }))}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <Button
                          onClick={() => rejectRequest(request.id)}
                          disabled={rejectMutation.isPending}
                          size="sm"
                          variant="destructive"
                        >
                          {rejectMutation.isPending ? 'Processing...' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {canCorrect(request) && (
                    <Button
                      onClick={() => correctRequest(request.id)}
                      disabled={correctMutation.isPending}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 w-full"
                    >
                      {correctMutation.isPending ? 'Processing...' : 'Correct Document (Admin Only)'}
                    </Button>
                  )}
                </div>

                {/* Audit log viewer */}
                {showAudit === request.id && (
                  <div className="mt-4">
                    <AuditLogViewer changeRequestId={request.id} />
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
