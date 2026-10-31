import { useContext } from 'react'
import { MoviesContext, type MoviesStore } from './movies-context'

export function useMovies(): MoviesStore {
  const ctx = useContext(MoviesContext)
  if (!ctx) throw new Error('useMovies must be used inside <MoviesProvider>')
  return ctx
}
