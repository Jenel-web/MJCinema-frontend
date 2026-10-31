import { createContext } from 'react'
import type { Movie } from '../api'

/** Why a load failed: network down, non-OK response, or a body that is not a list. */
export type LoadErrorReason = 'offline' | 'http' | 'format'

export interface MoviesStore {
  /** Everything from GET /movie/show (replaces the legacy window.allMovies). */
  movies: Movie[]
  status: 'loading' | 'ready' | 'error'
  errorReason: LoadErrorReason | null
  reload: () => void
  /** Looks a movie up by id, like the legacy ClickedCardHandler did. */
  findMovie: (movieId: number | string) => Movie | undefined
}

export const MoviesContext = createContext<MoviesStore | null>(null)
