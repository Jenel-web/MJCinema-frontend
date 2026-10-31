import type { Movie } from '../../api'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui'
import type { LoadErrorReason } from '../../store/movies-context'
import MovieCard from './MovieCard'
import type { ListState } from './useMovieList'
import { describeLoadError } from './useMovieList'
import type { MovieKind } from './types'

export const GRID_CLASS =
  'grid grid-cols-2 gap-x-3.5 gap-y-6 sm:grid-cols-3 md:grid-cols-4 md:gap-x-5 md:gap-y-7 lg:grid-cols-5 xl:grid-cols-6'

interface MovieGridProps {
  state: ListState
  kind: MovieKind
  onOpen: (movie: Movie, kind: MovieKind) => void
  onRetry: () => void
}

export function GridSkeleton() {
  return (
    <div className={GRID_CLASS} aria-busy="true" aria-label="Loading movies">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="aspect-[2/3]" />
          <Skeleton className="h-4 w-2/3 border-0" />
          <Skeleton className="h-3.5 w-1/3 border-0" />
        </div>
      ))}
    </div>
  )
}

/** Failure state shared by Now Showing and Coming Soon. */
export function GridError({ reason, onRetry }: { reason: LoadErrorReason; onRetry: () => void }) {
  return <ErrorState title="Can't load movies" description={describeLoadError(reason)} onRetry={onRetry} />
}

/** Loading skeleton, empty panel, error panel, or the card grid. */
export default function MovieGrid({ state, kind, onOpen, onRetry }: MovieGridProps) {
  if (state.status === 'loading') return <GridSkeleton />
  if (state.status === 'error') return <GridError reason={state.reason} onRetry={onRetry} />
  if (state.movies.length === 0) {
    return (
      <EmptyState
        eyebrow="Empty"
        title={kind === 'now' ? 'Nothing showing yet' : 'Nothing coming soon yet'}
        description="No movies match this filter. Clear it to see everything."
      />
    )
  }
  return (
    <div className={GRID_CLASS}>
      {state.movies.map((movie) => (
        <MovieCard key={movie.movieId} movie={movie} kind={kind} onOpen={onOpen} />
      ))}
    </div>
  )
}
