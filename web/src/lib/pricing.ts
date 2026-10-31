export type SeatCategoryName = 'VIP' | 'REGULAR' | 'BALCONY'

export const CATEGORY_ORDER: SeatCategoryName[] = ['VIP', 'REGULAR', 'BALCONY']

export const CATEGORY_LABEL: Record<SeatCategoryName, string> = {
  VIP: 'VIP',
  REGULAR: 'Regular',
  BALCONY: 'Balcony',
}

/**
 * Legacy pricing rule (frontend-redesign.md, section 10 item 6):
 * rows A-B are VIP, rows G-H are Balcony, every other row is Regular.
 * Prices come from GET /schedule/schedPrice/{scheduleId}; only this row-to-category mapping is local.
 */
export function categoryForRow(row: string): SeatCategoryName {
  if (row === 'A' || row === 'B') return 'VIP'
  if (row === 'G' || row === 'H') return 'BALCONY'
  return 'REGULAR'
}

/** "A", "B", "C"... for the first `total` rows. */
export function rowLetters(total: number): string[] {
  return Array.from({ length: Math.max(0, total) }, (_, i) => String.fromCharCode(65 + i))
}

/** "A–B", "C–F, I–J", "A": contiguous runs of row letters. */
export function formatRowRanges(rows: string[]): string {
  const runs: string[] = []
  let start = 0
  for (let i = 1; i <= rows.length; i++) {
    const continues = i < rows.length && rows[i].charCodeAt(0) === rows[i - 1].charCodeAt(0) + 1
    if (continues) continue
    runs.push(i - 1 === start ? rows[start] : `${rows[start]}–${rows[i - 1]}`)
    start = i
  }
  return runs.join(', ')
}

export type PriceList = Partial<Record<string, number>>

/** Legacy total: sum of priceList[category] per selected seat, a missing price counts as 0. */
export function seatTotal(selected: string[], priceList: PriceList): number {
  return selected.reduce((sum, id) => sum + (priceList[categoryForRow(id.charAt(0))] || 0), 0)
}

export type SeatCell =
  | { kind: 'aisle'; key: string }
  | { kind: 'seat'; key: string; id: string; category: SeatCategoryName }

/**
 * Builds the seat map like the legacy renderBlueprint: one row per letter, one cell per layout
 * character. "_" is an aisle; any other character is a seat. Seats are numbered 1.. per row and
 * aisles do not consume a number.
 */
export function buildRows(totalRows: number, layout: string): { row: string; cells: SeatCell[] }[] {
  return rowLetters(totalRows).map((row) => {
    let number = 1
    const cells: SeatCell[] = [...layout].map((char, i) => {
      if (char === '_') return { kind: 'aisle', key: `${row}-gap-${i}` }
      const id = `${row}${number++}`
      return { kind: 'seat', key: id, id, category: categoryForRow(row) }
    })
    return { row, cells }
  })
}
