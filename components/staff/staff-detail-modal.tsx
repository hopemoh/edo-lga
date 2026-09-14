"use client"
import { useState, useEffect } from 'react'
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Mail, Briefcase, Award, Upload, FileEdit, FileText, ShieldCheck, Calendar, MapPin, Hash, User } from "lucide-react"
import type { Staff } from "@/lib/types"
import ChangeRequestModal from "../admin/change-request-modal"
import DocumentHistoryModal from "./document-history-modal"
import DataChangeHistoryModal from "./data-change-history-modal"
import RoleAssignmentModal from "../admin/role-assignment-modal"
import { useChangeRequests } from "@/hooks/use-change-requests"
import { useAuthStore } from "@/lib/store"
import { toast } from "sonner"

interface StaffDetailModalProps {
  staff: Staff
  onClose: () => void
  onUpdate?: (updatedStaff: Staff) => void
  onEdit?: (staff: Staff) => void
}

export default function StaffDetailModal({ staff, onClose, onUpdate, onEdit }: StaffDetailModalProps) {
  const [docPresignedUrl, setDocPresignedUrl] = useState<string>("");

  const handleOpen = async () => {
    if (docPresignedUrl) {
      window.open(docPresignedUrl, "_blank", "noopener,noreferrer");
    }
  };

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [showChangeRequest, setShowChangeRequest] = useState(false)
  const [showDocumentHistory, setShowDocumentHistory] = useState(false)
  const [showDataHistory, setShowDataHistory] = useState(false)
  const [showRoleAssignment, setShowRoleAssignment] = useState(false)
  const [initialSelectedFields, setInitialSelectedFields] = useState<string[]>([])
  const [canReplace, setCanReplace] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const currentUser = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore((s) => s.isAdmin())

  const { data: changeRequests } = useChangeRequests({ staffId: staff.id })

  const pendingDataRequest = changeRequests?.find((req: any) => req.type === 'DATA' && !['COMPLETED', 'REJECTED', 'CHAIRMAN_APPROVED'].includes(req.status.toUpperCase())) || null
  const pendingDocumentRequest = changeRequests?.find((req: any) => req.type === 'DOCUMENT' && !['COMPLETED', 'REJECTED', 'CHAIRMAN_APPROVED'].includes(req.status.toUpperCase())) || null

  const fetchDocumentUrl = async () => {
    if (!staff.documentUrl) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/staff/${staff.id}/document/view`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDocPresignedUrl(data.url);
      }
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchDocumentUrl();
  }, [staff.id, staff.documentUrl]);

  const fetchRequestStatus = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      if (staff.documentUrl) {
        const replacementResponse = await fetch(`/api/staff/${staff.id}/document/check-replacement`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (replacementResponse.ok) {
          const data = await replacementResponse.json();
          setCanReplace(data.canReplace);
        }
      } else {
        setCanReplace(true);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestStatus();
  }, [staff.id])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed');
      return;
    }

    if (staff.documentUrl && !canReplace) {
      setUploadError('Document can only be replaced within 30 minutes of upload. Please submit a change request instead.');
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/staff/${staff.id}/document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        event.target.value = '';
        if (onUpdate && result.staff) {
          onUpdate(result.staff);
        }
        onClose();
      } else {
        const error = await response.json();
        setUploadError(error.error || "Couldn't save your changes. Please try again.");
      }
    } catch (error) {
      setUploadError("You appear to be offline. Please check your connection.");
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="relative w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border-primary/20 bg-card">
          {/* Fixed X button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 h-8 w-8 p-0 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Staff Name & Role Header */}
            <div className="pr-10">
              <h2 className="text-2xl font-bold text-foreground">{staff.name}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-primary font-semibold">
                  {typeof staff.rank === 'object' ? staff.rank?.name : staff.rank || 'N/A'}
                </span>
                {staff.lgaId && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {typeof staff.lga === 'object' ? staff.lga?.name : staff.lgaId}
                  </span>
                )}
              </div>
            </div>

            {/* Overview Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Hash className="w-3 h-3" /> Serial No.</p>
                <p className="font-medium text-sm">{(staff as any).serialNumber || 'N/A'}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><User className="w-3 h-3" /> Sex</p>
                <p className="font-medium text-sm">{staff.sex || 'N/A'}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Briefcase className="w-3 h-3" /> Status</p>
                <p className="font-medium text-sm">{typeof staff.status === 'object' ? staff.status.name : staff.status || 'N/A'}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Award className="w-3 h-3" /> SGL</p>
                <p className="font-medium text-sm">{(staff as any).sgl || 'N/A'}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{staff.phoneNumber}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Employment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Date of First Appointment</p>
                  <p className="font-medium">{staff.dateOfFirstAppt ? new Date(staff.dateOfFirstAppt).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Date of Confirmation</p>
                  <p className="font-medium">{staff.dateOfConf ? new Date(staff.dateOfConf).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Present Appointment</p>
                  <p className="font-medium">{staff.dateOfPresentAppt ? new Date(staff.dateOfPresentAppt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              {(staff as any).recommendedRetirementDate && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Recommended Retirement</p>
                    <p className="font-medium">{new Date((staff as any).recommendedRetirementDate).toLocaleDateString()}</p>
                  </div>
                  {(staff as any).yearsExperience != null && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Years of Experience</p>
                      <p className="font-medium">{(staff as any).yearsExperience} years</p>
                    </div>
                  )}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium">{staff.role || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Certifications */}
            {staff.certifications && staff.certifications.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Certifications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {staff.certifications.map((cert, idx) => (
                    <span
                      key={idx}
                      className="bg-primary/10 text-primary font-medium px-4 py-2 rounded-full text-sm"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Document */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Document</h3>
              {staff.documentUrl ? (
                <div className="space-y-4">
                  <div
                    className="relative w-full h-[400px] border rounded-lg overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition"
                    onClick={handleOpen}
                  >
                    {docPresignedUrl ? (
                      <embed
                        src={`${docPresignedUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        type="application/pdf"
                        width="100%"
                        height="100%"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-muted/30">
                        <p className="text-muted-foreground">Loading document...</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleOpen} variant="outline" className="flex-1" disabled={!docPresignedUrl}>
                      View Full Document
                    </Button>

                    {currentUser?.role === 'ADMIN' && (
                      <>
                        {canReplace ? (
                          <>
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="file-upload-replace"
                              disabled={uploading}
                              key={Date.now()}
                            />
                            <Button asChild variant="outline" disabled={uploading}>
                              <label htmlFor="file-upload-replace" className="cursor-pointer">
                                {uploading ? "Uploading..." : "Replace Document"}
                              </label>
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setInitialSelectedFields(['documentUrl'])
                              setShowChangeRequest(true)
                            }}
                            className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                            disabled={!!pendingDocumentRequest || isLoading}
                          >
                            {pendingDocumentRequest ? 'Document Change Pending' : 'Request Document Change'}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No document uploaded</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={uploading}
                  />
                  <Button asChild variant="outline" disabled={uploading}>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {uploading ? "Uploading..." : "Upload PDF Document"}
                    </label>
                  </Button>
                </div>
              )}
              {uploadError && (
                <p className="text-sm text-destructive mt-2">{uploadError}</p>
              )}
            </div>

            {/* Remarks */}
            {(staff as any).remark && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Remarks</h3>
                <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4">{(staff as any).remark}</p>
              </div>
            )}
          </div>

          {/* Fixed footer */}
          <div className="px-6 py-4 border-t border-border/50 bg-muted/5 flex justify-between gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setShowDocumentHistory(true)}
              className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
            >
              <FileText className="w-4 h-4 mr-2" />
              Document History
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDataHistory(true)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
            >
              <FileText className="w-4 h-4 mr-2" />
              Data History
            </Button>
            {currentUser?.role === 'CHAIRMAN' && (
              <Button
                variant="outline"
                onClick={() => setShowRoleAssignment(true)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Assign Role
              </Button>
            )}
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!isAdmin) {
                      toast.error("Only employees with ADMIN user role can create change requests.")
                      return
                    }
                    setInitialSelectedFields([])
                    setShowChangeRequest(true)
                  }}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  disabled={!!pendingDataRequest || isLoading}
                >
                  <FileEdit className="w-4 h-4 mr-2" />
                  {pendingDataRequest ? 'Data Change Pending' : 'Process Change Request'}
                </Button>
                {onEdit && (
                  <Button
                    variant="default"
                    onClick={() => {
                      onEdit(staff)
                      onClose()
                    }}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <FileEdit className="w-4 h-4 mr-2" />
                    Edit Staff
                  </Button>
                )}
              </>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </Card>
      </div>

      {/* Change Request Modal */}
      <ChangeRequestModal
        open={showChangeRequest}
        onClose={() => setShowChangeRequest(false)}
        staff={staff}
        initialSelectedFields={initialSelectedFields}
        onSuccess={() => {
          fetchRequestStatus();
        }}
      />

      <DocumentHistoryModal
        open={showDocumentHistory}
        onClose={() => setShowDocumentHistory(false)}
        staff={staff}
      />

      <DataChangeHistoryModal
        open={showDataHistory}
        onClose={() => setShowDataHistory(false)}
        staff={staff}
      />

      <RoleAssignmentModal
        open={showRoleAssignment}
        onClose={() => setShowRoleAssignment(false)}
        staff={staff}
        onSuccess={(updatedStaff) => {
          if (onUpdate) onUpdate(updatedStaff)
        }}
      />
    </>
  )
}
