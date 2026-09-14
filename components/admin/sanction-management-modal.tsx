"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Edit2, Check, X } from "lucide-react"
import { useSanctions, useCreateSanction, useUpdateSanction, useDeleteSanction } from "@/hooks/use-resources"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { sanctionSchema } from "@/lib/validations"

interface SanctionManagementModalProps {
    open: boolean
    onClose: () => void
}

export default function SanctionManagementModal({ open, onClose }: SanctionManagementModalProps) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState("")

    const { data: sanctions = [] } = useSanctions()
    const createSanction = useCreateSanction()
    const updateSanction = useUpdateSanction()
    const deleteSanction = useDeleteSanction()

    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: zodResolver(sanctionSchema),
        defaultValues: {
            name: "",
            description: "",
            isActive: true,
        },
    })

    const handleAdd = handleSubmit((data) => {
        createSanction.mutate({ name: data.name }, {
            onSuccess: () => {
                reset()
            },
        })
    })

    const handleUpdate = (id: string) => {
        if (!editingName.trim()) return
        updateSanction.mutate({ id, data: { name: editingName } }, {
            onSuccess: () => {
                setEditingId(null)
            },
        })
    }

    const handleDelete = (id: string) => {
        if (!confirm("Are you sure you want to delete this sanction?")) return
        deleteSanction.mutate(id)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Manage Sanctions</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <form onSubmit={handleAdd} className="flex gap-2">
                        <div className="flex-1 space-y-1">
                            <Input
                                placeholder="New sanction name..."
                                {...register("name")}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name.message}</p>
                            )}
                        </div>
                        <Button type="submit" disabled={createSanction.isPending}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </form>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {sanctions.map((s: any) => (
                            <div key={s.id} className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
                                {editingId === s.id ? (
                                    <div className="flex items-center gap-2 flex-1 mr-2">
                                        <Input
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            className="h-8"
                                            autoFocus
                                        />
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => handleUpdate(s.id)} disabled={updateSanction.isPending}>
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
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600" onClick={() => handleDelete(s.id)} disabled={deleteSanction.isPending}>
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
