"use client"

import { Card } from "@/components/ui/card"
import type { LogEntry } from "@/lib/types"
import { AlertCircle, CheckCircle2, Edit2, Trash2 } from "lucide-react"
import { motion } from "framer-motion"

interface ActivityLogProps {
  logs: LogEntry[]
}

export default function ActivityLog({ logs }: ActivityLogProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "UPDATE":
        return <Edit2 className="w-5 h-5 text-blue-500" />
      case "DELETE":
        return <Trash2 className="w-5 h-5 text-destructive" />
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getActionLabel = (action: string) => {
    return action.charAt(0) + action.slice(1).toLowerCase()
  }

  if (logs.length === 0) {
    return (
      <Card className="p-12 text-center border-border/50">
        <p className="text-muted-foreground">No activities yet</p>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 overflow-hidden">
      <div className="p-6 border-b border-border/50">
        <h3 className="font-semibold text-lg">Activity Logs</h3>
      </div>
      <div className="divide-y divide-border/30">
        {logs.map((log, index) => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 hover:bg-secondary/5 transition-colors"
          >
            <div className="flex gap-4">
              <div className="shrink-0 mt-1">{getActionIcon(log.action)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-medium">
                      <span className="text-primary">{getActionLabel(log.action)}</span>
                    </p>
                    <p className="text-sm text-foreground mt-1">
                      {(() => {
                        try {
                          // Try to parse as JSON for better formatting
                          const parsed = JSON.parse(log.details)
                          if (typeof parsed === 'object' && parsed !== null) {
                            return (
                              <div className="space-y-1">
                                {Object.entries(parsed).map(([key, value]) => (
                                  <div key={key} className="text-xs">
                                    <span className="font-medium text-muted-foreground">{key}:</span>{' '}
                                    <span>{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            )
                          }
                        } catch {
                          // Not JSON, display as is
                        }
                        return log.details
                      })()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">By {log.userFullName}</p>
                  </div>
                  <div className="text-right shrink-0">
                  {/*  <p className="text-xs text-muted-foreground">{log.timestamp.toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">{log.timestamp.toLocaleTimeString()}</p>*/}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}
