"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface ApprovalLog {
    id: string
    action: string
    performedBy: string
    performedByFullName: string
    performedByRole: string
    comments?: string
    timestamp: Date | string
}

interface AuditLog {
    id: string
    action: string
    performedByFullName: string
    performedByRole: string
    timestamp: Date | string
    details: any
    comments?: string
}

interface Event {
    type: 'approval' | 'audit'
    id: string
    action: string
    performedBy?: string
    performedByFullName: string
    performedByRole: string
    comments?: string
    timestamp: Date
    details?: any
}

interface AuditLogViewerProps {
    changeRequestId: string
}

export default function AuditLogViewer({ changeRequestId }: AuditLogViewerProps) {
    const [auditData, setAuditData] = useState<{
        approvalLogs: ApprovalLog[]
        auditLogs: AuditLog[]
    } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchAuditLogs()
    }, [changeRequestId])

    const fetchAuditLogs = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/change-requests/${changeRequestId}/audit`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (response.ok) {
                const data = await response.json()
                setAuditData(data)
            } else {
                setError("Couldn't load audit logs. Please try again.")
            }
        } catch (err) {
            setError("Couldn't load audit logs. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const getActionIcon = (action: string) => {
        if (action.includes('APPROVE') || action.includes('CREATED')) {
            return <CheckCircle className="w-4 h-4 text-green-500" />
        }
        if (action.includes('REJECT') || action.includes('REJECTED')) {
            return <XCircle className="w-4 h-4 text-red-500" />
        }
        if (action.includes('CORRECT')) {
            return <AlertCircle className="w-4 h-4 text-amber-500" />
        }
        return <CheckCircle className="w-4 h-4 text-blue-500" />
    }

    const getActionBadgeColor = (action: string) => {
        if (action === 'CREATED') return 'bg-blue-100 text-blue-800'
        if (action.includes('APPROVE')) return 'bg-green-100 text-green-800'
        if (action.includes('REJECT')) return 'bg-red-100 text-red-800'
        if (action.includes('CORRECT')) return 'bg-amber-100 text-amber-800'
        if (action === 'COMPLETED') return 'bg-emerald-100 text-emerald-800'
        return 'bg-gray-100 text-gray-800'
    }

    if (loading) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <p className="text-sm text-gray-600">Loading audit trail...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-sm text-red-600">{error}</p>
            </div>
        )
    }

    if (!auditData) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <p className="text-sm text-gray-600">No audit data available</p>
            </div>
        )
    }

    const allEvents: Event[] = [
        ...auditData.auditLogs.map(log => ({
            ...log,
            type: 'audit' as const,
            performedBy: log.performedByFullName,
            timestamp: new Date(log.timestamp),
            action: log.action,
            performedByFullName: log.performedByFullName,
            performedByRole: log.performedByRole,
        })),
        ...auditData.approvalLogs.map(log => ({
            ...log,
            type: 'approval' as const,
            timestamp: new Date(log.timestamp),
            performedByFullName: log.performedByFullName,
            performedByRole: log.performedByRole,
        }))
    ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold mb-4">Audit Trail & Approval History</h4>

            <div className="space-y-4">
                {allEvents.length === 0 ? (
                    <p className="text-sm text-gray-500">No events recorded yet</p>
                ) : (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

                        {/* Timeline items */}
                        <div className="space-y-4">
                            {allEvents.map((event, index) => (
                                <div key={`${event.type}-${event.id}`} className="relative pl-10">
                                    {/* Timeline dot */}
                                    <div className="absolute left-0 top-1.5 w-6 h-6 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                                        {getActionIcon(event.action)}
                                    </div>

                                    {/* Event card */}
                                    <Card className="p-3 text-sm">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Badge className={getActionBadgeColor(event.action)}>
                                                    {event.action.replace(/_/g, ' ')}
                                                </Badge>
                                                <span className="text-xs text-gray-500">
                                                    {event.timestamp.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-xs mb-2">
                                            <p className="font-semibold text-gray-900">
                                                {event.performedByFullName || 'Unknown'}
                                            </p>
                                            <p className="text-gray-600">
                                                Role: {event.performedByRole}
                                            </p>
                                        </div>

                                        {event.comments && typeof event.comments === 'string' && (
                                            <div className="bg-gray-50 p-2 rounded mt-2 border-l-2 border-blue-500">
                                                <p className="text-xs text-gray-700">
                                                    <strong>Comments:</strong> {event.comments.trim()}
                                                </p>
                                            </div>
                                        )}

                                        {event.type === 'audit' && event.details && (
                                            <details className="mt-2">
                                                <summary className="text-xs font-semibold text-blue-600 cursor-pointer hover:text-blue-700">
                                                    View Details
                                                </summary>
                                                <div className="bg-gray-50 p-2 rounded mt-2 text-xs">
                                                    {typeof event.details === 'string' ? (
                                                        <pre className="whitespace-pre-wrap wrap-break-words text-gray-700">
                                                            {(event.details as string).trim()}
                                                        </pre>
                                                    ) : (
                                                        <pre className="whitespace-pre-wrap wrap-break-words text-gray-700">
                                                            {JSON.stringify(event.details, null, 2)}
                                                        </pre>
                                                    )}
                                                </div>
                                            </details>
                                        )}
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
