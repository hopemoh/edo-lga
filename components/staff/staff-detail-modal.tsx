"use client"
import { useState, useEffect } from 'react'
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Mail, Briefcase, Award, Building2, BarChart3, Upload, FileEdit, FileText, ShieldCheck } from "lucide-react"
import type { Staff } from "@/lib/types"
import ChangeRequestModal from "../admin/change-request-modal"
import DocumentHistoryModal from "./document-history-modal"
import DataChangeHistoryModal from "./data-change-history-modal"
import RoleAssignmentModal from "../admin/role-assignment-modal"

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
  const [pendingDataRequest, setPendingDataRequest] = useState<any | null>(null)
  const [pendingDocumentRequest, setPendingDocumentRequest] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)


  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("currentUser") || "null") : null
    if (user) {
      setCurrentUser(user)
      setIsAdmin(['ADMIN', 'SECRETARY', 'CHAIRMAN'].includes(user.role?.toUpperCase()))
    }
  }, [])

  // Fetch presigned URL for document viewing
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
      // Fetch pending requests (fetch all to determine if any are in progress)
      const requestsResponse = await fetch(`/api/change-requests?staffId=${staff.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (requestsResponse.ok) {
        const requests = await requestsResponse.json();

        // A request is considered pending if it's not completed, rejected, or fully approved by chairman
        const isPending = (status: string) => {
          const s = status.toUpperCase();
          return !['COMPLETED', 'REJECTED', 'CHAIRMAN_APPROVED'].includes(s);
        };

        setPendingDataRequest(requests.find((req: any) => req.type === 'DATA' && isPending(req.status)) || null);
        setPendingDocumentRequest(requests.find((req: any) => req.type === 'DOCUMENT' && isPending(req.status)) || null);
      }

      // Check document replacement eligibility
      if (staff.documentUrl) {
        const replacementResponse = await fetch(`/api/staff/${staff.id}/document/check-replacement`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (replacementResponse.ok) {
          const data = await replacementResponse.json();
          setCanReplace(data.canReplace);
        }
      } else {
        setCanReplace(true); // Can always upload if no document exists
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  // Check document replacement eligibility on component mount
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

    // Check if replacement is allowed
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
        // Reset the file input
        event.target.value = '';
        // Update the staff state with new document URL
        if (onUpdate && result.staff) {
          onUpdate(result.staff);
        }
        // Close modal to show updated data
        onClose();
      } else {
        const error = await response.json();
        setUploadError(error.error || "Couldn't save your changes. Please try again.");
      }
    } catch (error) {
      setUploadError("You appear to be offline. Please check your connection.");
    } finally {
      setUploading(false);
      // Reset the file input
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto border-primary/20 bg-card">
          {/* Header */}
          <div className="sticky top-0 bg-linear-to-r from-primary/10 to-accent/10 px-6 py-6 border-b border-primary/20 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{staff.name}</h2>
              <p className="text-primary font-semibold mt-1">{typeof staff.rank === 'object' ? staff.rank?.name : staff.rank || 'N/A'}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Contact Information */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
            </motion.div>

            {/* Employment Details */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Employment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{typeof staff.status === 'object' ? staff.status.name : staff.status || "N/A"}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium text-sm">{typeof staff.rank === 'object' ? staff.rank?.name : staff.rank || "N/A"}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Join Date</p>
                  <p className="font-medium">{staff.dateOfFirstAppt ? new Date(staff.dateOfFirstAppt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </motion.div>

            {/* Certifications */}
            {staff.certifications && staff.certifications.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Certifications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {staff.certifications.map((cert, idx) => (
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + idx * 0.05 }}
                      className="bg-linear-to-r from-primary/20 to-accent/20 text-primary font-medium px-4 py-2 rounded-full text-sm"
                    >
                      {cert}
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            )}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
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
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-destructive mt-2"
                >
                  {uploadError}
                </motion.p>
              )}
            </motion.div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border/50 bg-muted/5 flex justify-between gap-2">
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
      </motion.div>

      {/* Change Request Modal */}
      <ChangeRequestModal
        open={showChangeRequest}
        onClose={() => setShowChangeRequest(false)}
        staff={staff}
        initialSelectedFields={initialSelectedFields}
        onSuccess={() => {
          fetchRequestStatus(); // Refetch status after creating a request
        }}
      />

      <DocumentHistoryModal
        open={showDocumentHistory}
        onClose={() => setShowDocumentHistory(false)}
        staff={staff}
      />

      {/* Data History Modal */}
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
