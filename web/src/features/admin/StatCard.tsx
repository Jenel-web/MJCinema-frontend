import { Card, Skeleton } from '../../components/ui'
import type { Resource } from './useApiResource'

/** Admin stat card: label, then a skeleton while loading, the formatted value, or "N/A" on failure. */
export default function StatCard<T>({
  label,
  resource,
  format,
}: {
  label: string
  resource: Resource<T>
  format: (value: T) => string
}) {
  return (
    <Card variant="glass" padding="none" className="min-w-0 px-6 py-5">
      <p className="text-sm text-mu">{label}</p>
      <div className="mt-3 min-h-11">
        {resource.status === 'loading' && <Skeleton className="h-11 w-40 max-w-full" />}
        {resource.status === 'error' && (
          <p className="heading text-[44px] text-mu" title="Failed to load">
            N/A
          </p>
        )}
        {resource.status === 'ok' && (
          <p className="heading text-[44px] break-words">{format(resource.data)}</p>
        )}
      </div>
    </Card>
  )
}
