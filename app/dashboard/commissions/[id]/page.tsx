"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Building2, MapPin, Pencil, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SignedImage } from "@/components/ui/signed-image"
import RichTextDisplay from "@/components/ui/rich-text-display"
import StaffTable from "@/components/staff/staff-table"
import StaffFormModal from "@/components/admin/staff-form-modal"
import { useCommission, useCommissionStaff } from "@/hooks/use-commissions"
import { useAuthStore } from "@/lib/store"
import type { Staff } from "@/lib/types"

const LGAFormModal = dynamic(() => import("@/components/admin/lga-form-modal"), { ssr: false })

function StringList({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <li key={index} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function CommissionDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id
  const [authenticated] = useState(() =>
    typeof window !== "undefined" &&
    Boolean(window.localStorage.getItem("currentUser")) &&
    window.localStorage.getItem("mustChangePassword") !== "true"
  )
  const [showEdit, setShowEdit] = useState(false)
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null)
  const canManage = useAuthStore((s) => s.isAdmin())
  const userRole = useAuthStore((s) => s.user?.role) as
    | "STAFF" | "ADMIN" | "CHAIRMAN" | "SECRETARY" | undefined

  const { data: commission, isLoading, isError, refetch } = useCommission(id)
  const { data: staff = [], isLoading: staffLoading, isError: staffError, refetch: refetchStaff } = useCommissionStaff(id)

  useEffect(() => {
    if (authenticated) return
    const mustChangePassword = typeof window !== "undefined"
      ? window.localStorage.getItem("mustChangePassword")
      : null
    router.push(mustChangePassword === "true" ? "/change-password" : "/login")
  }, [authenticated, router])

  if (!authenticated) return null

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background p-6">
        <Card className="mx-auto max-w-5xl p-8">
          <div className="h-64 animate-pulse rounded bg-muted/40" />
        </Card>
      </main>
    )
  }

  if (isError || !commission) {
    return (
      <main className="min-h-screen bg-background p-6">
        <Card className="mx-auto max-w-5xl space-y-4 p-12 text-center">
          <Building2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium">This commission could not be loaded.</p>
          <p className="text-sm text-muted-foreground">It may have been removed or you may not have access.</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => refetch()}>Try again</Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard/commissions">All commissions</Link>
            </Button>
          </div>
        </Card>
      </main>
    )
  }

  const details = commission.details

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Link href="/dashboard/commissions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              All commissions
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">{commission.name}</h1>
              <Badge variant="secondary">{commission.zone || "Commission"}</Badge>
            </div>
          </div>
          {canManage && (
            <Button variant="outline" onClick={() => setShowEdit(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit profile
            </Button>
          )}
        </div>

        <Card className="overflow-hidden">
          {details?.image ? (
            <div className="h-56 w-full overflow-hidden bg-muted">
              <SignedImage src={details.image} alt={`${commission.name} image`} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center bg-muted/40">
              <MapPin className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
          <div className="space-y-5 p-6">
            <div>
              <h2 className="mb-2 text-lg font-semibold">About</h2>
              {details?.description ? (
                <RichTextDisplay content={details.description} className="text-sm text-muted-foreground" />
              ) : (
                <p className="text-sm text-muted-foreground">No profile description has been added yet.</p>
              )}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <StringList title="Landmarks" items={details?.landmarks || []} />
              <StringList title="Activities" items={details?.activities || []} />
            </div>
          </div>
        </Card>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Staff</h2>
            {!staffLoading && <Badge variant="outline">{staff.length}</Badge>}
          </div>

          {staffLoading && (
            <Card className="h-32 animate-pulse bg-muted/40" />
          )}

          {staffError && !staffLoading && (
            <Card className="p-6 text-center space-y-3">
              <p className="text-sm text-destructive">We could not load the staff list for this commission.</p>
              <Button variant="outline" onClick={() => refetchStaff()}>Try again</Button>
            </Card>
          )}

          {!staffLoading && !staffError && staff.length === 0 && (
            <Card className="p-10 text-center space-y-2">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">No staff assigned yet</p>
              <p className="text-sm text-muted-foreground">Staff assigned to this commission will appear here.</p>
            </Card>
          )}

          {!staffLoading && !staffError && staff.length > 0 && (
            <StaffTable
              staff={staff as Staff[]}
              onUpdate={() => refetchStaff()}
              onEdit={(person) => setStaffToEdit(person)}
              isAdmin={canManage}
            />
          )}
        </section>
      </div>

      <LGAFormModal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSuccess={() => refetch()}
        lgaId={id}
        kind="COMMISSION"
        canManage={canManage}
      />

      <StaffFormModal
        open={Boolean(staffToEdit)}
        onClose={() => setStaffToEdit(null)}
        onSuccess={() => refetchStaff()}
        staffToEdit={staffToEdit}
        isEditing
        currentUserRole={userRole}
      />
    </main>
  )
}
