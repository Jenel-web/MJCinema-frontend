import { useCallback, useEffect, useState } from 'react'
import { getOccupiedSeats, getSchedule, getSchedulePrices, type ScheduleDetail } from '../../api'
import type { LoadErrorReason } from '../../store/movies-context'
import type { PriceList } from '../../lib/pricing'

export interface BookingData {
  schedule: ScheduleDetail
  priceList: PriceList
  occupied: Set<string>
}

export type BookingState =
  | { status: 'loading' }
  | { status: 'ready'; data: BookingData }
  | { status: 'error'; reason: LoadErrorReason }

/**
 * The three calls the legacy initBooking made, fired together:
 * GET /schedule/{id} and GET /schedule/schedPrice/{id} (no headers),
 * GET /seat/occupied/{id} (Bearer + Content-Type).
 */
export function useBookingData(scheduleId: string | null) {
  const [state, setState] = useState<BookingState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!scheduleId) return
    let cancelled = false
    ;(async () => {
      try {
        const [schedule, prices, occupied] = await Promise.all([
          getSchedule(scheduleId),
          getSchedulePrices(scheduleId),
          getOccupiedSeats(scheduleId),
        ])
        if (cancelled) return
        if (!schedule.ok || !prices.ok || !occupied.ok) return setState({ status: 'error', reason: 'http' })
        if (
          !schedule.data?.cinema ||
          typeof schedule.data.cinema.seatLayout !== 'string' ||
          !Array.isArray(prices.data) ||
          !Array.isArray(occupied.data)
        ) {
          return setState({ status: 'error', reason: 'format' })
        }
        const priceList: PriceList = {}
        for (const item of prices.data) priceList[item.seatCategory] = item.price
        setState({
          status: 'ready',
          data: { schedule: schedule.data, priceList, occupied: new Set(occupied.data) },
        })
      } catch {
        if (!cancelled) setState({ status: 'error', reason: 'offline' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [scheduleId, attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  return { state, reload }
}
