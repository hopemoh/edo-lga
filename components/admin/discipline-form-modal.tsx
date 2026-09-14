"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RichTextEditor from "@/components/ui/rich-text-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { useStaff } from "@/hooks/use-staff"
import { useSanctions } from "@/hooks/use-resources"
import { useCreateDisciplinaryCase, useUpdateDisciplinaryCase } from "@/hooks/use-resources"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { disciplinaryCaseSchema } from "@/lib/validations"
import type { z } from "zod"

type DisciplineFormValues = z.infer<typeof disciplinaryCaseSchema>

interface DisciplineFormModalProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    initialData?: any
}

export default function DisciplineFormModal({ open, onClose, onSuccess, initialData }: DisciplineFormModalProps) {
    const [openStaff, setOpenStaff] = useState(false)

    const { data: staff = [] } = useStaff()
    const { data: sanctions = [] } = useSanctions()
    const createCase = useCreateDisciplinaryCase()
    const updateCase = useUpdateDisciplinaryCase()

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<DisciplineFormValues>({
        resolver: zodResolver(disciplinaryCaseSchema),
        defaultValues: {
            staffId: "",
            title: "",
            description: "",
            status: "Pending",
            sanction: "",
            dateReported: new Date().toISOString().split("T")[0],
        },
    })

    const selectedStaffId = watch("staffId")

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    staffId: initialData.staffId,
                    title: initialData.title,
                    description: initialData.description,
                    status: initialData.status,
                    sanction: initialData.sanction || "",
                    dateReported: initialData.dateReported || new Date().toISOString().split("T")[0],
                })
            } else {
                reset({
                    staffId: "",
                    title: "",
                    description: "",
                    status: "Pending",
                    sanction: "",
                    dateReported: new Date().toISOString().split("T")[0],
                })
            }
        }
    }, [open, initialData, reset])

    const onSubmit = (data: DisciplineFormValues) => {
        const onSuccessHandler = () => {
            onSuccess()
            onClose()
        }

        if (initialData) {
            updateCase.mutate({ id: initialData.id, data }, {
                onSuccess: onSuccessHandler,
            })
        } else {
            createCase.mutate(data, {
                onSuccess: onSuccessHandler,
            })
        }
    }

    const isSaving = createCase.isPending || updateCase.isPending

    return (
        <Dialog open={open} onOpenChange={onClose} modal={false}>
            <DialogContent className="sm:max-w-[500px] pointer-events-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Disciplinary Case" : "Add Disciplinary Case"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Staff Member</Label>
                        <input type="hidden" {...register("staffId")} />
                        <Popover open={openStaff} onOpenChange={setOpenStaff}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openStaff}
                                    className="w-full justify-between pointer-events-auto"
                                    disabled={!!initialData}
                                    type="button"
                                >
                                    {selectedStaffId
                                        ? staff.find((s: any) => s.id === selectedStaffId)?.name
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
                                            {staff.map((s: any) => (
                                                <CommandItem
                                                    key={s.id}
                                                    value={s.id}
                                                    keywords={[s.name]}
                                                    className="pointer-events-auto cursor-pointer"
                                                    onSelect={(currentValue) => {
                                                        setValue("staffId", currentValue)
                                                        setOpenStaff(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedStaffId === s.id ? "opacity-100" : "opacity-0"
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
                        {errors.staffId && (
                            <p className="text-sm text-destructive">{errors.staffId.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Case Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Unauthorized Absence"
                            {...register("title")}
                        />
                        {errors.title && (
                            <p className="text-sm text-destructive">{errors.title.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <div className="min-h-[150px]">
                            <RichTextEditor
                                value={watch("description") || ""}
                                onChange={(value) => setValue("description", value)}
                                placeholder="Provide details about the case..."
                            />
                        </div>
                        {errors.description && (
                            <p className="text-sm text-destructive">{errors.description.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={watch("status")}
                                onValueChange={(val) => setValue("status", val)}
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
                            {errors.status && (
                                <p className="text-sm text-destructive">{errors.status.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sanction">Sanction (Optional)</Label>
                            <Select
                                value={watch("sanction") || "none"}
                                onValueChange={(val) => setValue("sanction", val === "none" ? "" : val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select sanction" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {sanctions.map((s: any) => (
                                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? (initialData ? "Updating..." : "Adding...") : (initialData ? "Update Case" : "Add Case")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
