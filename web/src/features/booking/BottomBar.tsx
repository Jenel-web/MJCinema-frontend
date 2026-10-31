import { Button } from '../../components/ui'
import { CATEGORY_LABEL, categoryForRow } from '../../lib/pricing'

interface BottomBarProps {
  selected: string[]
  total: number
  loading: boolean
  /** Shows the "select at least one seat" message above the bar. */
  showHint: boolean
  onConfirm: () => void
}

/** Fixed bar: selected seat chips, total with seat count, and "Confirm booking". Always visible. */
export default function BottomBar({ selected, total, loading, showHint, onConfirm }: BottomBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ln bg-s1">
      <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-8 md:px-10 md:py-5">
        <div className="min-w-0">
          {showHint && (
            <p role="alert" className="mb-2 text-sm font-semibold text-err">
              Please select atleast one seat.
            </p>
          )}
          <div className="flex items-start gap-3 md:flex-col md:gap-2">
            <p className="pt-2 text-[13px] leading-[18px] text-mu md:pt-0">
              <span className="md:hidden">Seats</span>
              <span className="max-md:hidden">Selected seats</span>
            </p>
            {selected.length === 0 ? (
              <p className="pt-2 text-sm text-mu md:pt-0" aria-live="polite">
                None
              </p>
            ) : (
              <ul aria-label="Selected seats" aria-live="polite" className="flex max-h-[84px] flex-wrap gap-2 overflow-y-auto">
                {selected.map((id) => (
                  <li
                    key={id}
                    className="inline-flex h-9 items-center gap-1.5 rounded-ctl border border-rd-line bg-rd-tint px-3 text-sm"
                  >
                    <span className="font-bold">{id}</span>
                    <span className="text-mu max-md:hidden">{CATEGORY_LABEL[categoryForRow(id.charAt(0))]}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 md:items-center md:gap-8">
          <div>
            <p className="text-[13px] leading-[18px] text-mu">
              Total · {selected.length} {selected.length === 1 ? 'seat' : 'seats'}
            </p>
            <p className="font-display text-[36px] leading-none font-extrabold md:text-[40px]">
              ₱{total.toLocaleString()}
            </p>
          </div>
          <Button
            size="xl"
            className="max-md:flex-1 md:px-9"
            softDisabled={selected.length === 0}
            loading={loading}
            onClick={onConfirm}
          >
            Confirm booking
          </Button>
        </div>
      </div>
    </div>
  )
}
