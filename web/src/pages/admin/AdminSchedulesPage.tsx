import { useState } from 'react'
import {
  getAverageRevenue,
  getBestShowtime,
  getScheduleCount,
  getSeatStats,
} from '../../api'
import { Button } from '../../components/ui'
import { PlusIcon } from '../../components/ui/icons'
import AdminPageHeader from '../../features/admin/AdminPageHeader'
import AddScheduleModal from '../../features/admin/schedules/AddScheduleModal'
import BestShowtimes from '../../features/admin/schedules/BestShowtimes'
import SeatStatsTable from '../../features/admin/schedules/SeatStatsTable'
import StatCard from '../../features/admin/StatCard'
import { useApiResource } from '../../features/admin/useApiResource'
import { formatCount, formatPeso } from '../../lib/format'

export default function AdminSchedulesPage() {
  // Bumping the key reloads all four resources (after a successful add, as legacy).
  const [reloadKey, setReloadKey] = useState(0)
  const [best, reloadBest] = useApiResource(getBestShowtime, reloadKey)
  const [count] = useApiResource(getScheduleCount, reloadKey)
  const [avg] = useApiResource(getAverageRevenue, reloadKey)
  const [stats, reloadStats] = useApiResource(getSeatStats, reloadKey)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <AdminPageHeader
        title="Schedules"
        actions={
          <Button size="md" onClick={() => setModalOpen(true)}>
            <PlusIcon className="text-lg" />
            Add schedule
          </Button>
        }
      />

      <section aria-label="Schedule summary" className="grid gap-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr]">
        <div className="md:col-span-2 xl:col-span-1">
          <BestShowtimes resource={best} onRetry={reloadBest} />
        </div>
        <StatCard label="Total schedules" resource={count} format={formatCount} />
        <StatCard label="Avg revenue per schedule" resource={avg} format={formatPeso} />
      </section>

      <SeatStatsTable resource={stats} onRetry={reloadStats} />

      <AddScheduleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdded={() => setReloadKey((n) => n + 1)}
      />
    </>
  )
}
