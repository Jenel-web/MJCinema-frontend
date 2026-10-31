/** TMDB image base from the legacy app; `movie.poster` is appended to it. */
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

export function posterUrl(poster?: string | null): string | null {
  return poster ? TMDB_IMAGE_BASE + poster : null
}

/** "NOW_SHOWING" -> "Now showing". Legacy replaced the underscores; the design uses sentence case. */
export function statusLabel(status: string): string {
  const text = status.replaceAll('_', ' ').toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "8.2" from a rating, or null when there is no usable number. */
export function formatRating(rating: unknown): string | null {
  if (rating === null || rating === undefined || rating === '') return null
  const n = Number(rating)
  return Number.isFinite(n) ? n.toFixed(1) : null
}

function parseDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

/** "Sat 31 Oct" for date chips. Falls back to the raw value if it is not a date. */
export function formatDayChip(value: string): string {
  const d = parseDate(value)
  return d
    ? d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '')
    : value
}

/** "Nov 05" for release-date tags. Falls back to the raw value. */
export function formatMonthDay(value: string): string {
  const d = parseDate(value)
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : value
}

/** "4:15 PM" from "16:15" or "16:15:00". Falls back to the raw value. */
export function formatTime(value: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(value)
  if (!m) return value
  const hours = Number(m[1])
  return `${hours % 12 || 12}:${m[2]} ${hours >= 12 ? 'PM' : 'AM'}`
}

/** Start of a schedule as epoch ms (local time), or null if showDate/startTime cannot be read. */
export function scheduleStart(showDate: string, startTime: string): number | null {
  const d = parseDate(showDate)
  const t = /^(\d{1,2}):(\d{2})/.exec(startTime)
  if (!d || !t) return null
  d.setHours(Number(t[1]), Number(t[2]), 0, 0)
  return d.getTime()
}

/** Minutes since midnight for sorting times; unparseable values sort last. */
export function timeValue(value: string): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(value)
  return m ? Number(m[1]) * 60 + Number(m[2]) : Number.MAX_SAFE_INTEGER
}

/** "Wk of Dec 29" from a Monday key like "2026-12-29" (the admin sales trend labels). Falls back to the raw key. */
export function formatWeekLabel(value: string): string {
  const d = parseDate(value)
  return d ? `Wk of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : value
}

/** "₱1,234.00" (legacy admin money format). */
export function formatPeso(value: unknown): string {
  return '₱' + Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

/** "3,284" (legacy admin count format). */
export function formatCount(value: unknown): string {
  return Number(value).toLocaleString('en-PH')
}

/** "Oct 03, 2026" for admin release dates. "—" when missing or unreadable. */
export function formatReleaseDate(value?: string | null): string {
  const d = value ? parseDate(value) : null
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '—'
}

/** Year of a TMDB release_date, or "—". */
export function formatYear(value?: string | null): string {
  const m = value ? /^(\d{4})/.exec(value) : null
  return m ? m[1] : '—'
}
