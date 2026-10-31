import { useCallback, useEffect, useRef, useState } from 'react'
import { getMyTickets, getUserDetails, type Ticket, type UserDetails } from '../../api'

export type TicketsState =
  | { status: 'loading' }
  | { status: 'ready'; tickets: Ticket[] }
  | { status: 'error' }

export type UserState =
  | { status: 'loading' }
  | { status: 'ready'; user: UserDetails }
  | { status: 'failed' }

/**
 * My Bookings data, both Bearer + Content-Type:
 * GET /ticket/mytickets?userId= and GET /user/getUser?userId= (fired together on load and on retry).
 * `reloadTickets` refetches only the ticket list (after a cancel the balance is not reloaded, as legacy).
 * With no userId nothing is requested.
 */
export function useTicketsData(userId: string | null) {
  const [tickets, setTickets] = useState<TicketsState>({ status: 'loading' })
  const [user, setUser] = useState<UserState>({ status: 'loading' })
  const ticketsRun = useRef(0)

  const fetchTickets = useCallback(async () => {
    if (!userId) return
    const run = ++ticketsRun.current
    try {
      const res = await getMyTickets(userId)
      if (run !== ticketsRun.current) return
      if (!res.ok) {
        console.error('Error: ', new Error('Failed to fetch tickets'))
        return setTickets({ status: 'error' })
      }
      setTickets({ status: 'ready', tickets: Array.isArray(res.data) ? res.data : [] })
    } catch (error) {
      if (run !== ticketsRun.current) return
      console.error('Error: ', error)
      setTickets({ status: 'error' })
    }
  }, [userId])

  const fetchUser = useCallback(async () => {
    if (!userId) return
    try {
      const res = await getUserDetails(userId)
      setUser(res.ok ? { status: 'ready', user: res.data } : { status: 'failed' })
    } catch (error) {
      console.error('Fetch Error:', error)
      setUser({ status: 'failed' })
    }
  }, [userId])

  useEffect(() => {
    void fetchTickets()
    void fetchUser()
    return () => {
      ticketsRun.current++
    }
  }, [fetchTickets, fetchUser])

  const reload = useCallback(() => {
    setTickets({ status: 'loading' })
    setUser({ status: 'loading' })
    void fetchTickets()
    void fetchUser()
  }, [fetchTickets, fetchUser])

  return { tickets, user, reload, reloadTickets: fetchTickets }
}
