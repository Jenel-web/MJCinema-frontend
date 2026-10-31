import { useState, type ReactNode } from 'react'
import type { Cinema, Movie } from '../../api'
import { Badge, Button, EmptyState, ErrorState, Poster, Skeleton, type BadgeTone } from '../../components/ui'
import { ChevronLeftIcon, MapPinIcon } from '../../components/ui/icons'
import { statusLabel } from '../../lib/format'
import { GridError } from './MovieGrid'
import { Rating } from './MovieCard'
import type { MovieKind } from './types'
import { useCinemaMovies, useCinemas } from './useCinemas'

const container = 'mx-auto w-full max-w-[1280px] px-4 md:px-10'
const CINEMA_GRID = 'grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4'
const MOVIE_GRID = 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'

function statusTone(status: string): BadgeTone {
  if (status === 'NOW_SHOWING') return 'success'
  if (status === 'COMING_SOON') return 'warning'
  return 'neutral'
}

function PageHeader({ children }: { children: ReactNode }) {
  return <div className="page-glow">{children}</div>
}

/* ---------------------------------- list ---------------------------------- */

function CinemaCard({ cinema, onOpen }: { cinema: Cinema; onOpen: (cinema: Cinema) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(cinema)}
      className="group flex flex-col items-start rounded-card border border-ln bg-s1 p-5 text-left transition duration-150 ease-out hover:border-rd-line hover:bg-rd-tint"
    >
      <span className="flex size-10 items-center justify-center rounded-ctl bg-s3 text-lg text-tx transition duration-150 ease-out group-hover:bg-rd">
        <MapPinIcon />
      </span>
      <span className="mt-5 text-lg leading-6 font-semibold">{cinema.cinemaName}</span>
      <span className="mt-1 text-sm text-mu">{cinema.location}</span>
    </button>
  )
}

function CinemaListSkeleton() {
  return (
    <div className={CINEMA_GRID} aria-busy="true" aria-label="Loading cinemas">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-[136px] rounded-card" />
      ))}
    </div>
  )
}

/* --------------------------------- detail --------------------------------- */

function MovieRow({ movie, onOpen }: { movie: Movie; onOpen: (movie: Movie) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(movie)}
      className="flex items-start gap-4 rounded-card border border-ln bg-s1 p-4 text-left transition duration-150 ease-out hover:border-ln2 hover:bg-s2"
    >
      <Poster src={movie.poster} alt={movie.title} className="w-[84px] shrink-0" />
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-[17px] leading-6 font-semibold">{movie.title}</p>
        <Rating value={movie.rating} className="mt-1.5 text-sm" />
      </div>
      <Badge tone={statusTone(movie.status)} className="mt-1 shrink-0">
        {statusLabel(movie.status)}
      </Badge>
    </button>
  )
}

function MovieRowsSkeleton() {
  return (
    <div className={MOVIE_GRID} aria-busy="true" aria-label="Loading movies">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-[155px] rounded-card" />
      ))}
    </div>
  )
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full py-1 pr-3 text-sm text-mu transition duration-150 ease-out hover:text-tx"
    >
      <ChevronLeftIcon className="text-base" />
      Back to cinemas
    </button>
  )
}

interface DetailProps {
  cinema: Cinema
  onBack: () => void
  onOpenMovie: (movie: Movie, kind: MovieKind) => void
}

function CinemaDetail({ cinema, onBack, onOpenMovie }: DetailProps) {
  const { state, reload } = useCinemaMovies(cinema.cinemaId)

  // Empty cinema: the design shows only the empty panel with a way back.
  if (state.status === 'ready' && state.data.length === 0) {
    return (
      <PageHeader>
        <div className={`${container} py-10`}>
          <EmptyState
            eyebrow="Empty"
            title="No movies currently playing here"
            description="Check another cinema, or come back when new schedules are added."
            action={
              <Button variant="ghost" onClick={onBack}>
                Back to cinemas
              </Button>
            }
          />
        </div>
      </PageHeader>
    )
  }

  const count = state.status === 'ready' ? state.data.length : null

  return (
    <PageHeader>
      <div className={`${container} py-8 md:py-10`}>
        <BackLink onClick={onBack} />
        <h1 className="heading mt-4 text-[40px]">{cinema.cinemaName}</h1>
        <p className="mt-3 text-sm text-mu">
          {cinema.location}
          {count !== null && ` · ${count} ${count === 1 ? 'movie' : 'movies'} now playing`}
        </p>

        <div className="mt-8">
          {state.status === 'loading' && <MovieRowsSkeleton />}
          {state.status === 'error' && <GridError reason={state.reason} onRetry={reload} />}
          {state.status === 'ready' && (
            <div className={MOVIE_GRID}>
              {state.data.map((movie) => (
                // Legacy opened these without a booking button (section 10, item 5).
                <MovieRow key={movie.movieId} movie={movie} onOpen={(m) => onOpenMovie(m, 'info')} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageHeader>
  )
}

/* ----------------------------------- view ---------------------------------- */

interface CinemaViewProps {
  onOpenMovie: (movie: Movie, kind: MovieKind) => void
}

/** Cinema tab: the list of cinemas, and the detail view of one cinema. */
export default function CinemaView({ onOpenMovie }: CinemaViewProps) {
  const { state, reload } = useCinemas()
  const [selected, setSelected] = useState<Cinema | null>(null)

  if (selected) {
    return (
      <CinemaDetail
        key={selected.cinemaId}
        cinema={selected}
        onBack={() => setSelected(null)}
        onOpenMovie={onOpenMovie}
      />
    )
  }

  return (
    <PageHeader>
      <div className={`${container} py-8 md:py-10`}>
        <h1 className="heading text-[40px] md:text-[56px]">Cinemas</h1>
        <p className="mt-3 text-[17px] text-mu">Pick a cinema to see what&apos;s playing there.</p>

        <div className="mt-8">
          {state.status === 'loading' && <CinemaListSkeleton />}
          {state.status === 'error' && (
            <ErrorState
              title="Can't load cinemas"
              description="Error connecting to MJCinema server."
              onRetry={reload}
            />
          )}
          {state.status === 'ready' &&
            (state.data.length === 0 ? (
              <EmptyState
                eyebrow="Empty"
                title="No cinemas yet"
                description="Cinemas will show up here once they are added."
              />
            ) : (
              <div className={CINEMA_GRID}>
                {state.data.map((cinema) => (
                  <CinemaCard key={cinema.cinemaId} cinema={cinema} onOpen={setSelected} />
                ))}
              </div>
            ))}
        </div>
      </div>
    </PageHeader>
  )
}
