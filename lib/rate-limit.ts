const hits = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const record = hits.get(key)

  if (!record || now > record.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

// Cleanup old entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of hits.entries()) {
      if (now > record.resetAt) hits.delete(key)
    }
  }, 5 * 60 * 1000)
}
