"use client"

import React, { useState, useEffect } from "react"
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
import { useStatuses, useRanks, useQualifications } from "@/hooks/use-resources"
import { useCreateStaff, useUpdateStaff } from "@/hooks/use-staff"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { staffCreateSchema } from "@/lib/validations"
import type { z } from "zod"

type StaffFormValues = z.infer<typeof staffCreateSchema>
type Role = "STAFF" | "ADMIN" | "CHAIRMAN" | "SECRETARY"

interface StaffFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  lgaId?: string
  staffToEdit?: Staff | null
  isEditing?: boolean
  currentUserRole?: Role
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

export default function StaffFormModal({ open, onClose, onSuccess, lgaId: initialLgaId, staffToEdit, isEditing, currentUserRole }: StaffFormModalProps) {
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [approvedChangeRequest, setApprovedChangeRequest] = useState<ChangeRequest | null>(null)
  const [hasApprovedRequest, setHasApprovedRequest] = useState(false)

  const { data: lgas = [] } = useLGAs()
  const { data: statuses = [] } = useStatuses()
  const { data: ranks = [] } = useRanks()
  const { data: qualifications = [] } = useQualifications()
  const createMutation = useCreateStaff()
  const updateMutation = useUpdateStaff()

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<StaffFormValues>({
    resolver: zodResolver(staffCreateSchema),
    defaultValues: {
      name: "",
      sex: "M",
      lgaId: initialLgaId || "",
      statusId: "",
      phoneNumber: "",
      sgl: 1,
      dateOfBirth: "",
      dateOfFirstAppt: "",
      dateOfConf: "",
      dateOfPresentAppt: "",
    },
  })

  const isAdmin = currentUserRole && ['ADMIN'].includes(currentUserRole)

  const editableFields = approvedChangeRequest?.selectedFields || []

  const isFieldEditable = (fieldName: string) => {
    if (!isEditing || !staffToEdit) return true
    if (!hasApprovedRequest) return false
    return editableFields.includes(fieldName)
  }

  const isFormDisabled = Boolean(isEditing && staffToEdit && !hasApprovedRequest)

  useEffect(() => {
    if (open) {
      if (isEditing && staffToEdit) {
        fetchApprovedChangeRequest()
      } else {
        setHasApprovedRequest(true)
      }

      if (isEditing && staffToEdit) {
        const defaultVals = {
          name: staffToEdit.name || "",
          sex: (staffToEdit.sex || "M") as "M" | "F",
          lgaId: staffToEdit.lga?.id || staffToEdit.lgaId || "",
          statusId: typeof staffToEdit.status === 'object' ? (staffToEdit.status as any).id : "",
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
        if (!approvedChangeRequest?.selectedFields.includes('qualifications')) {
          setSelectedQualifications((staffToEdit.qualifications as any[])?.map((q: any) => q.qualificationId || q.id) || [])
        }
      } else {
        reset({
          name: "",
          sex: "M",
          lgaId: initialLgaId || "",
          statusId: "",
          phoneNumber: "",
          sgl: 1,
          dateOfBirth: "",
          dateOfFirstAppt: "",
          dateOfConf: "",
          dateOfPresentAppt: "",
          recommendedRetirementDate: "",
          remark: "",
        })
        setSelectedQualifications([])
      }
    }
  }, [open, isEditing, staffToEdit, initialLgaId])

  const fetchApprovedChangeRequest = async () => {
    if (!staffToEdit?.id) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/change-requests?staffId=${staffToEdit.id}&status=CHAIRMAN_APPROVED`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        const approvedRequest = data.find((req: ChangeRequest) => req.status === 'CHAIRMAN_APPROVED')
        if (approvedRequest) {
          setApprovedChangeRequest(approvedRequest)
          setHasApprovedRequest(true)

          if (approvedRequest.selectedFields.includes('qualifications') && approvedRequest.changes.qualifications) {
            setSelectedQualifications(approvedRequest.changes.qualifications)
          }
        } else {
          setApprovedChangeRequest(null)
          setHasApprovedRequest(false)
        }
      }
    } catch (error) {
      setHasApprovedRequest(false)
    }
  }

  const onSubmit = (data: StaffFormValues) => {
    setLoading(true)
    setError("")

    try {
      if (isEditing && staffToEdit) {
        let updateData: any = { ...data }
        if (approvedChangeRequest) {
          updateData = {}
          editableFields.forEach(field => {
            if (field === 'status') {
              updateData.statusId = data.statusId
            } else if (field === 'rank') {
              updateData.rankId = (data as any).rankId
            } else {
              updateData[field] = (data as any)[field]
            }
          })
        }

        updateMutation.mutate(
          {
            id: staffToEdit.id,
            data: {
              ...updateData,
              qualificationIds: isFieldEditable('qualifications') ? selectedQualifications : undefined,
              changeRequestId: approvedChangeRequest?.id
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
      } else {
        const staffData = { ...data, qualificationIds: selectedQualifications }
        const formDataWithFile = new FormData()
        formDataWithFile.append('data', JSON.stringify(staffData))
        if (file) {
          formDataWithFile.append('document', file)
        }

        createMutation.mutate(formDataWithFile as any, {
          onSuccess: () => {
            onSuccess()
            onClose()
          },
          onError: (err: any) => {
            setError(err.message || "Couldn't save your changes. Please try again.")
          },
        })
      }
    } catch (err) {
      setError("You appear to be offline. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const renderField = (
    fieldName: string,
    label: string,
    type: 'text' | 'select' | 'date' | 'textarea' | 'number' = 'text',
    options?: { value: string; label: string }[],
    required: boolean = false
  ) => {
    const editable = isFieldEditable(fieldName)
    const isHighlighted = isEditing && editable && hasApprovedRequest
    const fieldError = (errors as any)[fieldName]

    return (
      <div className={`space-y-2 ${isHighlighted ? 'p-3 bg-blue-50 border border-blue-200 rounded-lg' : ''}`}>
        <Label htmlFor={fieldName} className="flex items-center gap-2">
          {label}
          {isHighlighted && <Badge variant="secondary" className="text-xs">Editable</Badge>}
          {!editable && isEditing && <Lock className="w-3 h-3 text-muted-foreground" />}
        </Label>

        {type === 'text' && (
          <Input
            id={fieldName}
            {...register(fieldName as any, { required: required && editable ? `${label} is required` : false })}
            disabled={!editable}
            className={!editable ? 'bg-muted cursor-not-allowed' : ''}
          />
        )}

        {type === 'number' && (
          <Input
            id={fieldName}
            type="number"
            {...register(fieldName as any, { valueAsNumber: true })}
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto antialiased">
        <DialogHeader>
          <DialogTitle className="antialiased">
            {isEditing ? `Edit Staff: ${staffToEdit?.name || 'Unknown'}` : 'Add New Staff Member'}
            {isEditing && approvedChangeRequest && (
              <div className="text-sm font-normal text-muted-foreground mt-1">
                Editing based on approved change request: {approvedChangeRequest.changeReason?.name || 'Unknown reason'}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {isEditing && !hasApprovedRequest && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="text-red-900">
                <p className="font-semibold">No Approved Change Request</p>
                <p className="text-xs mt-1">
                  Staff editing is disabled. A change request must be approved by both Secretary and Chairman before any fields can be edited.
                </p>
              </div>
            </div>
          </div>
        )}

        {isEditing && hasApprovedRequest && (
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
          className="space-y-6 antialiased"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Basic Information</h3>
              {renderField('name', 'Full Name', 'text', undefined, true)}
              {renderField('sex', 'Sex', 'select', [
                { value: 'M', label: 'Male' },
                { value: 'F', label: 'Female' }
              ], true)}
              {renderField('phoneNumber', 'Phone Number', 'text', undefined, true)}
              {renderField('dateOfBirth', 'Date of Birth', 'date', undefined, true)}
            </div>

            {/* Employment Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Employment Details</h3>
              {renderField('statusId', 'Status', 'select',
                statuses.map((s: any) => ({ value: s.id, label: s.name })), true
              )}
              {renderField('sgl', 'SGL', 'number', undefined, true)}
            </div>
          </div>

          {/* LGA Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Location</h3>
            {renderField('lgaId', 'LGA of Origin', 'select',
              lgas.map((lga: any) => ({ value: lga.id, label: lga.name })), true
            )}
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Important Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField('dateOfFirstAppt', 'Date of First Appointment', 'date', undefined, true)}
              {renderField('dateOfConf', 'Date of Confirmation', 'date')}
              {renderField('dateOfPresentAppt', 'Date of Present Appointment', 'date')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('recommendedRetirementDate', 'Recommended Retirement Date', 'date')}
            </div>
          </div>

          {/* Qualifications - only show if editing and qualifications field is editable */}
          {isEditing && isFieldEditable('qualifications') && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Qualifications</h3>
              <div className={`space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg`}>
                <Label className="flex items-center gap-2">
                  Qualifications
                  <Badge variant="secondary" className="text-xs">Editable</Badge>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {qualifications.map((qual: any) => (
                    <label key={qual.id} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedQualifications.includes(qual.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedQualifications(prev => [...prev, qual.id])
                          } else {
                            setSelectedQualifications(prev => prev.filter(id => id !== qual.id))
                          }
                        }}
                        className="w-4 h-4 rounded border-2 border-gray-400"
                      />
                      <span>{qual.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Qualifications */}
          {!isEditing && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Qualifications</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {qualifications.map((qual: any) => (
                  <label key={qual.id} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedQualifications.includes(qual.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQualifications(prev => [...prev, qual.id])
                        } else {
                          setSelectedQualifications(prev => prev.filter(id => id !== qual.id))
                        }
                      }}
                      className="w-4 h-4 rounded border-2 border-gray-400"
                    />
                    <span>{qual.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Additional Information</h3>
            {renderField('remark', 'Remark', 'textarea')}
          </div>

          {/* File Upload for new staff */}
          {!isEditing && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Document</h3>
              <div className="space-y-2">
                <Label htmlFor="file">Upload PDF Document (Optional)</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile((e.target as HTMLInputElement).files?.[0] || null)}
                />
              </div>
            </div>
          )}

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
            <Button
              type="submit"
              disabled={loading || isFormDisabled}
              className="flex-1"
            >
              {loading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Staff" : "Create Staff")}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  )
}
