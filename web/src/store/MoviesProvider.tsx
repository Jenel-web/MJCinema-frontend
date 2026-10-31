import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getMovies } from '../api'
import { MoviesContext, type LoadErrorReason, type MoviesStore } from './movies-context'
import type { Movie } from '../api'

interface State {
  movies: Movie[]
  status: MoviesStore['status']
  errorReason: LoadErrorReason | null
}

/** Loads GET /movie/show once on mount (no headers, as legacy) and shares it with the dashboard. */
export function MoviesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ movies: [], status: 'loading', errorReason: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await getMovies()
        if (cancelled) return
        if (!res.ok) return setState({ movies: [], status: 'error', errorReason: 'http' })
        if (!Array.isArray(res.data)) return setState({ movies: [], status: 'error', errorReason: 'format' })
        setState({ movies: Array.from(res.data), status: 'ready', errorReason: null })
      } catch {
        if (!cancelled) setState({ movies: [], status: 'error', errorReason: 'offline' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [attempt])

  const reload = useCallback(() => {
    setState({ movies: [], status: 'loading', errorReason: null })
    setAttempt((n) => n + 1)
  }, [])

  const value = useMemo<MoviesStore>(
    () => ({
      ...state,
      reload,
      findMovie: (movieId) => state.movies.find((m) => Number(m.movieId) === Number(movieId)),
    }),
    [state, reload],
  )

  return <MoviesContext.Provider value={value}>{children}</MoviesContext.Provider>
}
