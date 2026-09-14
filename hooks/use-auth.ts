import { useMutation } from "@tanstack/react-query"
import { apiFetch, ApiError } from "@/lib/api"
import { useAuthStore } from "@/lib/store"

interface LoginResponse {
  token: string
  user: {
    id: string
    name: string
    role: string
    lgaId?: string
    lgaName?: string
    phoneNumber?: string
    statusId?: string
  }
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)

  return useMutation({
    mutationFn: async (data: { phoneNumber: string; dateOfBirth: string }) => {
      const res = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      })
      return res
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token)
    },
  })
}
