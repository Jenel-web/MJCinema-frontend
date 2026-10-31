import type { SalesTrend } from '../../api'
import { formatWeekLabel } from '../../lib/format'

const PLOT_HEIGHT = 224
const COL_MIN = 52

/** Axis max and tick step from the data: about 4 intervals on a 1/2/5 step. */
function niceScale(max: number): { top: number; step: number } {
  if (!(max > 0)) return { top: 4, step: 1 }
  const raw = max / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const f = raw / pow
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow
  return { top: Math.ceil(max / step) * step, step }
}

/** Weekly bookings as gradient CSS bars (tokens.md: 34px wide, radius 8, #EF3A41 to #7D1217). */
export default function SalesChart({ data }: { data: SalesTrend }) {
  const entries = Object.entries(data).map(([key, value]) => ({
    key,
    label: formatWeekLabel(key),
    value: Number(value) || 0,
  }))
  const { top, step } = niceScale(Math.max(0, ...entries.map((e) => e.value)))
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
  const pct = (v: number) => `${(v / top) * 100}%`

  return (
    <div className="flex gap-3" role="img" aria-label="Weekly bookings bar chart">
      <div className="relative shrink-0" style={{ height: PLOT_HEIGHT, width: 32 }} aria-hidden="true">
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute right-0 translate-y-1/2 text-[13px] leading-none text-mu"
            style={{ bottom: pct(t) }}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="min-w-0 flex-1 overflow-x-auto">
        <div style={{ minWidth: entries.length * COL_MIN }}>
          <div className="relative" style={{ height: PLOT_HEIGHT }}>
            {ticks.map((t) => (
              <div key={t} className="absolute inset-x-0 h-px bg-ln" style={{ bottom: pct(t) }} />
            ))}
            <div className="absolute inset-0 flex items-end">
              {entries.map((e) => (
                <div key={e.key} className="flex h-full flex-1 items-end justify-center">
                  <div
                    title={`${e.label}: ${e.value} bookings`}
                    className="w-[34px] max-w-[70%] rounded-lg bg-linear-to-b from-rd2 to-rd-deep"
                    style={{ height: pct(e.value) }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 flex">
            {entries.map((e) => (
              <span key={e.key} className="flex-1 px-0.5 text-center text-xs leading-4 text-mu">
                {e.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
