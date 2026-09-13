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

type Role = "STAFF" | "ADMIN" | "SECRETARY" | "CHAIRMAN"

interface StaffFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  lgaId?: string
  staffToEdit?: Staff | null
  isEditing?: boolean
  currentUserRole?: Role
}

interface LGA {
  id: string
  name: string
}

interface Status {
  id: string
  name: string
}

interface Rank {
  id: string
  name: string
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

const ROLES: Role[] = ["STAFF", "ADMIN", "SECRETARY", "CHAIRMAN"]

interface FormData {
  name: string
  sex: string
  lgaId: string
  statusId: string
  rankId: string
  sgl: string
  dateOfBirth: string
  dateOfFirstAppt: string
  dateOfConf: string
  dateOfPresentAppt: string
  phoneNumber: string
  recommendedRetirementDate: string
  remark: string
  role: Role
  [key: string]: any
}

export default function StaffFormModal({ open, onClose, onSuccess, lgaId: initialLgaId, staffToEdit, isEditing, currentUserRole }: StaffFormModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    sex: "M",
    lgaId: initialLgaId || "",
    statusId: "",
    rankId: "",
    sgl: "",
    dateOfBirth: "",
    dateOfFirstAppt: "",
    dateOfConf: "",
    dateOfPresentAppt: "",
    phoneNumber: "",
    recommendedRetirementDate: "",
    remark: "",
    role: "STAFF" as Role
  })

  const [lgas, setLgas] = useState<LGA[]>([])
  const [statuses, setStatuses] = useState<Status[]>([])
  const [ranks, setRanks] = useState<Rank[]>([])
  const [qualifications, setQualifications] = useState<any[]>([])
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [approvedChangeRequest, setApprovedChangeRequest] = useState<ChangeRequest | null>(null)
  const [hasApprovedRequest, setHasApprovedRequest] = useState(false)

  const isAdmin = currentUserRole && ['ADMIN', 'SECRETARY', 'CHAIRMAN'].includes(currentUserRole)

  // Get editable fields from approved change request
  const editableFields = approvedChangeRequest?.selectedFields || []

  // Check if a field is editable based on approved change request
  const isFieldEditable = (fieldName: string) => {
    if (!isEditing || !staffToEdit) return true // For new staff creation, all fields are editable
    if (!hasApprovedRequest) return false // If no approved request, no fields are editable
    return editableFields.includes(fieldName)
  }

  // Check if form should be disabled (no approved change request for editing)
  const isFormDisabled = Boolean(isEditing && staffToEdit && !hasApprovedRequest)

  useEffect(() => {
    if (open) {
      fetchLgas()
      fetchStatuses()
      fetchRanks()
      fetchQualifications()

      // Check for approved change requests if editing
      if (isEditing && staffToEdit) {
        fetchApprovedChangeRequest()
      } else {
        setHasApprovedRequest(true) // For new staff creation
      }

      if (isEditing && staffToEdit) {
        setFormData({
          name: staffToEdit.name || "",
          sex: staffToEdit.sex || "M",
          lgaId: staffToEdit.lga?.id || staffToEdit.lgaId || "",
          statusId: typeof staffToEdit.status === 'object' ? (staffToEdit.status as any).id : "",
          rankId: staffToEdit.rank && typeof staffToEdit.rank === 'object' ? (staffToEdit.rank as any).id : "",
          sgl: staffToEdit.sgl?.toString() || "",
          dateOfBirth: staffToEdit.dateOfBirth ? new Date(staffToEdit.dateOfBirth).toISOString().split('T')[0] : "",
          dateOfFirstAppt: staffToEdit.dateOfFirstAppt ? new Date(staffToEdit.dateOfFirstAppt).toISOString().split('T')[0] : "",
          dateOfConf: staffToEdit.dateOfConf ? new Date(staffToEdit.dateOfConf).toISOString().split('T')[0] : "",
          dateOfPresentAppt: staffToEdit.dateOfPresentAppt ? new Date(staffToEdit.dateOfPresentAppt).toISOString().split('T')[0] : "",
          phoneNumber: staffToEdit.phoneNumber || "",
          recommendedRetirementDate: staffToEdit.recommendedRetirementDate ? new Date(staffToEdit.recommendedRetirementDate).toISOString().split('T')[0] : "",
          remark: staffToEdit.remark || "",
          role: staffToEdit.role || "STAFF"
        })
        // Set current qualifications if not overridden by change request
        if (!approvedChangeRequest?.selectedFields.includes('qualifications')) {
          setSelectedQualifications((staffToEdit.qualifications as any[])?.map((q: any) => q.qualificationId || q.id) || [])
        }
      } else {
        setFormData({
          name: "",
          sex: "M",
          lgaId: initialLgaId || "",
          statusId: "",
          rankId: "",
          sgl: "",
          dateOfBirth: "",
          dateOfFirstAppt: "",
          dateOfConf: "",
          dateOfPresentAppt: "",
          phoneNumber: "",
          recommendedRetirementDate: "",
          remark: "",
          role: "STAFF"
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

          // If qualifications field is approved, set the new qualifications from the request
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

  const fetchLgas = async () => {
    try {
      const response = await fetch('/api/lgas')
      if (response.ok) {
        const data = await response.json()
        setLgas(data)
      }
    } catch (err) {
    }
  }

  const fetchStatuses = async () => {
    try {
      const response = await fetch('/api/status')
      if (response.ok) {
        const data = await response.json()
        setStatuses(data)
      }
    } catch (err) {
    }
  }

  const fetchRanks = async () => {
    try {
      const response = await fetch('/api/ranks')
      if (response.ok) {
        const data = await response.json()
        setRanks(data)
      }
    } catch (err) {
    }
  }

  const fetchQualifications = async () => {
    try {
      const response = await fetch('/api/qualifications')
      if (response.ok) {
        const data = await response.json()
        setQualifications(data)
      }
    } catch (err) {
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem('token')

      if (isEditing && staffToEdit) {
        // For editing, only send fields that are editable based on approved change request
        let updateData: any = { ...formData }
        if (approvedChangeRequest) {
          updateData = {}
          editableFields.forEach(field => {
            if (field === 'status') {
              updateData.statusId = formData.statusId
            } else if (field === 'rank') {
              updateData.rankId = formData.rankId
            } else {
              updateData[field] = formData[field]
            }
          })
        }

        const response = await fetch(`/api/staff/${staffToEdit.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...updateData,
            qualificationIds: isFieldEditable('qualifications') ? selectedQualifications : undefined,
            changeRequestId: approvedChangeRequest?.id // Mark change request as completed
          })
        })

        if (response.ok) {
          onSuccess()
          onClose()
        } else {
          const data = await response.json()
          setError(data.error || "Couldn't save your changes. Please try again.")
        }
      } else {
        // Create logic remains the same for new staff
        const formDataWithFile = new FormData()
        for (const key in formData) {
          formDataWithFile.append(key, (formData as any)[key])
        }
        selectedQualifications.forEach(qId => {
          formDataWithFile.append('qualificationIds[]', qId)
        })
        if (file) {
          formDataWithFile.append('file', file)
        }

        const response = await fetch('/api/staff', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataWithFile
        })

        if (response.ok) {
          onSuccess()
          onClose()
        } else {
          const data = await response.json()
          setError(data.error || "Couldn't save your changes. Please try again.")
        }
      }
    } catch (err) {
      setError("You appear to be offline. Please check your connection.")
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
            value={formData[fieldName] || ''}
            onChange={(e) => updateField(fieldName, e.target.value)}
            disabled={!editable}
            required={required && editable}
            className={!editable ? 'bg-muted cursor-not-allowed' : ''}
          />
        )}

        {type === 'number' && (
          <Input
            id={fieldName}
            type="number"
            value={formData[fieldName] || ''}
            onChange={(e) => updateField(fieldName, e.target.value)}
            disabled={!editable}
            required={required && editable}
            className={!editable ? 'bg-muted cursor-not-allowed' : ''}
          />
        )}

        {type === 'date' && (
          <Input
            id={fieldName}
            type="date"
            value={formData[fieldName] || ''}
            onChange={(e) => updateField(fieldName, e.target.value)}
            disabled={!editable}
            required={required && editable}
            className={!editable ? 'bg-muted cursor-not-allowed' : ''}
          />
        )}

        {type === 'select' && (
          <Select
            value={formData[fieldName]}
            onValueChange={(value) => updateField(fieldName, value)}
            disabled={!editable}
            required={required && editable}
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
            value={formData[fieldName] || ''}
            onChange={(e) => updateField(fieldName, e.target.value)}
            disabled={!editable}
            required={required && editable}
            className={!editable ? 'bg-muted cursor-not-allowed' : ''}
            rows={3}
          />
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
          onSubmit={handleSubmit}
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
                statuses.map(s => ({ value: s.id, label: s.name })), true
              )}
              {renderField('rankId', 'Rank', 'select',
                ranks.map(r => ({ value: r.id, label: r.name }))
              )}
              {renderField('sgl', 'SGL', 'number', undefined, true)}
              {/* Role is now forced to STAFF on creation and managed separately by Chairman */}
            </div>
          </div>

          {/* LGA Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Location</h3>
            {renderField('lgaId', 'LGA of Origin', 'select',
              lgas.map(lga => ({ value: lga.id, label: lga.name })), true
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
                  {qualifications.map((qual) => (
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
                {qualifications.map((qual) => (
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
