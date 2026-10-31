import { cn } from '../../lib/cn'
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  categoryForRow,
  formatRowRanges,
  rowLetters,
  type PriceList,
  type SeatCategoryName,
} from '../../lib/pricing'

const swatchBorder: Record<SeatCategoryName, string> = {
  VIP: 'border-gd',
  REGULAR: 'border-ln2',
  BALCONY: 'border-bl',
}

interface PriceLegendProps {
  totalRows: number
  priceList: PriceList
}

/**
 * One card per seat category that exists in this cinema. The row ranges come from the pricing rule
 * and the real row count; the prices come from GET /schedule/schedPrice. Nothing is hardcoded.
 */
export default function PriceLegend({ totalRows, priceList }: PriceLegendProps) {
  const rows = rowLetters(totalRows)
  const cards = CATEGORY_ORDER.map((category) => ({
    category,
    rows: rows.filter((r) => categoryForRow(r) === category),
  })).filter((c) => c.rows.length > 0)

  return (
    <ul aria-label="Seat prices" className="grid gap-3 md:grid-cols-3">
      {cards.map(({ category, rows: catRows }) => {
        const price = priceList[category]
        return (
          <li
            key={category}
            className="flex h-[46px] items-center gap-3 rounded-icon border border-ln bg-s1 px-4 text-sm"
          >
            <span aria-hidden="true" className={cn('size-5 rounded-md border-[1.5px] bg-s2', swatchBorder[category])} />
            <span className="flex-1 text-tx">
              {CATEGORY_LABEL[category]} · {catRows.length === 1 ? 'row' : 'rows'} {formatRowRanges(catRows)}
            </span>
            <span className="font-semibold text-tx">{price !== undefined ? `₱${price.toLocaleString()}` : '—'}</span>
          </li>
        )
      })}
    </ul>
  )
}
