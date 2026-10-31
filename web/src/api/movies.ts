import { authJson, bearer, request } from './client'
import type { Cinema, Movie, Schedule, TmdbMovie } from './types'

/**
 * GET /movie/show. Dashboard: no headers. Admin schedule form: `{ Authorization }` only.
 */
export const getMovies = (opts: { auth?: boolean } = {}) =>
  request<Movie[]>('/movie/show', opts.auth ? { headers: bearer() } : {})

/** GET /schedule/now-showing, no headers. */
export const getNowShowing = () => request<Movie[]>('/schedule/now-showing')

/** GET /schedule/coming-soon, no headers. */
export const getComingSoon = () => request<Movie[]>('/schedule/coming-soon')

/** GET /schedule/movieSchedules/{movieId}, no headers. */
export const getMovieSchedules = (movieId: number | string) =>
  request<Schedule[]>(`/schedule/movieSchedules/${movieId}`)

/**
 * GET /cinema/all. Dashboard: no headers. Admin schedule form: `{ Authorization }` only.
 */
export const getCinemas = (opts: { auth?: boolean } = {}) =>
  request<Cinema[]>('/cinema/all', opts.auth ? { headers: bearer() } : {})

/** GET /cinema/movies/{cinemaId}, no headers. */
export const getCinemaMovies = (cinemaId: number | string) =>
  request<Movie[]>(`/cinema/movies/${cinemaId}`)

/** GET /movie/tmdb/search?name=<query>, Bearer + Content-Type. */
export const searchTmdb = (name: string) =>
  request<TmdbMovie[]>(`/movie/tmdb/search?name=${encodeURIComponent(name)}`, {
    headers: authJson(),
  })

/** POST /movie/add, body { id: <tmdbId> }, Bearer + Content-Type; plain-text response. */
export const addMovie = (id: number) =>
  request<string>('/movie/add', {
    method: 'POST',
    headers: authJson(),
    body: { id },
    text: true,
  })
