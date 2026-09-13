"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Edit2, Save, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface QualificationFormModalProps {
    open: boolean
    onClose: () => void
}

interface Qualification {
    id: string
    name: string
}

interface Rank {
    id: string
    name: string
}

interface Status {
    id: string
    name: string
}

export default function QualificationFormModal({ open, onClose }: QualificationFormModalProps) {
    const [activeTab, setActiveTab] = useState("qualifications")
    const [qualifications, setQualifications] = useState<Qualification[]>([])
    const [ranks, setRanks] = useState<Rank[]>([])
    const [statuses, setStatuses] = useState<Status[]>([])
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ name: "" })

    useEffect(() => {
        if (open) {
            fetchData()
        }
    }, [open, activeTab])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (activeTab === "qualifications") {
                const res = await fetch('/api/qualifications')
                if (res.ok) setQualifications(await res.json())
            } else if (activeTab === "ranks") {
                const res = await fetch('/api/ranks')
                if (res.ok) setRanks(await res.json())
            } else if (activeTab === "statuses") {
                const res = await fetch('/api/status')
                if (res.ok) setStatuses(await res.json())
            }
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name) return

        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const endpoint = `/api/${activeTab}`
            const method = editingId ? 'PUT' : 'POST'
            const url = editingId ? `${endpoint}/${editingId}` : endpoint

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: formData.name })
            })

            if (response.ok) {
                setFormData({ name: "" })
                setEditingId(null)
                fetchData()
            }
        } catch (error) {
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return

        try {
            const token = localStorage.getItem('token')
            const endpoint = `/api/${activeTab}/${id}`
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!response.ok) {
                const errorData = await response.json()
                alert(errorData.error || "Couldn't save your changes. Please try again.")
                return
            }

            fetchData()
        } catch (error) {
            alert("Couldn't save your changes. Please try again.")
        }
    }

    const startEdit = (item: any) => {
        setEditingId(item.id)
        setFormData({ name: item.name })
    }

    const items = activeTab === "qualifications" ? qualifications : activeTab === "ranks" ? ranks : statuses

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
                    required
                />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving..." : editingId ? "Update" : "Add"}
            </Button>
        </form>
    )

    const renderList = () => (
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
                    <DialogTitle>Manage Qualifications, Ranks & Statuses</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setEditingId(null); setFormData({ name: "" }) }}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
                        <TabsTrigger value="ranks">Ranks</TabsTrigger>
                        <TabsTrigger value="statuses">Statuses</TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        {renderForm()}

                        <TabsContent value="qualifications">
                            {renderList()}
                        </TabsContent>
                        <TabsContent value="ranks">
                            {renderList()}
                        </TabsContent>
                        <TabsContent value="statuses">
                            {renderList()}
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
