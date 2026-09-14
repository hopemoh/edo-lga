"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Upload } from "lucide-react"
import { motion } from "framer-motion"
import type { Staff } from "@/lib/types"
import { useChangeReasons, useRanks, useStatuses, useQualifications } from "@/hooks/use-resources"
import { useCreateChangeRequest } from "@/hooks/use-change-requests"

interface ChangeRequestModalProps {
  open: boolean
  onClose: () => void
  staff: Staff
  requestType?: 'data' | 'document'
  onSuccess: () => void
  isNewDocument?: boolean
  initialSelectedFields?: string[]
}

interface FieldOption {
  key: string
  label: string
  type: 'text' | 'select' | 'date'
  options?: string[]
}

const AVAILABLE_FIELDS: FieldOption[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'phoneNumber', label: 'Phone Number', type: 'text' },
  { key: 'sex', label: 'Sex', type: 'select', options: ['Male', 'Female'] },
  { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
  { key: 'dateOfFirstAppt', label: 'Date of First Appointment', type: 'date' },
  { key: 'dateOfConf', label: 'Date of Confirmation', type: 'date' },
  { key: 'dateOfPresentAppt', label: 'Date of Present Appointment', type: 'date' },
  { key: 'sgl', label: 'SGL', type: 'text' },
  { key: 'recommendedRetirementDate', label: 'Recommended Retirement Date', type: 'date' },
  { key: 'rank', label: 'Rank', type: 'select' },
  { key: 'status', label: 'Status', type: 'select' },
  { key: 'qualifications', label: 'Qualifications', type: 'select' },
  { key: 'remark', label: 'Remark', type: 'text' },
  { key: 'documentUrl', label: 'Document (Credential)', type: 'text' },
]

export default function ChangeRequestModal({
  open,
  onClose,
  staff,
  onSuccess,
  initialSelectedFields = []
}: ChangeRequestModalProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [customReason, setCustomReason] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [supportingDocument, setSupportingDocument] = useState<File | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [selectedQualifications, setSelectedQualifications] = useState<string[]>([])
  const [error, setError] = useState("")

  const { data: reasons = [] } = useChangeReasons()
  const { data: ranks = [] } = useRanks()
  const { data: statuses = [] } = useStatuses()
  const { data: qualifications = [] } = useQualifications()
  const createMutation = useCreateChangeRequest()

  const selectedReasonData = reasons.find((r: any) => r.id === selectedReason)
  const requiresDocument = selectedReasonData?.requiresDocument || selectedFields.includes('qualifications')

  useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open, staff])

  const resetForm = () => {
    setSelectedFields(initialSelectedFields)
    setSelectedReason('')
    setCustomReason('')
    setAdminNote('')
    setSupportingDocument(null)
    setSelectedQualifications((staff.qualifications as any)?.map((q: any) => q.qualificationId || q.id) || [])
    setFormData({
      name: staff.name,
      phoneNumber: staff.phoneNumber,
      sex: staff.sex,
      dateOfBirth: staff.dateOfBirth ? new Date(staff.dateOfBirth).toISOString().split('T')[0] : '',
      dateOfFirstAppt: staff.dateOfFirstAppt ? new Date(staff.dateOfFirstAppt).toISOString().split('T')[0] : '',
      dateOfConf: staff.dateOfConf ? new Date(staff.dateOfConf).toISOString().split('T')[0] : '',
      dateOfPresentAppt: staff.dateOfPresentAppt ? new Date(staff.dateOfPresentAppt).toISOString().split('T')[0] : '',
      sgl: staff.sgl,
      recommendedRetirementDate: staff.recommendedRetirementDate ? new Date(staff.recommendedRetirementDate).toISOString().split('T')[0] : '',
      rank: typeof staff.rank === 'object' ? staff.rank?.name : staff.rank,
      status: typeof staff.status === 'object' ? staff.status?.name : staff.status,
      remark: staff.remark || '',
    })
    setError("")
  }

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldKey)
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey]
    )
  }

  const handleFormDataChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed for supporting documents')
        return
      }
      setSupportingDocument(file)
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedFields.length === 0) {
      setError("Please select at least one field to change")
      return
    }

    if (!selectedReason) {
      setError("Please select a reason for the change")
      return
    }

    if ((requiresDocument) && !supportingDocument) {
      setError("This reason requires a supporting document (e.g., letter, certificate)")
      return
    }

    if (!customReason.trim()) {
      setError("Please provide additional details about the change")
      return
    }

    setError("")

    // Prepare changes object
    const changes: any = {}
    selectedFields.forEach(field => {
      if (field === 'qualifications') {
        changes[field] = selectedQualifications
      } else {
        changes[field] = formData[field]
      }
    })

    // Upload supporting document if provided (raw fetch for one-off file upload)
    let supportingDocumentUrl = null
    if (supportingDocument) {
      try {
        const token = localStorage.getItem('token')
        const formDataUpload = new FormData()
        formDataUpload.append('file', supportingDocument)

        const uploadResponse = await fetch('/api/documents/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formDataUpload
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          supportingDocumentUrl = uploadResult.url
        } else {
          throw new Error("Couldn't save your changes. Please try again.")
        }
      } catch {
        setError("Couldn't upload supporting document. Please try again.")
        return
      }
    }

    if (selectedFields.includes('documentUrl')) {
      changes.documentUrl = "PENDING_UPDATE"
    }

    const isOnlyDocument = selectedFields.length === 1 && selectedFields[0] === 'documentUrl'
    const finalRequestType = isOnlyDocument ? 'DOCUMENT' : 'DATA'

    createMutation.mutate(
      {
        staffId: staff.id,
        changes,
        selectedFields: selectedFields.length > 0 ? selectedFields : undefined,
        reasonId: selectedReason || undefined,
        reason: customReason,
        adminNote: adminNote.trim() || undefined,
        supportingDocumentUrl: supportingDocumentUrl || undefined,
        type: finalRequestType,
        isNewDocument: false
      },
      {
        onSuccess: () => {
          onSuccess()
          onClose()
          resetForm()
        },
        onError: (err: any) => {
          setError(err.message || "Couldn't save your changes. Please try again.")
        },
      }
    )
  }

  const getOriginalValue = (field: string) => {
    switch (field) {
      case 'name': return staff.name
      case 'phoneNumber': return staff.phoneNumber
      case 'sex': return staff.sex
      case 'documentUrl': return staff.documentUrl ? 'Document Exists' : 'No Document'
      case 'dateOfBirth': return staff.dateOfBirth ? new Date(staff.dateOfBirth).toISOString().split('T')[0] : ''
      case 'dateOfFirstAppt': return staff.dateOfFirstAppt ? new Date(staff.dateOfFirstAppt).toISOString().split('T')[0] : ''
      case 'dateOfConf': return staff.dateOfConf ? new Date(staff.dateOfConf).toISOString().split('T')[0] : ''
      case 'dateOfPresentAppt': return staff.dateOfPresentAppt ? new Date(staff.dateOfPresentAppt).toISOString().split('T')[0] : ''
      case 'sgl': return staff.sgl
      case 'recommendedRetirementDate': return staff.recommendedRetirementDate ? new Date(staff.recommendedRetirementDate).toISOString().split('T')[0] : ''
      case 'rank': return typeof staff.rank === 'object' ? staff.rank?.name : staff.rank
      case 'status': return typeof staff.status === 'object' ? staff.status?.name : staff.status
      case 'remark': return staff.remark || ''
      default: return ''
    }
  }

  const renderFieldInput = (field: FieldOption) => {
    if (!selectedFields.includes(field.key)) return null

    const isDisabled = true

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={formData[field.key] || ''}
            disabled={isDisabled}
            className="bg-gray-100 cursor-not-allowed"
            placeholder="Current value (for reference)"
          />
        )
      case 'date':
        return (
          <Input
            type="date"
            value={formData[field.key] || ''}
            disabled={isDisabled}
            className="bg-gray-100 cursor-not-allowed"
          />
        )
      case 'select':
        if (field.key === 'rank') {
          return (
            <Input
              value={formData[field.key] || 'Not set'}
              disabled={isDisabled}
              className="bg-gray-100 cursor-not-allowed"
              placeholder="Current rank (for reference)"
            />
          )
        } else if (field.key === 'status') {
          return (
            <Input
              value={formData[field.key] || 'Not set'}
              disabled={isDisabled}
              className="bg-gray-100 cursor-not-allowed"
              placeholder="Current status (for reference)"
            />
          )
        } else if (field.key === 'qualifications') {
          return (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2 bg-gray-100">
                {qualifications.map((qual: any) => (
                  <label key={qual.id} className="flex items-center space-x-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={selectedQualifications.includes(qual.id)}
                      disabled={isDisabled}
                      className="w-4 h-4 rounded border-2 border-gray-400 cursor-not-allowed"
                    />
                    <span>{qual.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500">Current qualifications (for reference)</p>
            </div>
          )
        } else {
          return (
            <Input
              value={formData[field.key] || 'Not set'}
              disabled={isDisabled}
              className="bg-gray-100 cursor-not-allowed"
            />
          )
        }
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Process Change Request for {staff.name}
          </DialogTitle>
        </DialogHeader>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Information box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <div className="flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-blue-900">
                <p className="font-semibold">Admin Processing Change Request</p>
                <p className="text-xs mt-1">
                  You are processing a change request. Selected fields show current data for reference.
                  For "Document (Credential)", approval will enable the "Replace Document" button on the staff profile.
                  For other fields, approval allows you to update the data.
                </p>
              </div>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change *</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason for change" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((reason: any) => (
                  <SelectItem key={reason.id} value={reason.id}>
                    {reason.name} {reason.requiresDocument && '(Requires Document)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Supporting Document Upload (For reasons requiring proof) */}
          {requiresDocument && (
            <div className="space-y-2">
              <Label>Supporting Document * <span className="text-xs font-normal text-muted-foreground">(e.g. Letter, Certificate)</span></Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="supporting-doc-upload"
                />
                <div className="text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <Button asChild variant="outline" type="button">
                    <label htmlFor="supporting-doc-upload" className="cursor-pointer">
                      {supportingDocument ? supportingDocument.name : 'Upload Supporting Document (PDF)'}
                    </label>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Optional Supporting Document (Always available if user wants to add proof) */}
          {!requiresDocument && (
            <div className="space-y-2">
              <Label>Supporting Document <span className="text-xs font-normal text-muted-foreground">(Optional proof)</span></Label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="optional-doc-upload"
                />
                <Button asChild variant="outline" type="button" size="sm">
                  <label htmlFor="optional-doc-upload" className="cursor-pointer">
                    {supportingDocument ? supportingDocument.name : 'Upload File'}
                  </label>
                </Button>
                {supportingDocument && <span className="text-sm text-green-600">Attached</span>}
              </div>
            </div>
          )}

          {/* Field Selection */}
          <div className="space-y-4">
            <Label>Select Fields to Change *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.key}
                    checked={selectedFields.includes(field.key)}
                    onCheckedChange={() => handleFieldToggle(field.key)}
                  />
                  <Label htmlFor={field.key} className="text-sm font-normal">
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Fields Form */}
          {selectedFields.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Current Values (For Reference Only)</h3>
              <p className="text-xs text-gray-600 mb-4">
                These fields show the current data that will be changed. They are disabled for reference only.
                After approval, you can update these fields with the new data from the staff's letter.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_FIELDS.filter(field => selectedFields.includes(field.key)).map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={`field-${field.key}`}>{field.label}</Label>
                    {renderFieldInput(field)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Details */}
          <div className="space-y-2">
            <Label htmlFor="custom-reason">Additional Details *</Label>
            <Textarea
              id="custom-reason"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Provide additional details about the change request (reference the staff's letter)"
              rows={3}
            />
          </div>

          {/* Optional Admin Note */}
          <div className="space-y-2">
            <Label htmlFor="admin-note">Admin Note (Optional)</Label>
            <Textarea
              id="admin-note"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Optional note for Secretary and Chairman review"
              rows={2}
            />
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
            <Button type="submit" disabled={createMutation.isPending} className="flex-1">
              {createMutation.isPending ? "Processing..." : "Process Request"}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  )
}
