"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Save, Clock, AlertTriangle } from "lucide-react"
import { useSettings, useUpsertSetting } from "@/hooks/use-resources"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { settingSchema } from "@/lib/validations"
import type { z } from "zod"

type SettingFormValues = z.infer<typeof settingSchema>

interface SystemSettingsModalProps {
    open: boolean
    onClose: () => void
}

export default function SystemSettingsModal({ open, onClose }: SystemSettingsModalProps) {
    const [success, setSuccess] = useState("")

    const { data: settings = [], isLoading: loading } = useSettings()
    const upsertMutation = useUpsertSetting()

    const { register, handleSubmit, formState: { errors }, reset } = useForm<SettingFormValues>({
        resolver: zodResolver(settingSchema),
        defaultValues: {
            key: "DOCUMENT_REPLACEMENT_WINDOW",
            value: "30",
        },
    })

    useEffect(() => {
        if (open && settings.length > 0) {
            const windowSetting = settings.find((s: any) => s.key === "DOCUMENT_REPLACEMENT_WINDOW")
            if (windowSetting) {
                reset({ key: "DOCUMENT_REPLACEMENT_WINDOW", value: windowSetting.value })
            }
        }
    }, [open, settings, reset])

    const handleSave = (data: SettingFormValues) => {
        setSuccess("")

        upsertMutation.mutate(
            {
                key: "DOCUMENT_REPLACEMENT_WINDOW",
                value: data.value,
                label: "Document Replacement Window (Minutes)"
            },
            {
                onSuccess: () => {
                    setSuccess("Settings updated successfully")
                    setTimeout(() => setSuccess(""), 3000)
                },
            }
        )
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

                                    <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="window">Document Replacement Window (Minutes)</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="window"
                                                    type="number"
                                                    {...register("value")}
                                                    placeholder="30"
                                                    min="0"
                                                />
                                                <span className="flex items-center text-sm text-muted-foreground whitespace-nowrap">
                                                    min
                                                </span>
                                            </div>
                                            {errors.value && (
                                                <p className="text-sm text-destructive">{errors.value.message}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Admins will have this much time to replace a document after it's approved by the Chairman.
                                                Set to 0 to disable replacement immediately after approval.
                                            </p>
                                        </div>

                                        {success && (
                                            <p className="text-sm text-emerald-600 bg-emerald-50 p-2 rounded">{success}</p>
                                        )}

                                        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                                            <Button type="button" variant="outline" onClick={onClose}>
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={loading || upsertMutation.isPending}
                                                className="bg-linear-to-r from-primary to-accent"
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                {upsertMutation.isPending ? "Saving..." : "Save Settings"}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
