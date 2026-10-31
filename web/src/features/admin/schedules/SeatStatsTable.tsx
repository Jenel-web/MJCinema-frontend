import type { SeatStatsRow } from '../../../api'
import {
  Card,
  CardTitle,
  EmptyState,
  ErrorState,
  Skeleton,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '../../../components/ui'
import { cn } from '../../../lib/cn'
import { formatReleaseDate } from '../../../lib/format'
import type { Resource } from '../useApiResource'
import { slotIcon, slotLabel } from './slots'

/** tokens.md progress bar: green at 80% and above, gold at 50% and above, red below. */
const barTone = (pct: number) => (pct >= 80 ? 'bg-ok' : pct >= 50 ? 'bg-gd' : 'bg-rd2')

function OccupancyBar({ percentage }: { percentage: number }) {
  const pct = Number(percentage) || 0
  return (
    <div className="flex min-w-[180px] items-center gap-3">
      <span className="h-2 flex-1 overflow-hidden rounded-[4px] bg-track">
        <span
          className={cn('block h-full rounded-[4px]', barTone(pct))}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </span>
      <span className="w-14 text-right font-semibold">{pct.toFixed(1)}%</span>
    </div>
  )
}

export default function SeatStatsTable({
  resource,
  onRetry,
}: {
  resource: Resource<SeatStatsRow[]>
  onRetry: () => void
}) {
  return (
    <Card variant="solid" className="mt-6 min-w-0">
      <CardTitle>Seat stats</CardTitle>
      <div className="mt-5">
        {resource.status === 'loading' && (
          <div aria-busy="true" aria-label="Loading seat stats" className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[52px] border-0" />
            ))}
          </div>
        )}
        {resource.status === 'error' && (
          <ErrorState
            title="Can't load seat stats"
            description="The server didn't respond. Check your connection and try again."
            onRetry={onRetry}
          />
        )}
        {resource.status === 'ok' &&
          (resource.data.length === 0 ? (
            <EmptyState title="No active schedules found." description="Add a schedule to see its seat stats." />
          ) : (
            <Table aria-label="Seat stats">
              <Thead>
                <Tr className="border-0">
                  <Th>Title</Th>
                  <Th>Cinema</Th>
                  <Th>Show date</Th>
                  <Th>Slot</Th>
                  <Th align="right">Occupied</Th>
                  <Th align="right">Available</Th>
                  <Th>Occupancy</Th>
                </Tr>
              </Thead>
              <Tbody>
                {resource.data.map((row, i) => (
                  <Tr key={`${row.title}-${row.cinemaName}-${row.showDate}-${row.slot}-${i}`}>
                    <Td className="font-semibold whitespace-nowrap">{row.title}</Td>
                    <Td className="whitespace-nowrap text-mu">{row.cinemaName}</Td>
                    <Td className="whitespace-nowrap text-mu">{formatReleaseDate(row.showDate)}</Td>
                    <Td className="whitespace-nowrap">
                      <span aria-hidden="true">{slotIcon(row.slot)}</span> {slotLabel(row.slot)}
                    </Td>
                    <Td align="right" className="font-semibold">
                      {row.occupiedSeats}
                    </Td>
                    <Td align="right" className="text-mu">
                      {row.availableSeats}
                    </Td>
                    <Td>
                      <OccupancyBar percentage={row.percentage} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ))}
      </div>
    </Card>
  )
}
