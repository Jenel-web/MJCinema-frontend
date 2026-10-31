import { useCallback, useEffect, useState } from 'react'
import { getMovieSchedules, type Schedule } from '../../api'

export type SchedulesState =
  | { status: 'loading' }
  | { status: 'ready'; schedules: Schedule[] }
  | { status: 'error' }

/** GET /schedule/movieSchedules/{movieId}, no headers. Runs when the modal opens for a Now Showing movie. */
export function useMovieSchedules(movieId: number | string, enabled: boolean) {
  const [state, setState] = useState<SchedulesState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await getMovieSchedules(movieId)
        if (cancelled) return
        if (!res.ok || !Array.isArray(res.data)) return setState({ status: 'error' })
        setState({ status: 'ready', schedules: res.data })
      } catch {
        if (!cancelled) setState({ status: 'error' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [movieId, enabled, attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { state, reload }
}
