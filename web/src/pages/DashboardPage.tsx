import { useState } from 'react'
import { STORAGE_KEYS, type Movie } from '../api'
import { Tabs } from '../components/ui'
import CinemaView from '../features/dashboard/CinemaView'
import Hero, { HeroSkeleton } from '../features/dashboard/Hero'
import MovieGrid, { GridError, GridSkeleton } from '../features/dashboard/MovieGrid'
import MovieModal from '../features/dashboard/MovieModal'
import { useFeaturedMovie } from '../features/dashboard/useFeaturedMovie'
import Navbar from '../features/dashboard/Navbar'
import { TAB_LABELS, type DashboardTab, type MovieKind } from '../features/dashboard/types'
import { useMovieList, type ListKind } from '../features/dashboard/useMovieList'
import { MoviesProvider } from '../store/MoviesProvider'
import { useMovies } from '../store/useMovies'

interface OpenMovie {
  movie: Movie
  kind: MovieKind
  scrollToShowtimes: boolean
}

type OpenHandler = (movie: Movie, kind: MovieKind, scrollToShowtimes?: boolean) => void

const toggleItems = [
  { value: 'now', label: 'Now showing' },
  { value: 'soon', label: 'Coming soon' },
] as const

const container = 'mx-auto w-full max-w-[1280px] px-4 md:px-10'

/** One movie list (Now Showing or Coming Soon): optional hero, pill toggle, heading, grid. */
function MovieSection({
  kind,
  onTab,
  onOpen,
}: {
  kind: ListKind
  onTab: (tab: DashboardTab) => void
  onOpen: OpenHandler
}) {
  const store = useMovies()
  // Legacy order: GET /movie/show first, then the list. Coming Soon does not need the store to load.
  const { state, reload } = useMovieList(kind, kind === 'soon' || store.status === 'ready')

  const storeFailed = kind === 'now' && store.status === 'error'
  const nowMovies = kind === 'now' && state.status === 'ready' ? state.movies : undefined
  const featured = useFeaturedMovie(nowMovies)
  const hasMovies = !!nowMovies && nowMovies.length > 0
  const showToggle = kind === 'now' // the Coming Soon design has no toggle (see CLAUDE.md, Future considerations)

  return (
    <>
      {kind === 'now' &&
        (hasMovies && featured.movie ? (
          <Hero
            movie={featured.movie}
            onBook={() => onOpen(featured.movie!, 'now', true)}
            onDetails={() => onOpen(featured.movie!, 'now')}
          />
        ) : !storeFailed && (state.status === 'loading' || hasMovies) ? (
          <HeroSkeleton />
        ) : null)}

      <section className={`${container} py-8 md:py-10`}>
        {showToggle && (
          <Tabs aria-label="Movies" value={kind} onChange={(v) => onTab(v)} items={[...toggleItems]} />
        )}
        <h2 className={`heading mb-6 text-[32px] md:text-[40px] ${showToggle ? 'mt-8' : ''}`}>
          {TAB_LABELS[kind]}
        </h2>

        {storeFailed && store.errorReason ? (
          <GridError reason={store.errorReason} onRetry={store.reload} />
        ) : kind === 'now' && store.status === 'loading' ? (
          <GridSkeleton />
        ) : (
          <MovieGrid
            state={state}
            kind={kind}
            onOpen={(movie, k) => onOpen(movie, k)}
            onRetry={reload}
          />
        )}
      </section>
    </>
  )
}

function DashboardView() {
  const store = useMovies()
  const [tab, setTab] = useState<DashboardTab>('now')
  const [open, setOpen] = useState<OpenMovie | null>(null)

  const openMovie: OpenHandler = (movie, kind, scrollToShowtimes = false) => {
    // Legacy ClickedCardHandler: remember the id, find the movie in the shared list, open the modal.
    localStorage.setItem(STORAGE_KEYS.movieId, String(movie.movieId))
    setOpen({ movie: store.findMovie(movie.movieId) ?? movie, kind, scrollToShowtimes })
  }

  return (
    <div className="min-h-dvh bg-bg">
      <Navbar tab={tab} onTab={setTab} />
      <main>
        {tab === 'now' && <MovieSection key="now" kind="now" onTab={setTab} onOpen={openMovie} />}
        {tab === 'soon' && <MovieSection key="soon" kind="soon" onTab={setTab} onOpen={openMovie} />}
        {tab === 'cinema' && <CinemaView onOpenMovie={(movie, kind) => openMovie(movie, kind)} />}
      </main>

      {open && (
        <MovieModal
          key={open.movie.movieId}
          movie={open.movie}
          kind={open.kind}
          scrollToShowtimes={open.scrollToShowtimes}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <MoviesProvider>
      <DashboardView />
    </MoviesProvider>
  )
}
