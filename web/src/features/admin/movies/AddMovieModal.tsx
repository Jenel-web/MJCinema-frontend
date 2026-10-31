import { useRef, useState, type FormEvent } from 'react'
import { addMovie, searchTmdb, type TmdbMovie } from '../../../api'
import { Input, Modal, Poster, Skeleton, useToast } from '../../../components/ui'
import { FilmIcon, SearchIcon, StarIcon } from '../../../components/ui/icons'
import { formatYear } from '../../../lib/format'

type Results =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ok'; movies: TmdbMovie[] }

function Message({ children }: { children: string }) {
  return (
    <p role="status" className="py-10 text-center text-sm text-mu">
      {children}
    </p>
  )
}

/** State lives in the body, which only mounts while the modal is open, so it resets on every open. */
function Body({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Results>({ status: 'idle' })
  const [adding, setAdding] = useState(false)
  const searchId = useRef(0)

  async function search(e: FormEvent) {
    e.preventDefault()
    const name = query.trim()
    if (!name) return
    const id = ++searchId.current
    setResults({ status: 'loading' })
    try {
      const res = await searchTmdb(name)
      if (id !== searchId.current) return
      setResults(res.ok ? { status: 'ok', movies: res.data } : { status: 'error' })
    } catch {
      if (id === searchId.current) setResults({ status: 'error' })
    }
  }

  async function select(movie: TmdbMovie) {
    if (adding) return
    setAdding(true)
    try {
      const res = await addMovie(movie.id)
      onClose()
      toast.show({
        type: res.ok ? 'success' : 'error',
        title: res.ok ? 'Movie added' : "Couldn't add movie",
        message: res.ok ? res.data : res.message,
      })
      if (res.ok) onAdded()
    } catch {
      onClose()
      toast.show({ type: 'error', title: "Couldn't add movie", message: 'Something went wrong. Please try again.' })
    }
  }

  return (
    <>
      <form onSubmit={search} className="mt-5">
        <Input
          data-autofocus
          label="Title"
          size="md"
          placeholder="Search movie title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          trailing={
            <button
              type="submit"
              aria-label="Search"
              className="inline-flex size-9 items-center justify-center rounded-full text-lg text-mu hover:bg-s3 hover:text-tx"
            >
              <SearchIcon />
            </button>
          }
        />
      </form>
      <div className="mt-5" aria-live="polite">
        {results.status === 'idle' && <Message>Search for a movie to get started.</Message>}
        {results.status === 'loading' && (
          <>
            <Message>Searching...</Message>
            <Skeleton className="h-[88px] w-full" />
          </>
        )}
        {results.status === 'error' && <Message>Search failed. Please try again.</Message>}
        {results.status === 'ok' && results.movies.length === 0 && <Message>No results found.</Message>}
        {results.status === 'ok' && results.movies.length > 0 && (
          <ul className="flex flex-col gap-2">
            {results.movies.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={adding}
                  onClick={() => select(m)}
                  className="flex w-full items-center gap-4 rounded-ctl border border-ln bg-s2 p-2.5 text-left transition duration-150 ease-out hover:border-rd-line hover:bg-rd-tint disabled:opacity-60"
                >
                  <Poster
                    src={m.poster_path}
                    alt={m.title}
                    fallback={<FilmIcon />}
                    className="w-11 shrink-0 rounded-lg"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-base font-semibold">{m.title}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-sm text-mu">
                      {formatYear(m.release_date)}
                      <span aria-hidden="true">·</span>
                      <StarIcon className="text-xs" />
                      {m.vote_average ? Number(m.vote_average).toFixed(1) : '—'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

export default function AddMovieModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean
  onClose: () => void
  onAdded: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="Add movie" size="md">
      <Body onClose={onClose} onAdded={onAdded} />
    </Modal>
  )
}
