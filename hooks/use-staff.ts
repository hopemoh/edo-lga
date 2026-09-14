import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"

export function useStaff(lgaId?: string) {
  return useQuery({
    queryKey: ["staff", lgaId],
    queryFn: () => {
      const params = lgaId ? `?lgaId=${lgaId}` : ""
      return apiFetch<any[]>(`/api/staff${params}`)
    },
  })
}

export function useStaffMember(id: string) {
  return useQuery({
    queryKey: ["staff", id],
    queryFn: () => apiFetch<any>(`/api/staff/${id}`),
    enabled: !!id,
  })
}

export function useCreateStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/api/staff", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("Staff record created")
      qc.invalidateQueries({ queryKey: ["staff"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useUpdateStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/api/staff/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("Staff record updated")
      qc.invalidateQueries({ queryKey: ["staff"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useUploadDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      apiFetch(`/api/staff/${id}/document`, {
        method: "POST",
        body: formData,
      }),
    onSuccess: () => {
      toast.success("Document uploaded")
      qc.invalidateQueries({ queryKey: ["staff"] })
    },
    onError: () => {
      toast.error("Couldn't save your changes. Please try again.")
    },
  })
}

export function useBulkImport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiFetch("/api/staff/bulk", {
        method: "POST",
        body: formData,
      }),
    onSuccess: () => {
      toast.success("Import completed")
      qc.invalidateQueries({ queryKey: ["staff"] })
    },
    onError: () => {
      toast.error("Import failed. Please try again.")
    },
  })
}

export function useBulkUpdate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiFetch("/api/staff/bulk", {
        method: "PUT",
        body: formData,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] })
    },
    onError: () => {
      toast.error("Update failed. Please try again.")
    },
  })
}
