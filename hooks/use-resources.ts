import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"

// --- Statuses ---
export function useStatuses() {
  return useQuery({
    queryKey: ["statuses"],
    queryFn: () => apiFetch<any[]>("/api/status"),
  })
}

export function useCreateStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/api/status", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Status created")
      qc.invalidateQueries({ queryKey: ["statuses"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useDeleteStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/status/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Status deleted")
      qc.invalidateQueries({ queryKey: ["statuses"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

// --- Ranks ---
export function useRanks() {
  return useQuery({
    queryKey: ["ranks"],
    queryFn: () => apiFetch<any[]>("/api/ranks"),
  })
}

export function useCreateRank() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/api/ranks", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Rank created")
      qc.invalidateQueries({ queryKey: ["ranks"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useDeleteRank() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/ranks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Rank deleted")
      qc.invalidateQueries({ queryKey: ["ranks"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

// --- Qualifications ---
export function useQualifications() {
  return useQuery({
    queryKey: ["qualifications"],
    queryFn: () => apiFetch<any[]>("/api/qualifications"),
  })
}

export function useCreateQualification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/api/qualifications", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Qualification created")
      qc.invalidateQueries({ queryKey: ["qualifications"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useDeleteQualification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/qualifications/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Qualification deleted")
      qc.invalidateQueries({ queryKey: ["qualifications"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

// --- Change Reasons ---
export function useChangeReasons() {
  return useQuery({
    queryKey: ["change-reasons"],
    queryFn: () => apiFetch<any[]>("/api/change-reasons"),
  })
}

export function useCreateChangeReason() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/api/change-reasons", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Change reason added")
      qc.invalidateQueries({ queryKey: ["change-reasons"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useUpdateChangeReason() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/api/change-reasons/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Change reason updated")
      qc.invalidateQueries({ queryKey: ["change-reasons"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

// --- Sanctions ---
export function useSanctions() {
  return useQuery({
    queryKey: ["sanctions"],
    queryFn: () => apiFetch<any[]>("/api/sanctions"),
  })
}

export function useCreateSanction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/api/sanctions", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Sanction added")
      qc.invalidateQueries({ queryKey: ["sanctions"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useUpdateSanction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/api/sanctions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Sanction updated")
      qc.invalidateQueries({ queryKey: ["sanctions"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useDeleteSanction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/sanctions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Sanction deleted")
      qc.invalidateQueries({ queryKey: ["sanctions"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

// --- Content ---
export function useContent() {
  return useQuery({
    queryKey: ["content"],
    queryFn: () => apiFetch<any[]>("/api/content"),
  })
}

export function useUpsertContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/api/content", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Content saved")
      qc.invalidateQueries({ queryKey: ["content"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

// --- Executives ---
export function useExecutives() {
  return useQuery({
    queryKey: ["executives"],
    queryFn: () => apiFetch<any[]>("/api/executives"),
  })
}

export function useCreateExecutive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: FormData) =>
      apiFetch("/api/executives", { method: "POST", body: data }),
    onSuccess: () => {
      toast.success("Executive added")
      qc.invalidateQueries({ queryKey: ["executives"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useUpdateExecutive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      apiFetch(`/api/executives/${id}`, { method: "PUT", body: data }),
    onSuccess: () => {
      toast.success("Executive updated")
      qc.invalidateQueries({ queryKey: ["executives"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useDeleteExecutive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/executives/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Executive deleted")
      qc.invalidateQueries({ queryKey: ["executives"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

// --- Highlights ---
export function useHighlights(type?: string) {
  return useQuery({
    queryKey: ["highlights", type],
    queryFn: () => {
      const params = type ? `?type=${type}` : ""
      return apiFetch<any[]>(`/api/highlights${params}`)
    },
  })
}

export function useCreateHighlight() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: FormData) =>
      apiFetch("/api/highlights", { method: "POST", body: data }),
    onSuccess: () => {
      toast.success("Highlight added")
      qc.invalidateQueries({ queryKey: ["highlights"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useUpdateHighlight() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      apiFetch(`/api/highlights/${id}`, { method: "PUT", body: data }),
    onSuccess: () => {
      toast.success("Highlight updated")
      qc.invalidateQueries({ queryKey: ["highlights"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useDeleteHighlight() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/highlights/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Highlight deleted")
      qc.invalidateQueries({ queryKey: ["highlights"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

// --- Logs ---
export function useLogs() {
  return useQuery({
    queryKey: ["logs"],
    queryFn: () => apiFetch<any[]>("/api/logs"),
  })
}

export function useApprovalLogs(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["approval-logs", params],
    queryFn: () => {
      const searchParams = new URLSearchParams()
      if (params?.limit) searchParams.set("limit", String(params.limit))
      if (params?.offset) searchParams.set("offset", String(params.offset))
      const qs = searchParams.toString()
      return apiFetch<{ data: any[]; total: number }>(`/api/approval-logs${qs ? `?${qs}` : ""}`)
    },
  })
}

// --- Settings ---
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<any[]>("/api/settings"),
  })
}

export function useUpsertSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/api/settings", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Setting saved")
      qc.invalidateQueries({ queryKey: ["settings"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

// --- Disciplinary ---
export function useDisciplinaryCases() {
  return useQuery({
    queryKey: ["disciplinary"],
    queryFn: () => apiFetch<any[]>("/api/disciplinary"),
  })
}

export function useCreateDisciplinaryCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/api/disciplinary", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Disciplinary case added")
      qc.invalidateQueries({ queryKey: ["disciplinary"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useUpdateDisciplinaryCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/api/disciplinary/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success("Disciplinary case updated")
      qc.invalidateQueries({ queryKey: ["disciplinary"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useDeleteDisciplinaryCase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/disciplinary/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Disciplinary case deleted")
      qc.invalidateQueries({ queryKey: ["disciplinary"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}
