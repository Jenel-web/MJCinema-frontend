// Response/request shapes from frontend-redesign.md. Fields not listed there are not invented.

export type Role = 'USER' | (string & {})

export interface LoginRequest {
  username: string
  password: string
}
export interface LoginResponse {
  userId: number
  username: string
  jwtToken: string
  role: Role
}
export interface RegisterRequest {
  username: string
  password: string
  confirm: string
}

export type MovieStatus =
  | 'NOW_SHOWING'
  | 'COMING_SOON'
  | 'INACTIVE'
  | 'NEW'
  | (string & {})

export interface Movie {
  movieId: number
  title: string
  poster: string
  rating: number
  overview: string
  status: MovieStatus
  showDate?: string | null
}

export interface Cinema {
  cinemaId: number
  cinemaName: string
  location: string
}

export interface Schedule {
  scheduleId: number
  showDate: string
  startTime: string
  cinema: { location: string }
}

export interface ScheduleDetail {
  movie: { title: string }
  /** Present in the real response; optional here so the booking header can omit what is missing. */
  showDate?: string
  startTime?: string
  cinema: {
    totalRows: number
    totalColumns: number
    seatLayout: string
    cinemaName?: string
    location?: string
  }
}

export type SeatCategory = 'VIP' | 'REGULAR' | 'BALCONY' | (string & {})
export interface SeatPrice {
  seatCategory: SeatCategory
  price: number
}

/** Seat ids such as ["C4", "D5"]. */
export type OccupiedSeats = string[]

export interface BookTicketRequest {
  userId: number
  scheduleId: number
  selectedSeat: string[]
}

export type TicketStatus = 'ACTIVE' | 'CANCELLED' | 'COMPLETED'
export interface Ticket {
  title: string
  showDate: string
  startTime: string
  location: string
  seatNumber: string
  seatCategory: SeatCategory
  ticketCode: string
  ticketStatus: TicketStatus
}

export interface UserDetails {
  username: string
  balance: number
}

// Admin
/** Keyed by Monday date, e.g. { "2026-01-05": 12 }. */
export type SalesTrend = Record<string, number>

/** GET /movie/showActiveCount. */
export interface ActiveMovieCount {
  activeCount: number
  totalCount: number
}

export interface MovieLeaderboardItem {
  title: string
  revenue: number
}
export interface MovieTableRow {
  title: string
  rating: number
  releaseDate: string
  status: MovieStatus
  revenue: number
}
export interface TmdbMovie {
  id: number
  title: string
  release_date?: string | null
  vote_average?: number | null
  poster_path?: string | null
}

export type Slot =
  | 'MORNING'
  | 'MIDDAY'
  | 'AFTERNOON'
  | 'EVENING'
  | 'NIGHT'
  | 'MIDNIGHT'
export interface BestShowtimeItem {
  slot: Slot
  averageRevenue: number
}
export interface SeatStatsRow {
  title: string
  cinemaName: string
  showDate: string
  slot: Slot
  occupiedSeats: number
  availableSeats: number
  percentage: number
}
export interface AddScheduleRequest {
  movieId: number
  cinemaId: number
  showDate: string
  slot: string
  vipPrice: number
  regPrice: number
  balPrice: number
}
