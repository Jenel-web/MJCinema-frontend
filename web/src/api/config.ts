export const BASE_URL: string =
  import.meta.env.VITE_API_URL || 'https://mjcinema-backend.onrender.com'

/** localStorage keys (same as the legacy frontend). */
export const STORAGE_KEYS = {
  token: 'token',
  userId: 'userId',
  username: 'username',
  movieId: 'movieId',
  selectedScheduleId: 'selectedScheduleId',
} as const
