import { useLocation } from 'react-router-dom'
import {
  getRevenueToday,
  getSalesTrend,
  getTotalBookings,
  getTotalSales,
  getTotalUsers,
} from '../../api'
import { Card, CardTitle, EmptyState, ErrorState, Skeleton } from '../../components/ui'
import AdminPageHeader from '../../features/admin/AdminPageHeader'
import SalesChart from '../../features/admin/SalesChart'
import StatCard from '../../features/admin/StatCard'
import { useApiResource } from '../../features/admin/useApiResource'
import { formatCount, formatPeso } from '../../lib/format'

export default function AdminHomePage() {
  // Clicking Home while on /admin pushes a new location key, which reloads everything (legacy loadHome).
  const { key } = useLocation()
  const [sales] = useApiResource(getTotalSales, key)
  const [bookings] = useApiResource(getTotalBookings, key)
  const [users] = useApiResource(getTotalUsers, key)
  const [revenue] = useApiResource(getRevenueToday, key)
  const [trend, reloadTrend] = useApiResource(getSalesTrend, key)

  return (
    <>
      <AdminPageHeader title="Home" />
      <section aria-label="Totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total sales" resource={sales} format={formatPeso} />
        <StatCard label="Total bookings" resource={bookings} format={formatCount} />
        <StatCard label="Total users" resource={users} format={formatCount} />
        <StatCard label="Today's revenue" resource={revenue} format={formatPeso} />
      </section>

      <Card variant="solid" className="mt-6 min-w-0">
        <CardTitle>Weekly sales</CardTitle>
        <p className="mt-1.5 mb-6 text-sm text-mu">Bookings per week</p>
        {trend.status === 'loading' && <Skeleton className="h-[260px] w-full" />}
        {trend.status === 'error' && (
          <ErrorState
            title="Can't load weekly sales"
            description="The server didn't respond. Check your connection and try again."
            onRetry={reloadTrend}
          />
        )}
        {trend.status === 'ok' &&
          (Object.keys(trend.data ?? {}).length === 0 ? (
            <EmptyState title="No sales yet" description="Weekly bookings will show here once tickets are sold." />
          ) : (
            <SalesChart data={trend.data} />
          ))}
      </Card>
    </>
  )
}
