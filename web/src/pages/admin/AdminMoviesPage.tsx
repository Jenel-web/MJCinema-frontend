import { useState } from 'react'
import { getActiveMovieCount, getMovieLeaderboard, getMovieTable } from '../../api'
import { Button } from '../../components/ui'
import { PlusIcon } from '../../components/ui/icons'
import AdminPageHeader from '../../features/admin/AdminPageHeader'
import ActiveMoviesCard from '../../features/admin/movies/ActiveMoviesCard'
import AddMovieModal from '../../features/admin/movies/AddMovieModal'
import AllMoviesTable from '../../features/admin/movies/AllMoviesTable'
import MovieLeaderboard from '../../features/admin/movies/MovieLeaderboard'
import { useApiResource } from '../../features/admin/useApiResource'

export default function AdminMoviesPage() {
  const [leaderboard, reloadLeaderboard] = useApiResource(getMovieLeaderboard)
  const [count, reloadCount] = useApiResource(getActiveMovieCount)
  const [table, reloadTable] = useApiResource(getMovieTable)
  const [adding, setAdding] = useState(false)

  return (
    <>
      <AdminPageHeader
        title="Movies"
        actions={
          <Button onClick={() => setAdding(true)}>
            <PlusIcon className="text-lg" />
            Add movie
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <MovieLeaderboard resource={leaderboard} onRetry={reloadLeaderboard} />
        <ActiveMoviesCard resource={count} />
      </div>
      <AllMoviesTable resource={table} onRetry={reloadTable} />
      <AddMovieModal
        open={adding}
        onClose={() => setAdding(false)}
        onAdded={() => {
          reloadTable()
          reloadCount()
          reloadLeaderboard()
        }}
      />
    </>
  )
}
