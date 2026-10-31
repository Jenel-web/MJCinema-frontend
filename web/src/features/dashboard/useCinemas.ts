import { useCallback, useEffect, useState } from 'react'
import { getCinemaMovies, getCinemas, type Cinema, type Movie } from '../../api'
import type { LoadErrorReason } from '../../store/movies-context'

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; reason: LoadErrorReason }

/** GET /cinema/all (no headers, as legacy). Lives in CinemaView, so "Back to cinemas" does not refetch. */
export function useCinemas() {
  const [state, setState] = useState<LoadState<Cinema[]>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await getCinemas()
        if (cancelled) return
        if (!res.ok) return setState({ status: 'error', reason: 'http' })
        if (!Array.isArray(res.data)) return setState({ status: 'error', reason: 'format' })
        setState({ status: 'ready', data: res.data })
      } catch {
        if (!cancelled) setState({ status: 'error', reason: 'offline' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { state, reload }
}

/** GET /cinema/movies/{cinemaId} (no headers). Fetched every time a cinema is opened, like legacy. */
export function useCinemaMovies(cinemaId: number | string) {
  const [state, setState] = useState<LoadState<Movie[]>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await getCinemaMovies(cinemaId)
        if (cancelled) return
        if (!res.ok) return setState({ status: 'error', reason: 'http' })
        if (!Array.isArray(res.data)) return setState({ status: 'error', reason: 'format' })
        setState({ status: 'ready', data: res.data })
      } catch {
        if (!cancelled) setState({ status: 'error', reason: 'offline' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [cinemaId, attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { state, reload }
}
