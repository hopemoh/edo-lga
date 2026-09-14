import { useAuthStore } from "./store"

const API_BASE = ""

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

let isRefreshing = false
let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        credentials: "same-origin",
      })
      if (!res.ok) throw new Error("Refresh failed")
      const data = await res.json()
      const newToken = data.token
      useAuthStore.getState().setAuth(useAuthStore.getState().user!, newToken)
      return newToken
    } catch {
      useAuthStore.getState().logout()
      throw new Error("Session expired")
    } finally {
      refreshPromise = null
      isRefreshing = false
    }
  })()

  return refreshPromise
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  if (
    options.body &&
    typeof options.body === "string" &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json"
  }

  let res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401 && token && !path.includes("/api/auth/")) {
    try {
      const newToken = await refreshAccessToken()
      headers["Authorization"] = `Bearer ${newToken}`
      res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      })
    } catch {
      // Refresh failed — let the 401 propagate
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "Request failed" }))
    throw new ApiError(data.error || "Request failed", res.status)
  }

  return res.json()
}
