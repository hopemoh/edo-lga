"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Clock, User, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface ApprovalLog {
    id: string
    changeRequestId: string
    action: string
    performedBy: string
    performedByFullName: string
    performedByRole: string
    comments: string | null
    timestamp: string
    changeRequest: {
        id: string
        staffId: string
        status: string
        type: string
        staff: {
            name: string
        }
    }
}

interface ApprovalLogsListProps {
    isAdmin?: boolean
}

export default function ApprovalLogsList({ isAdmin = false }: ApprovalLogsListProps) {
    const [logs, setLogs] = useState<ApprovalLog[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [total, setTotal] = useState(0)
    const [limit] = useState(50)
    const [offset, setOffset] = useState(0)

    useEffect(() => {
        if (isAdmin) {
            fetchApprovalLogs()
        }
    }, [isAdmin, offset])

    const fetchApprovalLogs = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/approval-logs?limit=${limit}&offset=${offset}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setLogs(data.data)
                setTotal(data.total)
            } else {
                setError("Couldn't load approval logs. Please try again.")
            }
        } catch (err) {
            setError("You appear to be offline. Please check your connection.")
        } finally {
            setLoading(false)
        }
    }

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'ADMIN_APPROVE':
            case 'SECRETARY_APPROVE':
            case 'CHAIRMAN_APPROVE':
                return <CheckCircle className="w-4 h-4 text-green-600" />
            case 'ADMIN_CORRECT':
                return <AlertCircle className="w-4 h-4 text-amber-600" />
            case 'SECRETARY_REJECT':
            case 'CHAIRMAN_REJECT':
                return <XCircle className="w-4 h-4 text-red-600" />
            default:
                return <Clock className="w-4 h-4 text-blue-600" />
        }
    }

    const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (action) {
            case 'ADMIN_APPROVE':
            case 'SECRETARY_APPROVE':
            case 'CHAIRMAN_APPROVE':
                return 'default'
            case 'ADMIN_CORRECT':
                return 'secondary'
            case 'SECRETARY_REJECT':
            case 'CHAIRMAN_REJECT':
                return 'destructive'
            default:
                return 'outline'
        }
    }

    const formatAction = (action: string) => {
        return action
            .split('_')
            .map(word => word.charAt(0) + word.slice(1).toLowerCase())
            .join(' ')
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    if (!isAdmin) {
        return null
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Approval Logs</h2>
                <span className="text-sm text-muted-foreground">Total: {total}</span>
            </div>

            {error && (
                <Card className="p-4 bg-destructive/10 border-destructive/50">
                    <p className="text-sm text-destructive">{error}</p>
                </Card>
            )}

            {loading && !logs.length ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full" />
                </div>
            ) : logs.length === 0 ? (
                <Card className="p-8 text-center">
                    <p className="text-muted-foreground">No approval logs found</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {logs.map((log, index) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="p-4 hover:bg-accent/50 transition-colors">
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                {getActionIcon(log.action)}
                                                <Badge variant={getActionBadgeVariant(log.action)}>
                                                    {formatAction(log.action)}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    by {log.performedByFullName} ({log.performedByRole})
                                                </span>
                                            </div>
                                            <p className="text-sm">
                                                <span className="font-medium">Staff:</span> {log.changeRequest.staff.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Request Type: {log.changeRequest.type} | Status: {log.changeRequest.status}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(log.timestamp)}
                                        </div>
                                    </div>
                                    {log.comments && (
                                        <div className="pl-6 pt-2 border-l-2 border-primary/30">
                                            <p className="text-sm text-muted-foreground italic">
                                                Comment: {log.comments}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {total > limit && (
                <div className="flex justify-between items-center pt-4">
                    <button
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                        disabled={offset === 0}
                        className="px-4 py-2 text-sm rounded border disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-muted-foreground">
                        Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
                    </span>
                    <button
                        onClick={() => setOffset(offset + limit)}
                        disabled={offset + limit >= total}
                        className="px-4 py-2 text-sm rounded border disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}
