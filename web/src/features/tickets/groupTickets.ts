import type { Ticket, TicketStatus } from '../../api'

export interface BookingGroup {
  key: string
  title: string
  showDate: string
  startTime: string
  location: string
  seats: Ticket[]
}

export const TICKET_TABS: TicketStatus[] = ['ACTIVE', 'COMPLETED', 'CANCELLED']

/** One booking card per (title + showDate + startTime), in the order the tickets arrive (legacy grouping). */
export function groupTickets(tickets: Ticket[]): BookingGroup[] {
  const groups = new Map<string, BookingGroup>()
  for (const t of tickets) {
    const key = `${t.title}-${t.showDate}-${t.startTime}`
    let group = groups.get(key)
    if (!group) {
      group = { key, title: t.title, showDate: t.showDate, startTime: t.startTime, location: t.location, seats: [] }
      groups.set(key, group)
    }
    group.seats.push(t)
  }
  return [...groups.values()]
}

export const seatsWithStatus = (group: BookingGroup, status: TicketStatus) =>
  group.seats.filter((s) => s.ticketStatus === status)

/** Tab count = number of booking cards with at least one seat in that status. */
export const countByStatus = (groups: BookingGroup[], status: TicketStatus) =>
  groups.filter((g) => seatsWithStatus(g, status).length > 0).length
