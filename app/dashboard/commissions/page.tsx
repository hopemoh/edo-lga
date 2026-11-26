"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building2, Plus, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import dynamic from "next/dynamic"
import { SignedImage } from "@/components/ui/signed-image"
import { useCommissions } from "@/hooks/use-commissions"
import { useAuthStore } from "@/lib/store"

const LGAFormModal = dynamic(() => import("@/components/admin/lga-form-modal"), { ssr: false })

export default function CommissionsPage() {
  const router = useRouter()
  const [authenticated] = useState(() =>
    typeof window !== "undefined" &&
    Boolean(window.localStorage.getItem("currentUser")) &&
    window.localStorage.getItem("mustChangePassword") !== "true"
  )
  const [showCreate, setShowCreate] = useState(false)
  const canManage = useAuthStore((s) => s.isAdmin())

  const { data: rawCommissions = [], isLoading, isError, refetch } = useCommissions()
  const commissions = rawCommissions

  useEffect(() => {
    if (authenticated) return
    const mustChangePassword = typeof window !== "undefined"
      ? window.localStorage.getItem("mustChangePassword")
      : null
    router.push(mustChangePassword === "true" ? "/change-password" : "/login")
  }, [authenticated, router])

  if (!authenticated) return null

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight">Commissions</h1>
            <p className="text-sm text-muted-foreground">
              Profiles and staff records for the Edo State local government commissions.
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add commission
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3].map((n) => (
              <Card key={n} className="h-40 animate-pulse bg-muted/40" />
            ))}
          </div>
        )}

        {isError && !isLoading && (
          <Card className="p-8 text-center space-y-3">
            <p className="text-sm text-destructive">We could not load the commissions.</p>
            <Button variant="outline" onClick={() => refetch()}>Try again</Button>
          </Card>
        )}

        {!isLoading && !isError && commissions.length === 0 && (
          <Card className="p-12 text-center space-y-3">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">No commissions yet</p>
            <p className="text-sm text-muted-foreground">
              {canManage ? "Add a commission to get started." : "Check back once commissions have been added."}
            </p>
          </Card>
        )}

        {!isLoading && !isError && commissions.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {commissions.map((commission) => (
              <Link key={commission.id} href={`/dashboard/commissions/${commission.id}`} className="group">
                <Card className="h-full overflow-hidden transition-colors hover:border-primary/40">
                  <div className="h-32 w-full overflow-hidden bg-muted">
                    {commission.details?.image ? (
                      <SignedImage
                        src={commission.details.image}
                        alt={`${commission.name} image`}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Building2 className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-5">
                    <h2 className="font-semibold leading-tight">{commission.name}</h2>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{commission.zone || "Commission"}</Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {commission.staffCount ?? 0} staff
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <LGAFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => refetch()}
        kind="COMMISSION"
        canManage={canManage}
      />
    </main>
  )
}
