"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RichTextEditor from "@/components/ui/rich-text-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface Staff {
    id: string
    name: string
    lga?: { name: string }
}

interface Sanction {
    id: string
    name: string
}

interface DisciplineFormModalProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    initialData?: any
}

export default function DisciplineFormModal({ open, onClose, onSuccess, initialData }: DisciplineFormModalProps) {
    const [loading, setLoading] = useState(false)
    const [staff, setStaff] = useState<Staff[]>([])
    const [openStaff, setOpenStaff] = useState(false)
    const [sanctions, setSanctions] = useState<Sanction[]>([])
    const [formData, setFormData] = useState({
        staffId: "",
        title: "",
        description: "",
        status: "Pending",
        sanction: ""
    })

    useEffect(() => {
        if (open) {
            fetchStaff()
            fetchSanctions()
            if (initialData) {
                setFormData({
                    staffId: initialData.staffId,
                    title: initialData.title,
                    description: initialData.description,
                    status: initialData.status,
                    sanction: initialData.sanction || ""
                })
            } else {
                setFormData({
                    staffId: "",
                    title: "",
                    description: "",
                    status: "Pending",
                    sanction: ""
                })
            }
        }
    }, [open, initialData])

    const fetchStaff = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/staff', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setStaff(data)
            }
        } catch (error) {
        }
    }

    const fetchSanctions = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('/api/sanctions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setSanctions(data)
            }
        } catch (error) {
        }
    }

    const handleSubmit = async () => {
        if (!formData.staffId || !formData.title || !formData.description) {
            toast.error("Please fill in all required fields")
            return
        }

        setLoading(true)
        try {
            const url = initialData ? `/api/disciplinary/${initialData.id}` : '/api/disciplinary'
            const method = initialData ? 'PUT' : 'POST'

            const token = localStorage.getItem('token')
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                toast.success(initialData ? "Disciplinary case updated" : "Disciplinary case added")
                onSuccess()
                onClose()
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
        <Dialog open={open} onOpenChange={onClose} modal={false}>
            <DialogContent className="sm:max-w-[500px] pointer-events-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Disciplinary Case" : "Add Disciplinary Case"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Staff Member</Label>
                        <Popover open={openStaff} onOpenChange={setOpenStaff}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openStaff}
                                    className="w-full justify-between pointer-events-auto"
                                    disabled={!!initialData}
                                >
                                    {formData.staffId
                                        ? staff.find((s) => s.id === formData.staffId)?.name
                                        : "Select staff member..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0 pointer-events-auto" style={{ zIndex: 9999 }}>
                                <Command className="pointer-events-auto">
                                    <CommandInput placeholder="Search staff..." className="h-9 pointer-events-auto" />
                                    <CommandList className="pointer-events-auto">
                                        <CommandEmpty>No staff found.</CommandEmpty>
                                        <CommandGroup className="pointer-events-auto">
                                            {staff.map((s) => (
                                                <CommandItem
                                                    key={s.id}
                                                    value={s.id}
                                                    keywords={[s.name]}
                                                    className="pointer-events-auto cursor-pointer"
                                                    onSelect={(currentValue) => {
                                                        setFormData(prev => ({ ...prev, staffId: currentValue }))
                                                        setOpenStaff(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            formData.staffId === s.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span>{s.name}</span>
                                                        <span className="text-xs text-muted-foreground">{s.lga?.name || 'No LGA'}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Case Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Unauthorized Absence"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <div className="min-h-[150px]">
                            <RichTextEditor
                                value={formData.description}
                                onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                                placeholder="Provide details about the case..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Under Review">Under Review</SelectItem>
                                    <SelectItem value="Resolved">Resolved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sanction">Sanction (Optional)</Label>
                            <Select
                                value={formData.sanction}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, sanction: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select sanction" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {sanctions.map((s) => (
                                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="button" disabled={loading} onClick={handleSubmit}>
                            {loading ? (initialData ? "Updating..." : "Adding...") : (initialData ? "Update Case" : "Add Case")}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}