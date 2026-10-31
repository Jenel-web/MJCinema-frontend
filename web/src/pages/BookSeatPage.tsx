import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authErrors, bookTicket, STORAGE_KEYS } from '../api'
import {
  Button,
  ConfirmDialog,
  ErrorState,
  Logo,
  Skeleton,
  StatusDialog,
} from '../components/ui'
import { ChevronLeftIcon } from '../components/ui/icons'
import BottomBar from '../features/booking/BottomBar'
import PriceLegend from '../features/booking/PriceLegend'
import SeatMap from '../features/booking/SeatMap'
import { useBookingData, type BookingData } from '../features/booking/useBookingData'
import { describeLoadError } from '../features/dashboard/useMovieList'
import { formatDayChip, formatTime } from '../lib/format'
import { seatTotal } from '../lib/pricing'

const container = 'mx-auto w-full max-w-[1100px] px-4 md:px-10'

interface StatusState {
  ok: boolean
  title: string
  message: string
}

/** "Mall of Asia · Cinema 1 - IMAX · Tue 3 Nov, 9:00 AM", using only the parts that exist. */
function buildSubtitle(schedule: BookingData['schedule']): string {
  const when = [
    schedule.showDate ? formatDayChip(schedule.showDate) : null,
    schedule.startTime ? formatTime(schedule.startTime) : null,
  ]
    .filter(Boolean)
    .join(', ')
  return [schedule.cinema.location, schedule.cinema.cinemaName, when].filter(Boolean).join(' · ')
}

function SeatLegend() {
  const item = (swatch: string, label: string) => (
    <li className="flex items-center gap-2 text-sm text-mu">
      <span aria-hidden="true" className={`size-[18px] rounded-md border-[1.5px] ${swatch}`} />
      {label}
    </li>
  )
  return (
    <ul aria-label="Seat legend" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {item('border-ln2 bg-s2', 'Available')}
      {item('border-rd bg-rd', 'Selected')}
      {item('border-transparent bg-occ opacity-50', 'Occupied')}
    </ul>
  )
}

function BookingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading seats" className="flex flex-col items-center gap-6">
      <Skeleton className="h-5 w-64 border-0" />
      <Skeleton className="h-14 w-full max-w-[620px] border-0" />
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 8 }, (_, r) => (
          <Skeleton key={r} className="h-[22px] w-[300px] max-w-full border-0 md:h-[30px] md:w-[520px]" />
        ))}
      </div>
      <div className="grid w-full gap-3 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[46px] rounded-icon" />
        ))}
      </div>
    </div>
  )
}

export default function BookSeatPage() {
  const navigate = useNavigate()
  const [scheduleId] = useState(() => localStorage.getItem(STORAGE_KEYS.selectedScheduleId))
  const { state, reload } = useBookingData(scheduleId)

  const [selected, setSelected] = useState<string[]>([])
  const [showHint, setShowHint] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [booking, setBooking] = useState(false)
  const [status, setStatus] = useState<StatusState | null>(null)

  // Legacy: no schedule chosen means there is nothing to book, so go back to the start.
  useEffect(() => {
    if (!scheduleId) {
      console.error('No Schedule ID found! Redirecting to home...')
      navigate('/')
    }
  }, [scheduleId, navigate])

  if (!scheduleId) return null

  const data = state.status === 'ready' ? state.data : null
  // Legacy: "Title Unavailable" when the schedule has no movie.
  const title = data ? (data.schedule.movie?.title ?? 'Title Unavailable') : null
  const total = data ? seatTotal(selected, data.priceList) : 0

  function toggleSeat(seatId: string) {
    setSelected((prev) => (prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]))
    setShowHint(false)
  }

  function handleConfirmClick() {
    if (selected.length === 0) {
      setShowHint(true) // legacy alert("Please select atleast one seat."), now in-page
      return
    }
    setConfirmOpen(true)
  }

  async function handleBook() {
    setConfirmOpen(false)
    setBooking(true)
    try {
      const res = await bookTicket({
        userId: Number(localStorage.getItem(STORAGE_KEYS.userId)),
        scheduleId: Number(scheduleId),
        selectedSeat: selected,
      })
      if (res.ok) {
        setStatus({ ok: true, title: 'Booking Confirmed!', message: 'Your seats are secured. Enjoy the show!' })
      } else {
        setStatus({ ok: false, title: 'Booking Failed', message: res.message || 'An unexpected error occurred.' })
      }
    } catch (error) {
      // Legacy only logged this. Decided (md section 10 item 10): still log, and now tell the user.
      console.error('Error : ' + error)
      setStatus({ ok: false, title: 'Booking Failed', message: authErrors.OFFLINE })
    } finally {
      setBooking(false)
    }
  }

  function handleStatusOk() {
    const success = status?.ok
    setStatus(null)
    if (success) navigate('/dashboard')
  }

  return (
    <div className="min-h-dvh bg-bg pb-[220px] md:pb-[150px]">
      <header className="page-glow border-b border-ln">
        <div className={`${container} flex items-center gap-4 py-4 md:py-5`}>
          <Button
            variant="ghost"
            aria-label="Back"
            className="max-md:size-11 max-md:px-0"
            onClick={() => navigate(-1)}
          >
            <ChevronLeftIcon className="text-lg" />
            <span className="max-md:sr-only">Back</span>
          </Button>
          <div className="min-w-0 flex-1">
            {title === null ? (
              <Skeleton className="h-7 w-48 border-0" />
            ) : (
              <h1 className="heading truncate text-[28px] md:text-[36px]">{title}</h1>
            )}
            {data && buildSubtitle(data.schedule) && (
              <p className="mt-1 truncate text-sm text-mu">{buildSubtitle(data.schedule)}</p>
            )}
          </div>
          <div className="max-md:hidden">
            <Logo size={30} />
          </div>
        </div>
      </header>

      <main className={`${container} py-8`}>
        {state.status === 'loading' && <BookingSkeleton />}
        {state.status === 'error' && (
          <ErrorState
            title="Can't load seats"
            description={describeLoadError(state.reason)}
            onRetry={reload}
          />
        )}
        {data && (
          <div className="flex flex-col gap-8">
            <SeatLegend />
            <div className="flex flex-col items-center gap-2">
              <div aria-hidden="true" className="screen-curve w-full max-w-[620px]" />
              <p className="text-sm text-mu">Screen</p>
            </div>
            <SeatMap
              totalRows={data.schedule.cinema.totalRows}
              layout={data.schedule.cinema.seatLayout}
              occupied={data.occupied}
              selected={selected}
              priceList={data.priceList}
              onToggle={toggleSeat}
            />
            <PriceLegend totalRows={data.schedule.cinema.totalRows} priceList={data.priceList} />
          </div>
        )}
      </main>

      {data && (
        <BottomBar
          selected={selected}
          total={total}
          loading={booking}
          showHint={showHint}
          onConfirm={handleConfirmClick}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Do you want to proceed with booking these seats?"
        cancelLabel="Go Back"
        confirmLabel="Yes, Book Now"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleBook}
      >
        <dl className="mt-5 flex flex-col gap-2.5 rounded-ctl bg-s2 p-4 text-sm">
          {[
            ['Movie', title],
            [
              'Showtime',
              data &&
                [
                  data.schedule.showDate ? formatDayChip(data.schedule.showDate) : null,
                  data.schedule.startTime ? formatTime(data.schedule.startTime) : null,
                ]
                  .filter(Boolean)
                  .join(', '),
            ],
            ['Seats', selected.join(', ')],
          ]
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="text-mu">{label}</dt>
                <dd className="text-right font-semibold">{value}</dd>
              </div>
            ))}
          <div className="flex justify-between gap-4">
            <dt className="text-mu">Total</dt>
            <dd className="font-semibold text-gd">₱{total.toLocaleString()}</dd>
          </div>
        </dl>
      </ConfirmDialog>

      <StatusDialog
        open={status !== null}
        tone={status?.ok ? 'success' : 'error'}
        title={status?.title ?? ''}
        message={status?.message ?? ''}
        actionLabel="Okay"
        onAction={handleStatusOk}
      />
    </div>
  )
}
