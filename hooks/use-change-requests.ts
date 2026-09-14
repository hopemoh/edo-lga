import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"

export function useChangeRequests(params?: { staffId?: string; status?: string }) {
  const searchParams = new URLSearchParams()
  if (params?.staffId) searchParams.set("staffId", params.staffId)
  if (params?.status) searchParams.set("status", params.status)
  const qs = searchParams.toString()

  return useQuery({
    queryKey: ["change-requests", params],
    queryFn: () => apiFetch<any[]>(`/api/change-requests${qs ? `?${qs}` : ""}`),
  })
}

export function useCreateChangeRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/api/change-requests", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("Change request created")
      qc.invalidateQueries({ queryKey: ["change-requests"] })
    },
    onError: (error: any) => {
      const msg = error?.message?.includes("Only administrators")
        ? error.message
        : "Couldn't save your changes. Please try again."
      toast.error(msg)
    },
  })
}

export function useApproveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) =>
      apiFetch(`/api/change-requests/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ comments }),
      }),
    onSuccess: () => {
      toast.success("Request approved")
      qc.invalidateQueries({ queryKey: ["change-requests"] })
      qc.invalidateQueries({ queryKey: ["approval-logs"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useRejectRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch(`/api/change-requests/${id}/approve`, {
        method: "PUT",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      toast.success("Request rejected")
      qc.invalidateQueries({ queryKey: ["change-requests"] })
      qc.invalidateQueries({ queryKey: ["approval-logs"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useCorrectRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, changes, reason }: { id: string; changes: any; reason: string }) =>
      apiFetch(`/api/change-requests/${id}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ changes, reason }),
      }),
    onSuccess: () => {
      toast.success("Request corrected")
      qc.invalidateQueries({ queryKey: ["change-requests"] })
      qc.invalidateQueries({ queryKey: ["staff"] })
      qc.invalidateQueries({ queryKey: ["approval-logs"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useChangeRequestAudit(id: string) {
  return useQuery({
    queryKey: ["change-request-audit", id],
    queryFn: () => apiFetch<{ approvalLogs: any[]; auditLogs: any[] }>(`/api/change-requests/${id}/audit`),
    enabled: !!id,
  })
}
