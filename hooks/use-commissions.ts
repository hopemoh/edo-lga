import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { Staff } from "@/lib/types"

export interface Commission {
  id: string
  name: string
  zone: string
  kind?: "LGA" | "COMMISSION"
  staffCount?: number
  details?: {
    image?: string | null
    description?: string
    landmarks?: string[]
    activities?: string[]
  } | null
}

export function useCommissions() {
  return useQuery({
    queryKey: ["lgas", "COMMISSION"],
    queryFn: () => apiFetch<Commission[]>("/api/lgas?kind=COMMISSION"),
  })
}

export function useCommission(id: string) {
  return useQuery({
    queryKey: ["lgas", "COMMISSION", id],
    queryFn: () => apiFetch<Commission>(`/api/lgas/${id}`),
    enabled: !!id,
  })
}

export function useCommissionStaff(id: string) {
  return useQuery({
    queryKey: ["staff", "commission", id],
    queryFn: () => apiFetch<Staff[]>(`/api/staff?commissionId=${id}`),
    enabled: !!id,
  })
}

export function useCreateCommission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: FormData) =>
      apiFetch<Commission>("/api/lgas", { method: "POST", body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lgas"] })
    },
  })
}

export function useUpdateCommission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      apiFetch<Commission>(`/api/lgas/${id}`, { method: "PUT", body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lgas"] })
    },
  })
}

export function useDeleteCommission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/lgas/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lgas"] })
      qc.invalidateQueries({ queryKey: ["staff"] })
    },
  })
}
