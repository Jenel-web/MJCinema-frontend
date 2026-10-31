import type { BestShowtimeItem } from '../../../api'
import { Badge, Card, CardTitle, EmptyState, ErrorState, Skeleton } from '../../../components/ui'
import { formatPeso } from '../../../lib/format'
import type { Resource } from '../useApiResource'
import { slotIcon, slotLabel } from './slots'

/** Best showtimes by average revenue. Bars are relative to the largest value. */
export default function BestShowtimes({
  resource,
  onRetry,
}: {
  resource: Resource<BestShowtimeItem[]>
  onRetry: () => void
}) {
  return (
    <Card variant="solid" className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <CardTitle>Best showtimes</CardTitle>
        <Badge>By average revenue</Badge>
      </div>
      <div className="mt-4">
        {resource.status === 'loading' && (
          <div aria-busy="true" aria-label="Loading best showtimes" className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-11 border-0" />
            ))}
          </div>
        )}
        {resource.status === 'error' && (
          <ErrorState
            title="Can't load best showtimes"
            description="The server didn't respond. Check your connection and try again."
            onRetry={onRetry}
          />
        )}
        {resource.status === 'ok' &&
          (resource.data.length === 0 ? (
            <EmptyState title="No showtimes yet" description="Slots will rank here once tickets are sold." />
          ) : (
            <BestList items={resource.data} />
          ))}
      </div>
    </Card>
  )
}

function BestList({ items }: { items: BestShowtimeItem[] }) {
  const max = Math.max(0, ...items.map((i) => Number(i.averageRevenue) || 0))
  return (
    <ol className="divide-y divide-ln border-t border-ln">
      {items.map((item, i) => {
        const value = Number(item.averageRevenue) || 0
        return (
          <li key={`${item.slot}-${i}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5">
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-s3 text-xs font-semibold">
              {i + 1}
            </span>
            <span className="w-32 shrink-0 font-semibold">
              <span aria-hidden="true">{slotIcon(item.slot)}</span> {slotLabel(item.slot)}
            </span>
            <span
              role="img"
              aria-label={`${slotLabel(item.slot)} average revenue relative to the best slot`}
              className="h-2 min-w-24 flex-1 overflow-hidden rounded-[4px] bg-track"
            >
              <span
                className="block h-full rounded-[4px] bg-gd"
                style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
              />
            </span>
            <span className="min-w-24 text-right font-semibold">{formatPeso(value)}</span>
          </li>
        )
      })}
    </ol>
  )
}
