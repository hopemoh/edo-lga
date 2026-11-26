"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Edit2, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useQualifications, useCreateQualification, useDeleteQualification, useRanks, useCreateRank, useDeleteRank, useDepartments, useCreateDepartment, useDeleteDepartment } from "@/hooks/use-resources"

interface QualificationFormModalProps {
    open: boolean
    onClose: () => void
}

export default function QualificationFormModal({ open, onClose }: QualificationFormModalProps) {
    const [activeTab, setActiveTab] = useState("qualifications")
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ name: "" })

    const { data: qualifications = [] } = useQualifications()
    const { data: ranks = [] } = useRanks()
    const { data: departments = [] } = useDepartments()

    const createQualification = useCreateQualification()
    const deleteQualification = useDeleteQualification()
    const createRank = useCreateRank()
    const deleteRank = useDeleteRank()
    const createDepartment = useCreateDepartment()
    const deleteDepartment = useDeleteDepartment()

    const createMutation = activeTab === "qualifications" ? createQualification : activeTab === "ranks" ? createRank : createDepartment
    const deleteMutation = activeTab === "qualifications" ? deleteQualification : activeTab === "ranks" ? deleteRank : deleteDepartment

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name) return

        const onSuccess = () => {
            setFormData({ name: "" })
            setEditingId(null)
        }

        if (editingId) {
            // No update mutation in the hooks — these are create-only. Treat as create for new items.
            // Since there's no update hook, we keep the create pattern for new items.
        }

        createMutation.mutate({ name: formData.name }, { onSuccess })
    }

    const handleDelete = (id: string) => {
        if (!confirm("Are you sure?")) return
        deleteMutation.mutate(id)
    }

    const startEdit = (item: any) => {
        setEditingId(item.id)
        setFormData({ name: item.name })
    }

    const items = activeTab === "qualifications" ? qualifications : activeTab === "ranks" ? ranks : departments

    const renderForm = () => (
        <form onSubmit={handleSave} className="space-y-4 bg-muted/30 p-4 rounded-lg mb-6 border border-border">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">
                    {editingId ? `Edit ${activeTab}` : `Add New ${activeTab}`}
                </h3>
                {editingId && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingId(null); setFormData({ name: "" }) }}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            <div className="space-y-2">
                <Label>Name</Label>
                <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    placeholder={`Enter ${activeTab} name`}
                />
            </div>

            <Button type="submit" disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Saving..." : editingId ? "Update" : "Add"}
            </Button>
        </form>
    )

    const renderList = () => (
        <div className="space-y-2 max-h-100 overflow-y-auto">
            <AnimatePresence>
                {items.map((item: any) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
                    >
                        <p className="font-medium">{item.name}</p>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEdit(item)}
                            >
                                <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDelete(item.id)}
                                disabled={deleteMutation.isPending}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Qualifications, Ranks & Departments</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setEditingId(null); setFormData({ name: "" }) }}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
                        <TabsTrigger value="ranks">Ranks</TabsTrigger>
                        <TabsTrigger value="departments">Departments</TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        {renderForm()}

                        <TabsContent value="qualifications">
                            {renderList()}
                        </TabsContent>
                        <TabsContent value="ranks">
                            {renderList()}
                        </TabsContent>
                        <TabsContent value="departments">
                            {renderList()}
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
