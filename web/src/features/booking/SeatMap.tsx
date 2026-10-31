import { memo, useMemo } from 'react'
import { cn } from '../../lib/cn'
import { buildRows, CATEGORY_LABEL, type PriceList, type SeatCategoryName } from '../../lib/pricing'

interface SeatMapProps {
  totalRows: number
  layout: string
  occupied: Set<string>
  selected: string[]
  priceList: PriceList
  onToggle: (seatId: string) => void
}

const categoryBorder: Record<SeatCategoryName, string> = {
  VIP: 'border-gd',
  REGULAR: 'border-ln2',
  BALCONY: 'border-bl',
}

/** Seat sizes from tokens.md: 32x30 (radius 9/9/4/4, gap 8) on desktop, 20x22 (6/6/3/3, gap 4) on mobile. */
const SEAT =
  'h-[22px] w-5 rounded-t-[6px] rounded-b-[3px] md:h-[30px] md:w-8 md:rounded-t-[9px] md:rounded-b-[4px] ' +
  'border-[1.5px] transition duration-150 ease-out'

function RowLabel({ row }: { row: string }) {
  return (
    <span aria-hidden="true" className="w-4 shrink-0 text-center text-xs text-mu md:w-5 md:text-sm">
      {row}
    </span>
  )
}

/** The seat grid: one row per letter, one cell per layout character ("_" = aisle). */
function SeatMap({ totalRows, layout, occupied, selected, priceList, onToggle }: SeatMapProps) {
  const rows = useMemo(() => buildRows(totalRows, layout), [totalRows, layout])

  return (
    <div className="mx-auto w-max max-w-full overflow-x-auto py-1" role="group" aria-label="Seat map">
      <div className="flex flex-col gap-2 md:gap-2.5 md:px-1">
        {rows.map(({ row, cells }) => (
          <div key={row} className="flex items-center gap-1.5 md:gap-4">
            <RowLabel row={row} />
            <div className="flex gap-1 md:gap-2">
              {cells.map((cell) => {
                if (cell.kind === 'aisle') return <span key={cell.key} aria-hidden="true" className="w-2.5 md:w-[22px]" />
                const isOccupied = occupied.has(cell.id)
                const isSelected = selected.includes(cell.id)
                const price = priceList[cell.category]
                return (
                  <button
                    key={cell.key}
                    type="button"
                    disabled={isOccupied}
                    aria-pressed={isOccupied ? undefined : isSelected}
                    aria-label={
                      isOccupied
                        ? `Seat ${cell.id}, occupied`
                        : `Seat ${cell.id}, ${CATEGORY_LABEL[cell.category]}${price !== undefined ? `, ${price}` : ''}`
                    }
                    onClick={() => onToggle(cell.id)}
                    className={cn(
                      SEAT,
                      isOccupied
                        ? 'cursor-not-allowed border-transparent bg-occ opacity-50'
                        : isSelected
                          ? 'border-rd bg-rd'
                          : cn('bg-s2 hover:bg-s3', categoryBorder[cell.category]),
                    )}
                  />
                )
              })}
            </div>
            <RowLabel row={row} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default memo(SeatMap)
