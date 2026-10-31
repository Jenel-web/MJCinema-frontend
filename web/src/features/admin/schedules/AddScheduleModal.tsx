import { useState, type FormEvent } from 'react'
import { addSchedule, getCinemas, getMovies, getSlots } from '../../../api'
import { Button, Input, Modal, Select, SlotChip, Skeleton, useToast } from '../../../components/ui'
import { useApiResource, type Resource } from '../useApiResource'
import { slotIcon, slotLabel } from './slots'

// Admin form: the legacy calls send `{ Authorization }` only.
const fetchMovies = () => getMovies({ auth: true })
const fetchCinemas = () => getCinemas({ auth: true })

/** Placeholder / loading / failed text for a dropdown, as the legacy selects did. */
const placeholder = (r: Resource<unknown>, ready: string) =>
  r.status === 'loading' ? 'Loading...' : r.status === 'error' ? 'Failed to load' : ready

interface Props {
  open: boolean
  onClose: () => void
  /** Called after a successful POST /schedule/add (reload the stats). */
  onAdded: () => void
}

/**
 * The form is mounted only while the modal is open, so the three option lists load in parallel on
 * open and every field starts empty again after a close (legacy cleared the date and prices).
 */
export default function AddScheduleModal({ open, onClose, onAdded }: Props) {
  return (
    // Legacy: Esc does not close this modal (only the Add Movie modal).
    <Modal open={open} onClose={onClose} title="Add schedule" size="md" closeOnEsc={false}>
      <ScheduleForm onClose={onClose} onAdded={onAdded} />
    </Modal>
  )
}

function ScheduleForm({ onClose, onAdded }: Omit<Props, 'open'>) {
  const toast = useToast()
  const [movies] = useApiResource(fetchMovies)
  const [cinemas] = useApiResource(fetchCinemas)
  const [slots] = useApiResource(getSlots)

  const [movieId, setMovieId] = useState('')
  const [cinemaId, setCinemaId] = useState('')
  const [showDate, setShowDate] = useState('')
  const [slot, setSlot] = useState('')
  const [vipPrice, setVipPrice] = useState('')
  const [regPrice, setRegPrice] = useState('')
  const [balPrice, setBalPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!movieId || !cinemaId || !showDate || !slot || !vipPrice || !regPrice || !balPrice) {
      toast.show({ type: 'error', title: 'Please fill in all fields before submitting.' })
      return
    }
    setSubmitting(true)
    try {
      const res = await addSchedule({
        movieId: Number(movieId),
        cinemaId: Number(cinemaId),
        showDate,
        slot,
        vipPrice: Number(vipPrice),
        regPrice: Number(regPrice),
        balPrice: Number(balPrice),
      })
      // The response is plain text for both outcomes (an error body is the message itself).
      const message = res.ok ? res.data : res.message
      onClose()
      toast.show({ type: res.ok ? 'success' : 'error', title: message })
      if (res.ok) onAdded()
    } catch (err) {
      console.error('Add schedule error:', err)
      toast.show({ type: 'error', title: 'Something went wrong. Please try again.' })
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
      <Select
        label="Movie"
        size="md"
        value={movieId}
        disabled={movies.status !== 'ok'}
        onChange={(e) => setMovieId(e.target.value)}
      >
        <option value="">{placeholder(movies, 'Select a movie')}</option>
        {movies.status === 'ok' &&
          movies.data.map((m) => (
            <option key={m.movieId} value={m.movieId}>
              {m.title}
            </option>
          ))}
      </Select>
      <Select
        label="Cinema"
        size="md"
        value={cinemaId}
        disabled={cinemas.status !== 'ok'}
        onChange={(e) => setCinemaId(e.target.value)}
      >
        <option value="">{placeholder(cinemas, 'Select a cinema')}</option>
        {cinemas.status === 'ok' &&
          cinemas.data.map((c) => (
            <option key={c.cinemaId} value={c.cinemaId}>
              {c.cinemaName} — {c.location}
            </option>
          ))}
      </Select>
      <Input label="Date" type="date" size="md" value={showDate} onChange={(e) => setShowDate(e.target.value)} />

      <div role="group" aria-labelledby="slot-label" className="flex flex-col gap-2">
        <span id="slot-label" className="text-[13px] leading-[18px] font-medium text-tx">
          Time slot
        </span>
        {slots.status === 'loading' && (
          <div aria-busy="true" aria-label="Loading slots" className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-11 w-24 border-0" />
            ))}
          </div>
        )}
        {slots.status === 'error' && <p className="text-sm text-err">Failed to load</p>}
        {slots.status === 'ok' && (
          <div className="flex flex-wrap gap-2">
            {slots.data.map((s) => (
              <SlotChip key={s} selected={slot === s} onClick={() => setSlot(slot === s ? '' : s)}>
                <span aria-hidden="true" className="mr-1.5">
                  {slotIcon(s)}
                </span>
                {slotLabel(s)}
              </SlotChip>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <PriceField label="VIP (₱)" tone="text-gd" value={vipPrice} onChange={setVipPrice} />
        <PriceField label="Regular (₱)" tone="text-tx" value={regPrice} onChange={setRegPrice} />
        <PriceField label="Balcony (₱)" tone="text-bl" value={balPrice} onChange={setBalPrice} />
      </div>

      <div className="mt-2 flex gap-3">
        <Button variant="ghost" size="lg" className="flex-1" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" size="lg" className="flex-1" loading={submitting}>
          Add schedule
        </Button>
      </div>
    </form>
  )
}

function PriceField({
  label,
  tone,
  value,
  onChange,
}: {
  label: string
  tone: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className={`text-[13px] leading-[18px] font-medium ${tone}`}>
        {label}
        <Input
          type="number"
          inputMode="decimal"
          size="md"
          className="mt-2 font-normal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  )
}
