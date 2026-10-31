import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { STORAGE_KEYS, type Movie, type Schedule } from '../../api'
import { Button, Modal, Poster } from '../../components/ui'
import { ChevronLeftIcon, CloseIcon } from '../../components/ui/icons'
import { formatDayChip, formatRating, formatTime } from '../../lib/format'
import ShowtimePicker from './ShowtimePicker'
import type { MovieKind } from './types'
import { useMovieSchedules } from './useMovieSchedules'

export interface MovieModalProps {
  movie: Movie
  kind: MovieKind
  /** Opened from the hero "Book seats": scroll straight to the showtime section. */
  scrollToShowtimes?: boolean
  onClose: () => void
}

const NO_SLOT_MESSAGE = 'Please select a time slot first!'

const roundButton =
  'inline-flex size-11 items-center justify-center rounded-full border border-ln2 bg-bg/60 text-lg text-tx backdrop-blur transition duration-150 ease-out hover:bg-s3'

/**
 * Movie details: poster, title, rating, overview. Now Showing movies also get the showtime picker
 * (GET /schedule/movieSchedules/{movieId}) and "Select seats". Full-screen sheet on mobile.
 */
export default function MovieModal({ movie, kind, scrollToShowtimes = false, onClose }: MovieModalProps) {
  const navigate = useNavigate()
  const bookable = kind === 'now'
  const schedules = useMovieSchedules(movie.movieId, bookable)
  const [selected, setSelected] = useState<Schedule | null>(null)
  const [showHint, setShowHint] = useState(false)
  const showtimeRef = useRef<HTMLElement>(null)
  const rating = formatRating(movie.rating)

  useEffect(() => {
    if (!scrollToShowtimes || !bookable) return
    const frame = requestAnimationFrame(() => showtimeRef.current?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(frame)
  }, [scrollToShowtimes, bookable])

  function handleSelect(schedule: Schedule | null) {
    setSelected(schedule)
    if (schedule) setShowHint(false)
  }

  function handleSelectSeats() {
    if (!selected) {
      setShowHint(true) // legacy alert("Please select a time slot first!"), now in-page
      return
    }
    localStorage.setItem(STORAGE_KEYS.selectedScheduleId, String(selected.scheduleId))
    navigate('/bookseat')
  }

  return (
    <Modal
      open
      onClose={onClose}
      aria-label={movie.title}
      size="lg"
      padded={false}
      showClose={false}
      closeOnOverlay={false}
      fullscreenOnMobile
      className="max-md:page-glow"
    >
      <div className="relative px-5 pt-20 md:px-10 md:pt-10">
        <button type="button" aria-label="Back" onClick={onClose} className={`${roundButton} absolute top-4 left-4 md:hidden`}>
          <ChevronLeftIcon />
        </button>
        <button type="button" aria-label="Close" onClick={onClose} className={`${roundButton} absolute top-4 right-4 md:top-5 md:right-5`}>
          <CloseIcon />
        </button>

        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <Poster src={movie.poster} alt={movie.title} className="w-[42%] max-w-[220px] md:w-[340px] md:max-w-none" />
          <h2 className="heading mt-6 text-[44px] leading-none md:mt-10 md:text-[56px]">{movie.title}</h2>
          {rating && (
            <p className="mt-4 flex items-baseline gap-1.5">
              <span className="font-display text-[36px] leading-none font-extrabold text-gd">{rating}</span>
              <span className="text-mu">/ 10</span>
            </p>
          )}
          {movie.overview && (
            <p className="mt-4 max-w-[640px] text-base leading-6 text-tx md:mt-5">{movie.overview}</p>
          )}
        </div>

        {bookable && (
          <section ref={showtimeRef} aria-labelledby="pick-showtime" className="mt-8 scroll-mt-4 border-t border-ln pt-8">
            <h3 id="pick-showtime" className="heading mb-6 text-[32px]">
              Pick a showtime
            </h3>
            <ShowtimePicker state={schedules.state} selected={selected} onSelect={handleSelect} onRetry={schedules.reload} />
          </section>
        )}
        <div className="h-8" />
      </div>

      {bookable && (
        <footer className="sticky bottom-0 flex flex-col gap-3 border-t border-ln bg-s1 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-10 md:py-5">
          <div className="min-w-0 text-center text-sm text-mu md:text-left" aria-live="polite">
            {showHint && (
              <p role="alert" className="mb-1 font-semibold text-err">
                {NO_SLOT_MESSAGE}
              </p>
            )}
            <p className="truncate">
              {selected
                ? `Selected: ${selected.cinema.location}, ${formatDayChip(selected.showDate)}, ${formatTime(selected.startTime)}`
                : 'Pick a showtime to continue.'}
            </p>
          </div>
          <Button size="lg" className="md:px-10" softDisabled={!selected} onClick={handleSelectSeats}>
            Select seats
          </Button>
        </footer>
      )}
    </Modal>
  )
}
