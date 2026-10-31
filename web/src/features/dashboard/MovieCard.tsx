import type { Movie } from '../../api'
import { Badge, Poster } from '../../components/ui'
import { StarIcon } from '../../components/ui/icons'
import { formatMonthDay, formatRating } from '../../lib/format'
import type { MovieKind } from './types'

interface MovieCardProps {
  movie: Movie
  kind: MovieKind
  onOpen: (movie: Movie, kind: MovieKind) => void
}

export function Rating({ value, className }: { value: unknown; className?: string }) {
  const text = formatRating(value)
  if (!text) return null
  return (
    <span className={`inline-flex items-center gap-1 font-semibold text-gd ${className ?? ''}`}>
      <StarIcon className="text-[0.85em]" />
      {text}
    </span>
  )
}

/** Poster, title and rating. Coming Soon cards add the release-date tag and the "Coming soon" badge. */
export default function MovieCard({ movie, kind, onOpen }: MovieCardProps) {
  const soon = kind === 'soon'
  return (
    <button
      type="button"
      onClick={() => onOpen(movie, kind)}
      className="group flex min-w-0 flex-col gap-3 text-left"
    >
      <div className="relative transition duration-150 ease-out group-hover:-translate-y-1">
        <Poster src={movie.poster} alt={movie.title} />
        {soon && (
          <span className="absolute top-3 left-3 inline-flex h-6 items-center rounded-full bg-bg/80 px-2.5 text-xs font-semibold text-tx backdrop-blur">
            {movie.showDate ? formatMonthDay(movie.showDate) : 'TBA'}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[15px] leading-5 font-medium text-tx">{movie.title}</p>
        <div className="mt-1 flex items-center justify-between gap-2 text-sm">
          <Rating value={movie.rating} />
          {soon && <Badge tone="warning">Coming soon</Badge>}
        </div>
      </div>
    </button>
  )
}
