"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Calendar, User, AlertCircle, Loader } from "lucide-react"
import type { Staff } from "@/lib/types"

interface DocumentHistory {
    id: string
    staffId: string
    documentUrl: string
    uploadedAt: Date | string
    uploadedBy: string
    reason?: string
}

interface DocumentHistoryModalProps {
    open: boolean
    onClose: () => void
    staff: Staff
}

export default function DocumentHistoryModal({ open, onClose, staff }: DocumentHistoryModalProps) {
    const [history, setHistory] = useState<DocumentHistory[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [viewingDoc, setViewingDoc] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            fetchDocumentHistory()
        }
    }, [open, staff.id])

    const fetchDocumentHistory = async () => {
        try {
            setLoading(true)
            setError("")
            const token = localStorage.getItem("token")
            const response = await fetch(`/api/staff/${staff.id}/document-history`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setHistory(data)
            } else {
                setError("Couldn't load document history. Please try again.")
            }
        } catch (err) {
            setError("Couldn't load document history. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const viewDocument = async (documentUrl: string) => {
        setViewingDoc(documentUrl)
        const token = localStorage.getItem("token")
        try {
            const response = await fetch(`/api/staff/${staff.id}/document/view?file=${encodeURIComponent(documentUrl)}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                window.open(data.url, "_blank", "noopener,noreferrer")
            }
        } catch (err) {
        } finally {
            setViewingDoc(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Document History - {staff.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader className="w-6 h-6 animate-spin text-primary" />
                            <span className="ml-2 text-muted-foreground">Loading documents...</span>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No document history available</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((doc, index) => (
                                <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                                <span className="font-medium text-sm truncate">
                                                    Document #{index + 1}
                                                </span>
                                            </div>

                                            <div className="space-y-2 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>
                                                        {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    <span>{doc.uploadedBy || "N/A"}</span>
                                                </div>

                                                {doc.reason && (
                                                    <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-500">
                                                        <p className="text-xs font-medium text-blue-900">Reason:</p>
                                                        <p className="text-xs text-blue-800">{doc.reason}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => viewDocument(doc.documentUrl)}
                                            variant="outline"
                                            size="sm"
                                            className="shrink-0"
                                            disabled={viewingDoc === doc.documentUrl}
                                        >
                                            {viewingDoc === doc.documentUrl ? (
                                                <Loader className="w-4 h-4 animate-spin" />
                                            ) : (
                                                "View"
                                            )}
                                        </Button>
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
