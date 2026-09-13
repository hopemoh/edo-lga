"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface ApprovalLogEntry {
    id: string
    action: string
    performedBy: string
    performedByFullName: string
    performedByRole: string
    comments?: string
    details?: string
    timestamp: Date | string
}

interface ApprovalLogProps {
    logs: ApprovalLogEntry[]
    isLoading?: boolean
}

export default function ApprovalLog({ logs, isLoading }: ApprovalLogProps) {
    const getActionIcon = (action: string) => {
        if (action.includes("APPROVE")) {
            return <CheckCircle className="w-4 h-4 text-green-600" />
        }
        if (action.includes("REJECT")) {
            return <XCircle className="w-4 h-4 text-red-600" />
        }
        if (action.includes("CORRECT")) {
            return <AlertCircle className="w-4 h-4 text-amber-600" />
        }
        return <CheckCircle className="w-4 h-4 text-blue-600" />
    }

    const getActionBadgeColor = (action: string) => {
        if (action.includes("APPROVE")) return "bg-green-100 text-green-800"
        if (action.includes("REJECT")) return "bg-red-100 text-red-800"
        if (action.includes("CORRECT")) return "bg-amber-100 text-amber-800"
        return "bg-blue-100 text-blue-800"
    }

    const formatActionText = (action: string) => {
        return action
            .replace(/_/g, " ")
            .replace("ADMIN", "Admin")
            .replace("SECRETARY", "Secretary")
            .replace("CHAIRMAN", "Chairman")
    }

    const renderChangeDetails = (details: string) => {
        try {
            const parsed = JSON.parse(details)
            if (parsed.appliedChanges && parsed.oldValues) {
                return (
                    <div className="bg-green-50 p-3 rounded border-l-2 border-green-300 mt-2">
                        <p className="font-medium text-green-900 text-xs mb-2">Changes Applied:</p>
                        <div className="space-y-2">
                            {Object.entries(parsed.appliedChanges).map(([field, newValue]: [string, any]) => {
                                const oldValue = parsed.oldValues[field]
                                const fieldLabel = field.replace(/([A-Z])/g, ' $1').replace(/Id$/, '').replace(/^./, str => str.toUpperCase())
                                
                                return (
                                    <div key={field} className="text-xs bg-white p-2 rounded border">
                                        <div className="font-medium text-gray-700 mb-1">{fieldLabel}:</div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-red-600 line-through">{String(oldValue || 'N/A')}</span>
                                            <span className="text-gray-400">→</span>
                                            <span className="text-green-600 font-medium">{String(newValue || 'N/A')}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        {parsed.reason && (
                            <p className="text-xs text-green-700 mt-2 bg-white p-2 rounded">
                                <span className="font-medium">Reason:</span> {parsed.reason}
                            </p>
                        )}
                    </div>
                )
            } else if (parsed.appliedChanges) {
                return (
                    <div className="bg-green-50 p-3 rounded border-l-2 border-green-300 mt-2">
                        <p className="font-medium text-green-900 text-xs mb-2">Applied Changes:</p>
                        <div className="space-y-1">
                            {Object.entries(parsed.appliedChanges).map(([field, newValue]: [string, any]) => (
                                <div key={field} className="text-xs">
                                    <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1')}:</span>
                                    <span className="ml-2 text-green-800">{String(newValue)}</span>
                                </div>
                            ))}
                        </div>
                        {parsed.reason && (
                            <p className="text-xs text-green-700 mt-2">
                                <span className="font-medium">Reason:</span> {parsed.reason}
                            </p>
                        )}
                    </div>
                )
            }
            return null
        } catch {
            return null
        }
    }

    if (isLoading) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Loading approval logs...</p>
            </div>
        )
    }

    if (!logs || logs.length === 0) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">No approval logs yet</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {logs.map((log) => (
                <Card key={log.id} className="p-4 border-l-4 border-l-blue-500">
                    <div className="flex items-start gap-3">
                        <div className="mt-1">{getActionIcon(log.action)}</div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Badge className={getActionBadgeColor(log.action)}>
                                    {formatActionText(log.action)}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                    {new Date(log.timestamp).toLocaleString()}
                                </span>
                            </div>

                            <div className="mb-2">
                                <p className="text-sm font-medium text-gray-900">{log.performedByFullName}</p>
                                <p className="text-xs text-gray-600">{log.performedByRole}</p>
                            </div>

                            {log.comments && (
                                <div className="bg-blue-50 p-2 rounded text-xs text-blue-900 border-l-2 border-blue-300">
                                    <p className="font-medium mb-1">Comment:</p>
                                    <p>{log.comments}</p>
                                </div>
                            )}

                            {log.details && renderChangeDetails(log.details)}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}
