import { useCallback, useEffect, useState } from 'react'
import { getComingSoon, getNowShowing, type Movie } from '../../api'
import type { LoadErrorReason } from '../../store/movies-context'

export type ListState =
  | { status: 'loading' }
  | { status: 'ready'; movies: Movie[] }
  | { status: 'error'; reason: LoadErrorReason }

export type ListKind = 'now' | 'soon'

/**
 * GET /schedule/now-showing or GET /schedule/coming-soon (no headers, as legacy).
 * Fetches again every time the section mounts, like the legacy tab clicks did.
 * `enabled` lets Now Showing wait for GET /movie/show first.
 */
export function useMovieList(kind: ListKind, enabled = true) {
  const [state, setState] = useState<ListState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await (kind === 'now' ? getNowShowing() : getComingSoon())
        if (cancelled) return
        if (!res.ok) return setState({ status: 'error', reason: 'http' })
        if (!Array.isArray(res.data)) return setState({ status: 'error', reason: 'format' })
        setState({ status: 'ready', movies: res.data })
      } catch {
        if (!cancelled) setState({ status: 'error', reason: 'offline' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [kind, enabled, attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { state, reload }
}

/** Error copy: the design's offline line, plus the two legacy messages from the md. */
export function describeLoadError(reason: LoadErrorReason): string {
  if (reason === 'offline') return 'The server is offline. Check your connection and try again.'
  if (reason === 'format') return 'Unexpected data format from server.'
  return 'Failed to load movies.'
}
