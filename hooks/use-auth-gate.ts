"use client"

import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/**
 * Reads the local auth flag without rendering a different tree on the server
 * and the first client pass. During hydration React uses the server snapshot
 * (false), then switches to the real client value once hydration finishes.
 */
export function useAuthenticated() {
  return useSyncExternalStore(
    subscribe,
    () =>
      typeof window !== "undefined" &&
      Boolean(window.localStorage.getItem("currentUser")) &&
      window.localStorage.getItem("mustChangePassword") !== "true",
    () => false
  )
}
