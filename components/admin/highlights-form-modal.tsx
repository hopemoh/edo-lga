"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SignedImage } from "@/components/ui/signed-image"
import { Plus, Trash2, Edit2, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useExecutives, useHighlights, useCreateExecutive, useUpdateExecutive, useDeleteExecutive, useCreateHighlight, useUpdateHighlight, useDeleteHighlight } from "@/hooks/use-resources"

interface HighlightsFormModalProps {
    open: boolean
    onClose: () => void
}

export default function HighlightsFormModal({ open, onClose }: HighlightsFormModalProps) {
    const [activeTab, setActiveTab] = useState("executives")
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<any>({})

    const { data: executives = [] } = useExecutives()
    const { data: highlights = [] } = useHighlights(activeTab !== "executives" ? activeTab.toUpperCase() : undefined)

    const createExecutive = useCreateExecutive()
    const updateExecutive = useUpdateExecutive()
    const deleteExecutive = useDeleteExecutive()
    const createHighlight = useCreateHighlight()
    const updateHighlight = useUpdateHighlight()
    const deleteHighlight = useDeleteHighlight()

    const isSaving = createExecutive.isPending || updateExecutive.isPending || createHighlight.isPending || updateHighlight.isPending

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        const isExecutive = activeTab === "executives"

        const formDataToSend = new FormData()

        if (isExecutive) {
            formDataToSend.append('name', formData.name || '')
            formDataToSend.append('role', formData.role || '')
        } else {
            formDataToSend.append('type', activeTab.toUpperCase())
            formDataToSend.append('title', formData.title || '')
            formDataToSend.append('subtitle', formData.subtitle || '')
            formDataToSend.append('description', formData.description || '')
        }

        formDataToSend.append('order', (formData.order || 0).toString())

        if (formData.imageFile && activeTab !== 'promotion') {
            formDataToSend.append('image', formData.imageFile)
        }

        const onSuccess = () => {
            setEditingId(null)
            setFormData({})
        }

        if (isExecutive) {
            if (editingId) {
                updateExecutive.mutate({ id: editingId, data: formDataToSend }, { onSuccess })
            } else {
                createExecutive.mutate(formDataToSend, { onSuccess })
            }
        } else {
            if (editingId) {
                updateHighlight.mutate({ id: editingId, data: formDataToSend }, { onSuccess })
            } else {
                createHighlight.mutate(formDataToSend, { onSuccess })
            }
        }
    }

    const handleDelete = (id: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return

        const isExecutive = activeTab === "executives"
        if (isExecutive) {
            deleteExecutive.mutate(id, {
                onError: () => alert("Couldn't save your changes. Please try again.")
            })
        } else {
            deleteHighlight.mutate(id, {
                onError: () => alert("Couldn't save your changes. Please try again.")
            })
        }
    }

    const startEdit = (item: any) => {
        setEditingId(item.id)
        setFormData(item)
    }

    const renderForm = () => (
        <form onSubmit={handleSave} className="space-y-4 bg-muted/30 p-4 rounded-lg mb-6 border border-border">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">{editingId ? 'Edit Item' : 'Add New Item'}</h3>
                {editingId && (
                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setFormData({}) }}>
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Name / Title</Label>
                    <Input
                        value={formData.title || formData.name || ''}
                        onChange={e => setFormData({ ...formData, [activeTab === 'executives' ? 'name' : 'title']: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>{activeTab === 'executives' ? 'Role' : 'Subtitle'}</Label>
                    <Input
                        value={formData.subtitle || formData.role || ''}
                        onChange={e => setFormData({ ...formData, [activeTab === 'executives' ? 'role' : 'subtitle']: e.target.value })}
                    />
                </div>
                {activeTab !== 'executives' && (
                    <div className="space-y-2 col-span-2">
                        <Label>Description / Date</Label>
                        <Input
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                )}
                {activeTab !== 'promotion' && (
                    <div className="space-y-2 col-span-2">
                        <Label>Image</Label>
                        {formData.image && !formData.imageFile && (
                            <div className="mb-2">
                                <SignedImage src={formData.image} alt="Current" className="w-20 h-20 object-cover rounded border" />
                                <p className="text-xs text-muted-foreground">Current image</p>
                            </div>
                        )}
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={e => {
                                const file = e.target.files?.[0]
                                if (file) {
                                    setFormData({ ...formData, imageFile: file })
                                }
                            }}
                        />
                        {formData.imageFile && (
                            <p className="text-xs text-muted-foreground">New image: {formData.imageFile.name}</p>
                        )}
                    </div>
                )}
                <div className="space-y-2">
                    <Label>Order</Label>
                    <Input
                        type="number"
                        value={formData.order || 0}
                        onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    />
                </div>
            </div>

            <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? "Saving..." : "Save Item"}
            </Button>
        </form>
    )

    const renderList = (items: any[]) => (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
            <AnimatePresence>
                {items.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
                    >
                        <div className="flex items-center gap-3">
                            {item.image && (
                                <SignedImage src={item.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                            )}
                            <div>
                                <p className="font-medium">{item.name || item.title}</p>
                                <p className="text-xs text-muted-foreground">{item.role || item.subtitle}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => startEdit(item)}>
                                <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}>
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
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Manage Highlights & Executives</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setEditingId(null); setFormData({}); }}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="executives">Executives</TabsTrigger>
                        <TabsTrigger value="confirmation">Confirmations</TabsTrigger>
                        <TabsTrigger value="conversion">Conversions</TabsTrigger>
                        <TabsTrigger value="promotion">Promotions</TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        {renderForm()}

                        <TabsContent value="executives">
                            {renderList(executives)}
                        </TabsContent>
                        <TabsContent value="confirmation">
                            {renderList(highlights)}
                        </TabsContent>
                        <TabsContent value="conversion">
                            {renderList(highlights)}
                        </TabsContent>
                        <TabsContent value="promotion">
                            {renderList(highlights)}
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
