"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Save, Clock, AlertTriangle } from "lucide-react"

interface SystemSetting {
    id: string
    key: string
    value: string
    label: string
}

interface SystemSettingsModalProps {
    open: boolean
    onClose: () => void
}

export default function SystemSettingsModal({ open, onClose }: SystemSettingsModalProps) {
    const [settings, setSettings] = useState<SystemSetting[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    // Specific values for the window
    const [windowValue, setWindowValue] = useState("30")

    useEffect(() => {
        if (open) {
            fetchSettings()
        }
    }, [open])

    const fetchSettings = async () => {
        setLoading(true)
        setError("")
        try {
            const response = await fetch("/api/settings", {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setSettings(data)

                // Find the window setting
                const windowSetting = data.find((s: SystemSetting) => s.key === "DOCUMENT_REPLACEMENT_WINDOW")
                if (windowSetting) {
                    setWindowValue(windowSetting.value)
                }
            } else {
                setError("Couldn't load settings. Please try again.")
            }
        } catch (err) {
            setError("You appear to be offline. Please check your connection.")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setError("")
        setSuccess("")

        // Validate window value
        const minutes = parseInt(windowValue, 10)
        if (isNaN(minutes) || minutes < 0) {
            setError("Please enter a valid number of minutes (0 or more)")
            setSaving(false)
            return
        }

        try {
            const response = await fetch("/api/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    key: "DOCUMENT_REPLACEMENT_WINDOW",
                    value: windowValue,
                    label: "Document Replacement Window (Minutes)"
                })
            })

            if (response.ok) {
                setSuccess("Settings updated successfully")
                setTimeout(() => setSuccess(""), 3000)
            } else {
                const data = await response.json()
                setError(data.error || "Couldn't save your changes. Please try again.")
            }
        } catch (err) {
            setError("You appear to be offline. Please check your connection.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                    >
                        <Card className="w-full max-w-md bg-card border-primary/20 shadow-2xl">
                            <div className="p-6 border-b border-border/50 flex items-center justify-between bg-linear-to-r from-primary/5 to-accent/5">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-primary" />
                                    <h2 className="text-xl font-bold">System Settings</h2>
                                </div>
                                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex gap-3">
                                        <AlertTriangle className="w-5 h-5 shrink-0" />
                                        <p>
                                            These settings affect all users. Only change them if you are sure about the operational impact.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="window">Document Replacement Window (Minutes)</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="window"
                                                type="number"
                                                value={windowValue}
                                                onChange={(e) => setWindowValue(e.target.value)}
                                                placeholder="30"
                                                min="0"
                                            />
                                            <span className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
                                                min
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Admins will have this much time to replace a document after it's approved by the Chairman.
                                            Set to 0 to disable replacement immediately after approval.
                                        </p>
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>
                                )}
                                {success && (
                                    <p className="text-sm text-emerald-600 bg-emerald-50 p-2 rounded">{success}</p>
                                )}

                                <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                                    <Button variant="outline" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={loading || saving}
                                        className="bg-linear-to-r from-primary to-accent"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {saving ? "Saving..." : "Save Settings"}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
