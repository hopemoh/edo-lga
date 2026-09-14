"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { useChangeRequestAudit } from "@/hooks/use-change-requests"

interface AuditLog {
    id: string
    action: string
    performedByFullName: string
    performedByRole: string
    timestamp: Date | string
    details: any
}

interface Event {
    id: string
    action: string
    performedByFullName: string
    performedByRole: string
    timestamp: Date
    details?: any
}

interface AuditLogViewerProps {
    changeRequestId: string
}

const FIELD_LABELS: Record<string, string> = {
    name: "Name",
    phoneNumber: "Phone Number",
    sex: "Sex",
    dateOfBirth: "Date of Birth",
    dateOfFirstAppt: "First Appointment",
    dateOfConf: "Confirmation Date",
    dateOfPresentAppt: "Present Appointment",
    sgl: "SGL",
    recommendedRetirementDate: "Retirement Date",
    rank: "Rank",
    status: "Status",
    qualifications: "Qualifications",
    remark: "Remark",
    documentUrl: "Document",
}

export default function AuditLogViewer({ changeRequestId }: AuditLogViewerProps) {
    const { data: auditData, isLoading: loading, error: queryError } = useChangeRequestAudit(changeRequestId)
    const error = queryError ? "Couldn't load audit logs. Please try again." : null

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

    const parseDetails = (details: any): Record<string, any> => {
        if (!details) return {}
        if (typeof details === 'string') {
            try { return JSON.parse(details) } catch { return { raw: details } }
        }
        return details
    }

    const getFieldLabel = (key: string) => FIELD_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())

    const renderDetails = (details: any) => {
        const parsed = parseDetails(details)
        const selectedFields: string[] = parsed.selectedFields || []
        const changes: Record<string, any> = parsed.changes || {}
        const status = parsed.status
        const comments = parsed.comments
        const reason = parsed.reason
        const correctedFields = parsed.correctedFields

        const hasContent = selectedFields.length > 0 || Object.keys(changes).length > 0 || status || comments || reason || correctedFields
        if (!hasContent) return null

        return (
            <div className="mt-2 space-y-2">
                {status && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Status:</span>
                        <Badge className="bg-gray-100 text-gray-800 text-xs">{status.replace(/_/g, ' ')}</Badge>
                    </div>
                )}

                {selectedFields.length > 0 && (
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Fields being updated:</p>
                        <div className="flex flex-wrap gap-1">
                            {selectedFields.map((field: string) => (
                                <Badge key={field} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    {getFieldLabel(field)}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {Object.keys(changes).length > 0 && (
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Changes:</p>
                        <div className="bg-gray-50 rounded p-2 space-y-1">
                            {Object.entries(changes).map(([key, value]) => (
                                <div key={key} className="flex items-start gap-2 text-xs">
                                    <span className="font-medium text-gray-700 shrink-0">{getFieldLabel(key)}:</span>
                                    <span className="text-gray-600">
                                        {Array.isArray(value)
                                            ? value.map((v: any) => typeof v === 'object' ? v.name || JSON.stringify(v) : v).join(', ')
                                            : typeof value === 'object' && value !== null
                                                ? value.name || JSON.stringify(value)
                                                : String(value ?? '—')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {correctedFields && correctedFields.length > 0 && (
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Corrected fields:</p>
                        <div className="flex flex-wrap gap-1">
                            {correctedFields.map((field: string) => (
                                <Badge key={field} variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                    {getFieldLabel(field)}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {reason && (
                    <div className="bg-gray-50 p-2 rounded border-l-2 border-amber-400">
                        <p className="text-xs text-gray-700">
                            <strong>Reason:</strong> {reason}
                        </p>
                    </div>
                )}

                {comments && (
                    <div className="bg-gray-50 p-2 rounded border-l-2 border-blue-500">
                        <p className="text-xs text-gray-700">
                            <strong>Comments:</strong> {comments}
                        </p>
                    </div>
                )}
            </div>
        )
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

    const allEvents: Event[] = auditData.auditLogs.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp),
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold mb-4">Audit Trail & Approval History</h4>

            <div className="space-y-4">
                {allEvents.length === 0 ? (
                    <p className="text-sm text-gray-500">No events recorded yet</p>
                ) : (
                    <div className="relative">
                        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

                        <div className="space-y-4">
                            {allEvents.map((event) => (
                                <div key={event.id} className="relative pl-10">
                                    <div className="absolute left-0 top-1.5 w-6 h-6 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                                        {getActionIcon(event.action)}
                                    </div>

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

                                        {renderDetails(event.details)}
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
