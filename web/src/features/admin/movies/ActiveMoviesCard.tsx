import type { ActiveMovieCount } from '../../../api'
import { Card, Skeleton } from '../../../components/ui'
import { formatCount } from '../../../lib/format'
import type { Resource } from '../useApiResource'

/** Just the active count (no "added this week" or coming-soon line: no data source). */
export default function ActiveMoviesCard({ resource }: { resource: Resource<ActiveMovieCount> }) {
  return (
    <Card variant="glass" className="flex min-w-0 flex-col justify-center">
      <p className="text-sm text-mu">Active movies</p>
      <div className="mt-3 min-h-14">
        {resource.status === 'loading' && <Skeleton className="h-14 w-24" />}
        {resource.status === 'error' && (
          <p className="heading text-[56px] text-mu" title="Failed to load">
            N/A
          </p>
        )}
        {resource.status === 'ok' && (
          <p className="heading text-[56px]">
            {formatCount(typeof resource.data === 'number' ? resource.data : resource.data?.activeCount)}
          </p>
        )}
      </div>
    </Card>
  )
}
