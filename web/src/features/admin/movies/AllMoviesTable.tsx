import { useState } from 'react'
import type { MovieStatus, MovieTableRow } from '../../../api'
import {
  Badge,
  Card,
  CardTitle,
  ErrorState,
  Input,
  Skeleton,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  type BadgeTone,
} from '../../../components/ui'
import { SearchIcon, StarIcon } from '../../../components/ui/icons'
import { formatPeso, formatRating, formatReleaseDate, statusLabel } from '../../../lib/format'
import type { Resource } from '../useApiResource'

const TONE: Partial<Record<MovieStatus, BadgeTone>> = {
  NOW_SHOWING: 'success',
  COMING_SOON: 'warning',
}

function Message({ children }: { children: string }) {
  return (
    <tr>
      <td colSpan={6} className="h-[104px] px-4 text-center text-mu">
        {children}
      </td>
    </tr>
  )
}

/** All rows, with a live client-side title filter (no paging). */
export default function AllMoviesTable({
  resource,
  onRetry,
}: {
  resource: Resource<MovieTableRow[]>
  onRetry: () => void
}) {
  const [query, setQuery] = useState('')
  const q = query.toLowerCase()
  const rows = resource.status === 'ok' ? resource.data.filter((m) => m.title.toLowerCase().includes(q)) : []

  return (
    <Card className="mt-6 min-w-0">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <CardTitle>All movies</CardTitle>
        <Input
          size="sm"
          aria-label="Search movies"
          placeholder="Search movies"
          leading={<SearchIcon />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full sm:w-60"
        />
      </div>
      {resource.status === 'error' ? (
        <ErrorState title="Can't load movies" description="Failed to load." onRetry={onRetry} />
      ) : (
        <Table className="min-w-[760px]">
          <Thead>
            <tr>
              <Th className="w-14">#</Th>
              <Th>Title</Th>
              <Th>Rating</Th>
              <Th>Release date</Th>
              <Th>Status</Th>
              <Th align="right">Revenue</Th>
            </tr>
          </Thead>
          <Tbody>
            {resource.status === 'loading' &&
              Array.from({ length: 5 }, (_, i) => (
                <Tr key={i}>
                  <Td colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </Td>
                </Tr>
              ))}
            {resource.status === 'ok' && rows.length === 0 && <Message>No movies found.</Message>}
            {rows.map((m, i) => {
              const rating = formatRating(m.rating)
              return (
                <Tr key={`${m.title}-${i}`}>
                  <Td className="text-mu">{i + 1}</Td>
                  <Td className="font-semibold">{m.title}</Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5 text-gd">
                      <StarIcon className="text-sm" />
                      {rating ?? '—'}
                    </span>
                  </Td>
                  <Td className="text-mu">{formatReleaseDate(m.releaseDate)}</Td>
                  <Td>
                    <Badge tone={TONE[m.status] ?? 'neutral'}>{statusLabel(String(m.status))}</Badge>
                  </Td>
                  <Td align="right" className="font-semibold">
                    {formatPeso(m.revenue)}
                  </Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
      )}
    </Card>
  )
}
