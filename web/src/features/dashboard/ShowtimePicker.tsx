import { useMemo, useState } from 'react'
import type { Schedule } from '../../api'
import { EmptyState, ErrorState, SlotChip, Skeleton } from '../../components/ui'
import { cn } from '../../lib/cn'
import { formatDayChip, formatTime, timeValue } from '../../lib/format'
import type { SchedulesState } from './useMovieSchedules'

interface ShowtimePickerProps {
  state: SchedulesState
  selected: Schedule | null
  onSelect: (schedule: Schedule | null) => void
  onRetry: () => void
}

interface CinemaGroup {
  location: string
  slots: Schedule[]
}

/** Group by showDate, then cinema.location, then startTime. One time chip = one scheduleId. */
function groupSchedules(schedules: Schedule[]) {
  const byDate = new Map<string, Map<string, Schedule[]>>()
  for (const s of schedules) {
    const cinemas = byDate.get(s.showDate) ?? new Map<string, Schedule[]>()
    const list = cinemas.get(s.cinema?.location ?? '') ?? []
    list.push(s)
    cinemas.set(s.cinema?.location ?? '', list)
    byDate.set(s.showDate, cinemas)
  }
  const dates = [...byDate.keys()].sort()
  const cinemasFor = (date: string): CinemaGroup[] =>
    [...(byDate.get(date) ?? [])]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([location, slots]) => ({
        location,
        slots: [...slots].sort((a, b) => timeValue(a.startTime) - timeValue(b.startTime)),
      }))
  return { dates, cinemasFor }
}

function PickerSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading showtimes" className="flex flex-col gap-4">
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-28" />
        ))}
      </div>
      {[0, 1].map((i) => (
        <Skeleton key={i} className="h-[78px] rounded-icon" />
      ))}
    </div>
  )
}

/** Date chips, cinema cards, time chips. Picking a date clears the chosen time. */
export default function ShowtimePicker({ state, selected, onSelect, onRetry }: ShowtimePickerProps) {
  const [pickedDate, setPickedDate] = useState<string | null>(null)
  const grouped = useMemo(
    () => (state.status === 'ready' ? groupSchedules(state.schedules) : null),
    [state],
  )

  if (state.status === 'loading') return <PickerSkeleton />
  if (state.status === 'error')
    return (
      <ErrorState
        title="Can't load showtimes"
        description="Failed to load showtimes. Check your connection and try again."
        onRetry={onRetry}
      />
    )
  if (!grouped || grouped.dates.length === 0)
    return (
      <EmptyState
        eyebrow="Empty"
        title="No showtimes yet"
        description="This movie has no showtimes scheduled right now."
      />
    )

  const date = pickedDate && grouped.dates.includes(pickedDate) ? pickedDate : grouped.dates[0]
  const cinemas = grouped.cinemasFor(date)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-3 text-[13px] leading-[18px] font-medium text-mu">Date</p>
        <div role="group" aria-label="Date" className="-mx-5 flex gap-3 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          {grouped.dates.map((d) => (
            <SlotChip
              key={d}
              selected={d === date}
              size="lg"
              onClick={() => {
                setPickedDate(d)
                if (selected && selected.showDate !== d) onSelect(null)
              }}
            >
              {formatDayChip(d)}
            </SlotChip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {cinemas.map((cinema) => {
          const active = cinema.slots.some((s) => s.scheduleId === selected?.scheduleId)
          return (
            <div
              key={cinema.location}
              role="group"
              aria-label={cinema.location}
              className={cn(
                'flex flex-col gap-4 rounded-icon border p-4 md:flex-row md:items-center md:justify-between md:px-5',
                active ? 'border-rd-line bg-rd-tint' : 'border-ln bg-s1',
              )}
            >
              <p className="text-base font-semibold">{cinema.location}</p>
              <div className="flex flex-wrap gap-3">
                {cinema.slots.map((slot) => (
                  <SlotChip
                    key={slot.scheduleId}
                    selected={slot.scheduleId === selected?.scheduleId}
                    onClick={() => onSelect(slot)}
                  >
                    {formatTime(slot.startTime)}
                  </SlotChip>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
