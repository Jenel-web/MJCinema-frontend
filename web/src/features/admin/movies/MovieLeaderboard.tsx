import type { MovieLeaderboardItem } from '../../../api'
import { Badge, Card, CardTitle, EmptyState, ErrorState, Skeleton } from '../../../components/ui'
import { formatPeso } from '../../../lib/format'
import type { Resource } from '../useApiResource'

/** Every item the API returns; bar width is relative to the top revenue. */
export default function MovieLeaderboard({
  resource,
  onRetry,
}: {
  resource: Resource<MovieLeaderboardItem[]>
  onRetry: () => void
}) {
  return (
    <Card className="min-w-0 lg:col-span-2">
      <div className="mb-4 flex items-center justify-between gap-3">
        <CardTitle>Movie leaderboard</CardTitle>
        <Badge>By revenue</Badge>
      </div>
      {resource.status === 'loading' && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}
      {resource.status === 'error' && (
        <ErrorState title="Can't load the leaderboard" description="Failed to load." onRetry={onRetry} />
      )}
      {resource.status === 'ok' &&
        (resource.data.length === 0 ? (
          <EmptyState title="No revenue yet" description="Movies appear here once tickets are sold." />
        ) : (
          <ol className="border-t border-ln">
            {resource.data.map((movie, i) => {
              const top = Number(resource.data[0].revenue)
              const width = top > 0 ? (Number(movie.revenue) / top) * 100 : 0
              return (
                <li
                  key={`${movie.title}-${i}`}
                  className="flex min-h-[55px] items-center gap-3 border-b border-ln py-2 last:border-b-0 sm:gap-4"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-s3 text-xs font-semibold">
                    {i + 1}
                  </span>
                  <span className="w-24 shrink-0 truncate text-sm font-semibold sm:w-40" title={movie.title}>
                    {movie.title}
                  </span>
                  <span className="h-2 min-w-8 flex-1 overflow-hidden rounded bg-track">
                    <span className="block h-full rounded bg-rd" style={{ width: `${width}%` }} />
                  </span>
                  <span className="w-[88px] shrink-0 text-right text-sm font-semibold sm:w-28">
                    {formatPeso(movie.revenue)}
                  </span>
                </li>
              )
            })}
          </ol>
        ))}
    </Card>
  )
}
