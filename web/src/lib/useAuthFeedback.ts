import { useCallback, useEffect, useState } from 'react'

/** Legacy timings (ui.js): error banner auto-hides after 3s; the card shakes for 400ms. */
export const BANNER_MS = 3000
export const SHAKE_MS = 400
/** Render free tier cold start: explain a slow request after this long. */
export const SLOW_HINT_MS = 4000

interface FeedbackError {
  message: string
}

/**
 * Error banner + card shake used by Login and Register.
 * showError() displays the banner and shakes the card; the banner hides itself after 3s.
 * Calling it again restarts both timers.
 */
export function useAuthFeedback() {
  const [error, setError] = useState<FeedbackError | null>(null)
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    if (!error) return
    const hide = setTimeout(() => setError(null), BANNER_MS)
    return () => clearTimeout(hide)
  }, [error])

  useEffect(() => {
    if (!shaking) return
    const stop = setTimeout(() => setShaking(false), SHAKE_MS)
    return () => clearTimeout(stop)
  }, [shaking])

  const showError = useCallback((message: string) => {
    setError({ message })
    setShaking(true)
  }, [])
  const clearError = useCallback(() => setError(null), [])

  return { error: error?.message ?? null, shaking, showError, clearError }
}

/** True once `active` has been true for `ms` (e.g. a request still pending after 4s). */
export function useSlowHint(active: boolean, ms: number = SLOW_HINT_MS): boolean {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => setSlow(true), ms)
    return () => {
      clearTimeout(timer)
      setSlow(false)
    }
  }, [active, ms])

  return active && slow
}
