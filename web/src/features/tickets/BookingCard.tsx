import type { Ticket } from '../../api'
import { Badge, Button } from '../../components/ui'
import { ChevronDownIcon } from '../../components/ui/icons'
import { cn } from '../../lib/cn'
import { formatDayChip, formatTime, statusLabel } from '../../lib/format'
import type { BookingGroup } from './groupTickets'

interface BookingCardProps {
  group: BookingGroup
  /** Seats of the current tab only. */
  seats: Ticket[]
  open: boolean
  onToggle: () => void
  onCancelSeat: (ticketCode: string) => void
}

function SeatRow({ seat, onCancel }: { seat: Ticket; onCancel: () => void }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-ctl border border-ln bg-bg/40 px-4 py-3">
      <span className="min-w-10 text-lg font-bold">{seat.seatNumber}</span>
      <Badge className="border border-ln2 bg-transparent text-tx">{statusLabel(seat.seatCategory)}</Badge>
      <span className="ticket-code ml-auto rounded-lg bg-s2 px-3 py-1.5 text-tx">{seat.ticketCode}</span>
      {seat.ticketStatus === 'ACTIVE' ? (
        <Button variant="danger-soft" size="sm" onClick={onCancel} aria-label={`Cancel ticket ${seat.ticketCode}`}>
          Cancel
        </Button>
      ) : (
        <Badge tone={seat.ticketStatus === 'CANCELLED' ? 'cancelled' : 'neutral'}>{seat.ticketStatus}</Badge>
      )}
    </li>
  )
}

/** One booking: header (click to expand) and the seat rows for the current tab. */
export default function BookingCard({ group, seats, open, onToggle, onCancelSeat }: BookingCardProps) {
  const when = `${formatDayChip(group.showDate)} · ${formatTime(group.startTime)}`
  const count = `${seats.length} ${seats.length === 1 ? 'seat' : 'seats'}`
  const panelId = `booking-${group.key.replace(/\W+/g, '-')}`

  return (
    <li className="rounded-card border border-ln bg-s1 p-4 md:p-5">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center gap-4 text-left"
      >
        <span
          aria-hidden="true"
          className="heading flex h-[72px] w-12 shrink-0 items-center justify-center rounded-ctl border border-ln2 bg-s2 text-2xl text-mu"
        >
          {group.title.trim().charAt(0)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="heading block truncate text-[28px] max-md:text-2xl">{group.title}</span>
          <span className="mt-1 block truncate text-[15px] text-mu">{group.location}</span>
          <span className="mt-1 block text-[15px]">
            {when}
            <span className="text-mu md:hidden"> · {count}</span>
          </span>
        </span>
        <Badge className="border border-ln2 bg-transparent text-tx max-md:hidden">{count}</Badge>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-ln2 bg-s2">
          <ChevronDownIcon className={cn('text-lg transition duration-150', open && 'rotate-180')} />
        </span>
      </button>
      {open && (
        <ul id={panelId} className="mt-4 flex flex-col gap-2 border-t border-ln pt-4">
          {seats.map((seat) => (
            <SeatRow key={seat.ticketCode} seat={seat} onCancel={() => onCancelSeat(seat.ticketCode)} />
          ))}
        </ul>
      )}
    </li>
  )
}
