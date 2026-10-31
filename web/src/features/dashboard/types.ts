export type DashboardTab = 'now' | 'soon' | 'cinema'

export const TAB_LABELS: Record<DashboardTab, string> = {
  now: 'Now Showing',
  soon: 'Coming Soon',
  cinema: 'Cinema',
}

/**
 * Which kind of modal a movie opens in. Only 'now' (Now Showing) can be booked:
 * 'soon' is Coming Soon, 'info' is a movie opened from a cinema (details only, as legacy).
 */
export type MovieKind = 'now' | 'soon' | 'info'
