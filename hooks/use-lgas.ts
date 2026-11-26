import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

export function useLGAs() {
  return useQuery({
    queryKey: ["lgas", "LGA"],
    queryFn: () => apiFetch<any[]>("/api/lgas"),
  })
}

export function useLGA(id: string) {
  return useQuery({
    queryKey: ["lgas", id],
    queryFn: () => apiFetch<any>(`/api/lgas/${id}`),
    enabled: !!id,
  })
}

export function useCreateLGA() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: FormData) =>
      apiFetch("/api/lgas", { method: "POST", body: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lgas"] })
    },
  })
}

export function useUpdateLGA() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      apiFetch(`/api/lgas/${id}`, {
        method: "PUT",
        body: data,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lgas"] })
    },
  })
}
