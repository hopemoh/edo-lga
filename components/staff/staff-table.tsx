"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Staff } from "@/lib/types"
import { Edit2, Eye } from "lucide-react"
import StaffDetailModal from "./staff-detail-modal"

interface StaffTableProps {
  staff: Staff[]
  onUpdate: (staff: Staff) => void
  onEdit: (staff: Staff) => void
  isAdmin?: boolean
  currentUser?: any
}

export default function StaffTable({ staff, onUpdate, onEdit, isAdmin = false, currentUser }: StaffTableProps) {
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)

  const formatDate = (date: Date) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    if (isNaN(d.getTime())) return 'N/A'
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}-${month}-${year}`
  }

  return (
    <>
      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">S/N</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Sex</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Rank</th>
                <th className="px-4 py-3 text-left font-medium">Qualifications</th>
                <th className="px-4 py-3 text-left font-medium">SGL</th>
                {/* <th className="px-4 py-3 text-left font-medium">DATE OF BIRTH</th> */}
                <th className="px-4 py-3 text-left font-medium">DATE OF 1ST APPT</th>
                <th className="px-4 py-3 text-left font-medium">DATE OF CONF</th>
                <th className="px-4 py-3 text-left font-medium">Pre Appt</th>
                <th className="px-4 py-3 text-left font-medium">LGA Origin</th>
                {/* <th className="px-4 py-3 text-left font-medium">Phone</th> */}
                <th className="px-4 py-3 text-left font-medium">Remark</th>
                <th className="px-4 py-3 text-left font-medium">Retirement</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s, index) => (
                <tr key={s.id} className="border-b border-border/30 hover:bg-secondary/5 transition-colors">
                    <td className="px-4 py-3 text-center font-medium text-muted-foreground">{s.serialNumber}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{s.name}</td>
                    <td className="px-4 py-3">{s.sex}</td>
                    <td className="px-4 py-3">{(s.status as any)?.name || s.status}</td>
                    <td className="px-4 py-3">{s.rank?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-xs">
                      {(s.qualifications as any)?.length > 0
                        ? (s.qualifications as any).map((q: any) => q.qualification?.name || q.name).join(', ')
                        : 'N/A'
                      }
                    </td>
                    <td className="px-4 py-3">{s.sgl}</td>
                    {/* <td className="px-4 py-3 whitespace-nowrap">{formatDate(s.dateOfBirth)}</td> */}
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(s.dateOfFirstAppt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(s.dateOfConf)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(s.dateOfPresentAppt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{s.lga?.name || s.lgaOfOrigin}</td>
                    {/* <td className="px-4 py-3">{s.phoneNumber}</td> */}
                    <td className="px-4 py-3 text-xs max-w-[150px] truncate">{s.remark || 'N/A'}</td>
                    <td className="px-4 py-3">{formatDate(s.recommendedRetirementDate)}</td>
                    <td className="px-4 py-3 flex gap-2">
                      {isAdmin ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedStaff(s)}
                          className="text-blue-600 hover:bg-blue-50"
                          title="View & Edit details"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View & Edit
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedStaff(s)}
                          disabled={s.phoneNumber !== (currentUser?.phoneNumber || currentUser?.phone)}
                          className={s.phoneNumber === (currentUser?.phoneNumber || currentUser?.phone)
                            ? "text-blue-600 hover:bg-blue-50"
                            : "opacity-50 cursor-not-allowed"}
                          title={s.phoneNumber === (currentUser?.phoneNumber || currentUser?.phone) ? "View your profile" : "Restricted access"}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Profile
                        </Button>
                      )}
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedStaff && (
        <StaffDetailModal
          staff={selectedStaff}
          onClose={() => setSelectedStaff(null)}
          onUpdate={(updatedStaff) => {
            onUpdate(updatedStaff);
            setSelectedStaff(updatedStaff);
          }}
          onEdit={onEdit}
        />
      )}
    </>
  )
}
