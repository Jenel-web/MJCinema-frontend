/** Backend origin. A trailing slash in VITE_API_URL is dropped so paths like "/user/login" never become "//user/login". */
export const BASE_URL: string = (import.meta.env.VITE_API_URL || 'https://mjcinema-backend-new.onrender.com').replace(/\/+$/, '')

/** localStorage keys (same as the legacy frontend). */
export const STORAGE_KEYS = {
  token: 'token',
  userId: 'userId',
  username: 'username',
  movieId: 'movieId',
  selectedScheduleId: 'selectedScheduleId',
} as const
