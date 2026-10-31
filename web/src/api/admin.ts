import { authJson, bearer, request } from './client'
import type {
  ActiveMovieCount,
  AddScheduleRequest,
  BestShowtimeItem,
  MovieLeaderboardItem,
  MovieTableRow,
  SalesTrend,
  SeatStatsRow,
} from './types'

const get = <T>(path: string) => request<T>(path, { headers: authJson() })

// Home
export const getTotalSales = () => get<number>('/ticket/totalSales')
export const getTotalBookings = () => get<number>('/ticket/showTotalBookings')
export const getTotalUsers = () => get<number>('/user/showTotalUsers')
export const getRevenueToday = () => get<number>('/ticket/showRevenueToday')
export const getSalesTrend = () => get<SalesTrend>('/ticket/getSalesTrend')

// Movies
export const getMovieLeaderboard = () => get<MovieLeaderboardItem[]>('/movie/leaderboard')
/** Legacy reads `{ activeCount, totalCount }` (the md said a plain number). */
export const getActiveMovieCount = () => get<ActiveMovieCount>('/movie/showActiveCount')
export const getMovieTable = () => get<MovieTableRow[]>('/movie/showMovieTable')

// Schedules
export const getBestShowtime = () => get<BestShowtimeItem[]>('/schedule/bestShowtime')
export const getScheduleCount = () => get<number>('/schedule/showScheduleCount')
export const getAverageRevenue = () => get<number>('/schedule/showAverageRevenue')
export const getSeatStats = () => get<SeatStatsRow[]>('/schedule/seatStats')

/** GET /schedule/showSlots, `{ Authorization }` only (as in the legacy form). */
export const getSlots = () => request<string[]>('/schedule/showSlots', { headers: bearer() })

/** POST /schedule/add, Bearer + Content-Type; plain-text response. */
export const addSchedule = (body: AddScheduleRequest) =>
  request<string>('/schedule/add', {
    method: 'POST',
    headers: authJson(),
    body,
    text: true,
  })
