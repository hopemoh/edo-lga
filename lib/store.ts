import { create } from "zustand"

interface User {
  id: string
  name: string
  role: string
  lgaId?: string
  lgaName?: string
  phoneNumber?: string
  statusId?: string
}

interface AuthState {
  user: User | null
  token: string | null
  mustChangePassword: boolean
  setAuth: (user: User, token: string, mustChangePassword?: boolean) => void
  setMustChangePassword: (value: boolean) => void
  logout: () => void
  isAdmin: () => boolean
  isOfficeHolder: (name: "CHAIRMAN" | "SECRETARY") => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  mustChangePassword: false,
  setAuth: (user, token, mustChangePassword = false) => {
    localStorage.setItem("token", token)
    localStorage.setItem("currentUser", JSON.stringify(user))
    localStorage.setItem("mustChangePassword", JSON.stringify(mustChangePassword))
    set({ user, token, mustChangePassword })
  },
  setMustChangePassword: (value) => {
    localStorage.setItem("mustChangePassword", JSON.stringify(value))
    set({ mustChangePassword: value })
  },
  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("currentUser")
    localStorage.removeItem("mustChangePassword")
    document.cookie = "refresh_token=; path=/; max-age=0"
    set({ user: null, token: null, mustChangePassword: false })
  },
  isAdmin: () => {
    const { user } = get()
    if (!user) return false
    return ["ADMIN", "CHAIRMAN", "SECRETARY"].includes(user.role.toUpperCase())
  },
  isOfficeHolder: (name) => {
    const { user } = get()
    return user?.role.toUpperCase() === name
  },
}))

export function initAuthFromStorage() {
  if (typeof window === "undefined") return
  const token = localStorage.getItem("token")
  const userStr = localStorage.getItem("currentUser")
  const mustChangePasswordStr = localStorage.getItem("mustChangePassword")
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr)
      const mustChangePassword = mustChangePasswordStr === "true"
      useAuthStore.getState().setAuth(user, token, mustChangePassword)
    } catch {}
  }
}
