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
  setAuth: (user: User, token: string) => void
  logout: () => void
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem("token", token)
    localStorage.setItem("currentUser", JSON.stringify(user))
    set({ user, token })
  },
  logout: () => {
    localStorage.removeItem("token")
    localStorage.removeItem("currentUser")
    set({ user: null, token: null })
  },
  isAdmin: () => {
    const { user } = get()
    return user ? ["ADMIN", "SECRETARY", "CHAIRMAN"].includes(user.role.toUpperCase()) : false
  },
}))

export function initAuthFromStorage() {
  if (typeof window === "undefined") return
  const token = localStorage.getItem("token")
  const userStr = localStorage.getItem("currentUser")
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr)
      useAuthStore.getState().setAuth(user, token)
    } catch {}
  }
}
