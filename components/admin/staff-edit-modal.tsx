"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Lock } from "lucide-react"
import { motion } from "framer-motion"
import type { Staff } from "@/lib/types"
import { useLGAs } from "@/hooks/use-lgas"
import { useStatuses, useRanks } from "@/hooks/use-resources"
import { useUpdateStaff } from "@/hooks/use-staff"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { staffUpdateSchema } from "@/lib/validations"
import type { z } from "zod"

type StaffEditFormValues = z.infer<typeof staffUpdateSchema>
type Role = "STAFF" | "ADMIN" | "CHAIRMAN" | "SECRETARY"

interface StaffEditModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  staffToEdit: Staff
  changeRequestId?: string
}

interface ChangeRequest {
  id: string
  selectedFields: string[]
  changes: any
  changeReason: {
    name: string
  }
  status: string
}

export default function StaffEditModal({
  open,
  onClose,
  onSuccess,
  staffToEdit,
  changeRequestId
}: StaffEditModalProps) {
  const [changeRequest, setChangeRequest] = useState<ChangeRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const { data: lgas = [] } = useLGAs()
  const { data: statuses = [] } = useStatuses()
  const { data: ranks = [] } = useRanks()
  const updateMutation = useUpdateStaff()

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<StaffEditFormValues>({
    resolver: zodResolver(staffUpdateSchema),
    defaultValues: {
      name: "",
      sex: "M",
      lgaId: "",
      statusId: "",
      phoneNumber: "",
      sgl: 1,
      dateOfBirth: "",
      dateOfFirstAppt: "",
      dateOfConf: "",
      dateOfPresentAppt: "",
    },
  })

  const editableFields = changeRequest?.selectedFields || []
  const isFieldEditable = (fieldName: string) => {
    if (!changeRequestId) return true
    return editableFields.includes(fieldName)
  }

  useEffect(() => {
    if (open) {
      initializeFormData()
      if (changeRequestId) {
        fetchChangeRequest()
      }
    }
  }, [open, staffToEdit, changeRequestId])

  const fetchChangeRequest = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/change-requests/${changeRequestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setChangeRequest(data)
      }
    } catch (error) {
    }
  }

  const initializeFormData = () => {
    const defaultVals = {
      name: staffToEdit.name || "",
      sex: (staffToEdit.sex || "M") as "M" | "F",
      lgaId: staffToEdit.lga?.id || staffToEdit.lgaId || "",
      statusId: (staffToEdit.status as any)?.id || "",
      phoneNumber: staffToEdit.phoneNumber || "",
      sgl: staffToEdit.sgl || 1,
      dateOfBirth: staffToEdit.dateOfBirth ? new Date(staffToEdit.dateOfBirth).toISOString().split('T')[0] : "",
      dateOfFirstAppt: staffToEdit.dateOfFirstAppt ? new Date(staffToEdit.dateOfFirstAppt).toISOString().split('T')[0] : "",
      dateOfConf: staffToEdit.dateOfConf ? new Date(staffToEdit.dateOfConf).toISOString().split('T')[0] : "",
      dateOfPresentAppt: staffToEdit.dateOfPresentAppt ? new Date(staffToEdit.dateOfPresentAppt).toISOString().split('T')[0] : "",
      recommendedRetirementDate: staffToEdit.recommendedRetirementDate ? new Date(staffToEdit.recommendedRetirementDate).toISOString().split('T')[0] : "",
      remark: staffToEdit.remark || "",
    }
    reset(defaultVals)
  }

  const onSubmit = (data: StaffEditFormValues) => {
    setLoading(true)
    setError("")

    try {
      let updateData = { ...data }
      if (changeRequestId && changeRequest) {
        updateData = {} as any
        editableFields.forEach(field => {
          if (field === 'status') {
            (updateData as any).statusId = data.statusId
          } else if (field === 'rank') {
            (updateData as any).rankId = (data as any).rankId
          } else {
            (updateData as any)[field] = (data as any)[field]
          }
        })
      }

      updateMutation.mutate(
        {
          id: staffToEdit.id,
          data: {
            ...updateData,
            changeRequestId
          }
        },
        {
          onSuccess: () => {
            onSuccess()
            onClose()
          },
          onError: (err: any) => {
            setError(err.message || "Couldn't save your changes. Please try again.")
          },
        }
      )
    } catch (err) {
      setError("You appear to be offline. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const renderField = (
    fieldName: string,
    label: string,
    type: 'text' | 'select' | 'date' | 'textarea' = 'text',
    options?: { value: string; label: string }[]
  ) => {
    const editable = isFieldEditable(fieldName)
    const isHighlighted = changeRequestId && editable
    const fieldError = (errors as any)[fieldName]

    return (
      <div className={`space-y-2 ${isHighlighted ? 'p-3 bg-blue-50 border border-blue-200 rounded-lg' : ''}`}>
        <Label htmlFor={fieldName} className="flex items-center gap-2">
          {label}
          {isHighlighted && <Badge variant="secondary" className="text-xs">Editable</Badge>}
          {!editable && changeRequestId && <Lock className="w-3 h-3 text-muted-foreground" />}
        </Label>

        {type === 'text' && (
          <Input
            id={fieldName}
            {...register(fieldName as any)}
            disabled={!editable}
            className={!editable ? 'bg-muted cursor-not-allowed' : ''}
          />
        )}

        {type === 'date' && (
          <Input
            id={fieldName}
            type="date"
            {...register(fieldName as any)}
            disabled={!editable}
            className={!editable ? 'bg-muted cursor-not-allowed' : ''}
          />
        )}

        {type === 'select' && (
          <Select
            value={watch(fieldName as any) || ""}
            onValueChange={(value) => setValue(fieldName as any, value)}
            disabled={!editable}
          >
            <SelectTrigger className={!editable ? 'bg-muted cursor-not-allowed' : ''}>
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {type === 'textarea' && (
          <Textarea
            id={fieldName}
            {...register(fieldName as any)}
            disabled={!editable}
            className={!editable ? 'bg-muted cursor-not-allowed' : ''}
            rows={3}
          />
        )}

        {fieldError && (
          <p className="text-sm text-destructive">{fieldError.message}</p>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Staff: {staffToEdit.name}
            {changeRequest && (
              <div className="text-sm font-normal text-muted-foreground mt-1">
                Editing based on approved change request: {changeRequest.changeReason?.name || 'Unknown reason'}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {changeRequestId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-blue-900">
                <p className="font-semibold">Selective Field Editing</p>
                <p className="text-xs mt-1">
                  Only highlighted fields can be edited based on the approved change request.
                  Other fields are locked to maintain data integrity.
                </p>
              </div>
            </div>
          </div>
        )}

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Basic Information</h3>
              {renderField('name', 'Name')}
              {renderField('sex', 'Sex', 'select', [
                { value: 'M', label: 'Male' },
                { value: 'F', label: 'Female' }
              ])}
              {renderField('phoneNumber', 'Phone Number')}
              {renderField('dateOfBirth', 'Date of Birth', 'date')}
            </div>

            {/* Employment Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Employment Details</h3>
              {renderField('statusId', 'Status', 'select',
                statuses.map((s: any) => ({ value: s.id, label: s.name }))
              )}
              {renderField('sgl', 'SGL')}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Important Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField('dateOfFirstAppt', 'Date of First Appointment', 'date')}
              {renderField('dateOfConf', 'Date of Confirmation', 'date')}
              {renderField('dateOfPresentAppt', 'Date of Present Appointment', 'date')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('recommendedRetirementDate', 'Recommended Retirement Date', 'date')}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Additional Information</h3>
            {renderField('remark', 'Remark', 'textarea')}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700"
            >
              {error}
            </motion.div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Updating..." : "Update Staff"}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  )
}
