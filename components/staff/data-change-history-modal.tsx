"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, User, AlertCircle, Loader, Eye, ArrowRight } from "lucide-react"
import type { Staff } from "@/lib/types"
import { useChangeRequests } from "@/hooks/use-change-requests"

interface ChangeRequest {
    id: string
    type: 'DATA' | 'DOCUMENT'
    status: string
    reason?: { name: string }
    changes: any
    submittedBy?: string // Or requestedBy
    createdAt: string
    supportingDocumentUrl?: string
}

interface DataChangeHistoryModalProps {
    open: boolean
    onClose: () => void
    staff: Staff
}

export default function DataChangeHistoryModal({ open, onClose, staff }: DataChangeHistoryModalProps) {
    const { data: requests = [], isLoading: loading, error: queryError } = useChangeRequests({ staffId: staff.id })
    const error = queryError ? "Couldn't load history. Please try again." : ""

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: "bg-yellow-100 text-yellow-800",
            ADMIN_APPROVED: "bg-blue-100 text-blue-800",
            SECRETARY_APPROVED: "bg-purple-100 text-purple-800",
            CHAIRMAN_APPROVED: "bg-green-100 text-green-800",
            REJECTED: "bg-red-100 text-red-800",
            COMPLETED: "bg-green-100 text-green-800"
        }
        return <Badge className={styles[status] || "bg-gray-100 text-gray-800"}>{status.replace(/_/g, " ")}</Badge>
    }

    const formatChanges = (changes: any) => {
        if (!changes || typeof changes !== 'object') return 'No details'
        return Object.entries(changes)
            .filter(([key]) => key !== 'documentUrl') // Skip internal document flags
            .map(([key, value]) => (
                <div key={key} className="text-xs grid grid-cols-[100px_1fr] gap-2">
                    <span className="font-semibold capitalize text-gray-600">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="text-gray-900 truncate">{String(value)}</span>
                </div>
            ))
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Data Change History - {staff.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader className="w-6 h-6 animate-spin text-primary" />
                            <span className="ml-2 text-muted-foreground">Loading history...</span>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No data change history available</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((req) => (
                                <Card key={req.id} className="p-4 border-l-4 border-l-primary/50 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-sm text-primary">
                                                    {req.reason?.name || "Change Request"}
                                                </span>
                                                {getStatusBadge(req.status)}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(req.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        {req.supportingDocumentUrl && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={async () => {
                                                    const token = localStorage.getItem('token');
                                                    try {
                                                        const res = await fetch(`/api/signed-url?url=${encodeURIComponent(req.supportingDocumentUrl)}`);
                                                        const data = await res.json();
                                                        window.open(data.signedUrl || req.supportingDocumentUrl, "_blank", "noopener,noreferrer");
                                                    } catch {
                                                        window.open(req.supportingDocumentUrl, "_blank", "noopener,noreferrer");
                                                    }
                                                }}
                                                className="h-8 gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                            >
                                                <FileText className="w-3 h-3" />
                                                View Proof
                                            </Button>
                                        )}
                                    </div>

                                    <div className="bg-muted/30 rounded p-3 text-sm">
                                        <p className="text-xs text-muted-foreground mb-2 font-medium">Changes Requested:</p>
                                        <div className="space-y-1">
                                            {formatChanges(req.changes)}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button onClick={onClose} variant="outline">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
