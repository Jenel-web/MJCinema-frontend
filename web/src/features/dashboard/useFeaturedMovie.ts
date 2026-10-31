import { useEffect, useState } from 'react'
import { getMovieSchedules, type Movie } from '../../api'
import { scheduleStart } from '../../lib/format'

interface Pick {
  /** The list this pick was computed for (guards against showing a stale pick). */
  forMovies: Movie[]
  movie: Movie
}

/**
 * Featured (hero) movie: the Now Showing movie whose next schedule is the earliest.
 * No endpoint lists every schedule, so this asks GET /schedule/movieSchedules/{movieId}
 * once per movie (no headers, like the modal) and takes the smallest showDate + startTime
 * that has not started yet. Ties go to the earlier item of the list. If nothing has an
 * upcoming schedule (or every call fails) it falls back to the first movie.
 */
export function useFeaturedMovie(movies: Movie[] | undefined) {
  const [pick, setPick] = useState<Pick | null>(null)

  useEffect(() => {
    if (!movies || movies.length === 0) return
    let cancelled = false
    ;(async () => {
      const settled = await Promise.allSettled(movies.map((m) => getMovieSchedules(m.movieId)))
      if (cancelled) return
      const now = Date.now()
      let best: { movie: Movie; at: number } | null = null
      settled.forEach((result, i) => {
        if (result.status !== 'fulfilled' || !result.value.ok || !Array.isArray(result.value.data)) return
        for (const s of result.value.data) {
          const at = scheduleStart(s.showDate, s.startTime)
          if (at === null || at < now) continue
          if (!best || at < best.at) best = { movie: movies[i], at }
        }
      })
      setPick({ forMovies: movies, movie: (best as { movie: Movie } | null)?.movie ?? movies[0] })
    })()
    return () => {
      cancelled = true
    }
  }, [movies])

  const ready = !!movies && pick?.forMovies === movies
  return { status: ready ? ('ready' as const) : ('loading' as const), movie: ready ? pick.movie : undefined }
}
