"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Plus, Trash2, Edit2, Check, X } from "lucide-react"

interface Sanction {
    id: string
    name: string
}

interface SanctionManagementModalProps {
    open: boolean
    onClose: () => void
}

export default function SanctionManagementModal({ open, onClose }: SanctionManagementModalProps) {
    const [sanctions, setSanctions] = useState<Sanction[]>([])
    const [loading, setLoading] = useState(false)
    const [newSanction, setNewSanction] = useState("")
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState("")

    useEffect(() => {
        if (open) {
            fetchSanctions()
        }
    }, [open])

    const fetchSanctions = async () => {
        try {
            const response = await fetch('/api/sanctions')
            if (response.ok) {
                const data = await response.json()
                setSanctions(data)
            }
        } catch (error) {
        }
    }

    const handleAdd = async () => {
        if (!newSanction.trim()) return
        setLoading(true)
        try {
            const response = await fetch('/api/sanctions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newSanction })
            })
            if (response.ok) {
                toast.success("Sanction added")
                setNewSanction("")
                fetchSanctions()
            } else {
                toast.error("Couldn't save your changes. Please try again.")
            }
        } catch (error) {
            toast.error("You appear to be offline. Please check your connection.")
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (id: string) => {
        if (!editingName.trim()) return
        setLoading(true)
        try {
            const response = await fetch(`/api/sanctions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editingName })
            })
            if (response.ok) {
                toast.success("Sanction updated")
                setEditingId(null)
                fetchSanctions()
            } else {
                toast.error("Couldn't save your changes. Please try again.")
            }
        } catch (error) {
            toast.error("You appear to be offline. Please check your connection.")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this sanction?")) return
        setLoading(true)
        try {
            const response = await fetch(`/api/sanctions/${id}`, {
                method: 'DELETE'
            })
            if (response.ok) {
                toast.success("Sanction deleted")
                fetchSanctions()
            } else {
                toast.error("Couldn't save your changes. Please try again.")
            }
        } catch (error) {
            toast.error("You appear to be offline. Please check your connection.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Manage Sanctions</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="New sanction name..."
                            value={newSanction}
                            onChange={(e) => setNewSanction(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <Button onClick={handleAdd} disabled={loading || !newSanction.trim()}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {sanctions.map((s) => (
                            <div key={s.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
                                {editingId === s.id ? (
                                    <div className="flex items-center gap-2 flex-1 mr-2">
                                        <Input
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            className="h-8"
                                            autoFocus
                                        />
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => handleUpdate(s.id)}>
                                            <Check className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => setEditingId(null)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-sm font-medium">{s.name}</span>
                                        <div className="flex items-center gap-1">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => {
                                                setEditingId(s.id)
                                                setEditingName(s.name)
                                            }}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => handleDelete(s.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {sanctions.length === 0 && (
                            <p className="text-center text-sm text-muted-foreground py-4">No sanctions defined yet.</p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
