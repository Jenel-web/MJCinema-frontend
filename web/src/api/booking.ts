import { authJson, request } from './client'
import type {
  BookTicketRequest,
  OccupiedSeats,
  ScheduleDetail,
  SeatPrice,
  Ticket,
  UserDetails,
} from './types'

/** GET /schedule/{scheduleId}, no headers. */
export const getSchedule = (scheduleId: number | string) =>
  request<ScheduleDetail>(`/schedule/${scheduleId}`)

/** GET /schedule/schedPrice/{scheduleId}, no headers. */
export const getSchedulePrices = (scheduleId: number | string) =>
  request<SeatPrice[]>(`/schedule/schedPrice/${scheduleId}`)

/** GET /seat/occupied/{scheduleId}, Bearer + Content-Type. */
export const getOccupiedSeats = (scheduleId: number | string) =>
  request<OccupiedSeats>(`/seat/occupied/${scheduleId}`, { headers: authJson() })

/** POST /ticket/book, Bearer + Content-Type, credentials: "include". Errors carry { message }. */
export const bookTicket = (body: BookTicketRequest) =>
  request<unknown>('/ticket/book', {
    method: 'POST',
    headers: authJson(),
    body,
    credentials: 'include',
  })

/** GET /ticket/mytickets?userId=, Bearer + Content-Type. */
export const getMyTickets = (userId: number | string) =>
  request<Ticket[]>(`/ticket/mytickets?userId=${userId}`, { headers: authJson() })

/**
 * PATCH /ticket/cancel, body { ticketCode }, Bearer + Content-Type, credentials: "include".
 * Legacy never read the body of a successful response, so it is read as text and ignored:
 * a non-JSON or empty 200 must still count as success.
 */
export const cancelTicket = (ticketCode: string) =>
  request<string>('/ticket/cancel', {
    method: 'PATCH',
    headers: authJson(),
    body: { ticketCode },
    credentials: 'include',
    text: true,
  })

/** GET /user/getUser?userId=, Bearer + Content-Type. */
export const getUserDetails = (userId: number | string) =>
  request<UserDetails>(`/user/getUser?userId=${userId}`, { headers: authJson() })
