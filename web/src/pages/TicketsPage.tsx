import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cancelTicket, STORAGE_KEYS, type TicketStatus } from '../api'
import {
  Avatar,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Logo,
  Skeleton,
  StatusDialog,
  Tabs,
} from '../components/ui'
import { ChevronLeftIcon } from '../components/ui/icons'
import BookingCard from '../features/tickets/BookingCard'
import {
  countByStatus,
  groupTickets,
  seatsWithStatus,
  TICKET_TABS,
} from '../features/tickets/groupTickets'
import { useTicketsData } from '../features/tickets/useTicketsData'
import { formatPeso } from '../lib/format'

const container = 'mx-auto w-full max-w-[1000px] px-4 md:px-10'

const TAB_LABEL: Record<TicketStatus, string> = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

const EMPTY_COPY: Record<TicketStatus, { title: string; description: string }> = {
  ACTIVE: { title: 'No active bookings', description: 'Bookings you make will show up here.' },
  COMPLETED: { title: 'No completed bookings', description: 'Shows you have watched will show up here.' },
  CANCELLED: { title: 'No cancelled bookings', description: 'Bookings you cancel will show up here.' },
}

interface ResultState {
  ok: boolean
  message: string
}

function TicketsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading tickets" className="flex flex-col gap-4">
      {[0, 1].map((i) => (
        <Skeleton key={i} className="h-[112px] rounded-card md:h-[130px]" />
      ))}
    </div>
  )
}

function Header({ children }: { children?: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <header className="page-glow border-b border-ln">
      <div className={`${container} flex items-center gap-4 py-4 md:py-5`}>
        <Button variant="ghost" aria-label="Back" className="max-md:size-11 max-md:px-0" onClick={() => navigate(-1)}>
          <ChevronLeftIcon className="text-lg" />
          <span className="max-md:sr-only">Back</span>
        </Button>
        {children}
        <div className="ml-auto max-md:hidden">
          <Logo size={30} />
        </div>
      </div>
    </header>
  )
}

export default function TicketsPage() {
  const navigate = useNavigate()
  const [userId] = useState(() => localStorage.getItem(STORAGE_KEYS.userId))
  const { tickets, user, reload, reloadTickets } = useTicketsData(userId)

  const [tab, setTab] = useState<TicketStatus>('ACTIVE')
  // null = nothing toggled yet: the first visible card starts expanded (as in the design).
  const [openKeys, setOpenKeys] = useState<Set<string> | null>(null)
  const [pendingCode, setPendingCode] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [result, setResult] = useState<ResultState | null>(null)

  const groups = useMemo(() => (tickets.status === 'ready' ? groupTickets(tickets.tickets) : []), [tickets])
  const visible = groups.filter((g) => seatsWithStatus(g, tab).length > 0)
  const isOpen = (key: string) => (openKeys ? openKeys.has(key) : key === visible[0]?.key)

  function toggle(key: string) {
    const next = new Set(openKeys ?? (visible[0] ? [visible[0].key] : []))
    if (!next.delete(key)) next.add(key)
    setOpenKeys(next)
  }

  async function handleCancel() {
    if (!pendingCode) return
    setCancelling(true)
    try {
      const res = await cancelTicket(pendingCode)
      setPendingCode(null)
      if (res.ok) {
        setResult({ ok: true, message: 'Ticket cancelled successfully.' })
        void reloadTickets() // the balance is not reloaded (as legacy)
      } else {
        setResult({ ok: false, message: `Error: ${res.message || 'Failed to cancel'}` })
      }
    } catch (error) {
      // Legacy: a network error is only logged (no dialog).
      console.error(error)
      setPendingCode(null)
    } finally {
      setCancelling(false)
    }
  }

  if (!userId) {
    return (
      <div className="min-h-dvh bg-bg pb-16">
        <Header />
        <main className={`${container} py-10`}>
          <EmptyState
            eyebrow="Logged out"
            title="Log in to see your tickets"
            description="Please log in to view your tickets."
            action={<Button onClick={() => navigate('/')}>Log in</Button>}
          />
        </main>
      </div>
    )
  }

  const userName = user.status === 'ready' ? user.user.username : user.status === 'failed' ? 'Profile' : null
  const balance =
    user.status === 'ready' ? (
      <span className="heading text-gd">{formatPeso(user.user.balance)}</span>
    ) : user.status === 'loading' ? (
      <Skeleton className="h-8 w-28 border-0" />
    ) : null

  return (
    <div className="min-h-dvh bg-bg pb-16">
      <Header>
        <h1 className="heading text-[32px] md:hidden">My bookings</h1>
      </Header>

      <main className={`${container} py-6 md:py-10`}>
        <section
          aria-label="Profile"
          className="flex items-center gap-4 max-md:glass max-md:rounded-card max-md:p-4 md:justify-between"
        >
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <Avatar name={userName} className="size-[60px] text-2xl max-md:size-[52px] max-md:text-xl" />
            <div className="min-w-0">
              <h1 className="heading text-[44px] max-md:hidden">My bookings</h1>
              {userName === null ? (
                <Skeleton className="h-4 w-24 border-0" />
              ) : (
                <p className="truncate text-sm text-mu max-md:text-base max-md:font-semibold max-md:text-tx">
                  {userName}
                </p>
              )}
              <p className="mt-0.5 text-sm text-mu md:hidden">Balance</p>
            </div>
          </div>
          <div className="text-[28px] md:hidden">{balance}</div>
          <div className="min-w-[184px] rounded-card glass px-5 py-4 max-md:hidden">
            <p className="text-sm text-mu">Balance</p>
            <div className="mt-1 text-[36px]">{balance}</div>
          </div>
        </section>

        <div className="mt-6 md:mt-8">
          <Tabs<TicketStatus>
            aria-label="Booking status"
            value={tab}
            onChange={setTab}
            className="max-md:flex max-md:w-full max-md:[&>button]:flex-1 max-md:[&>button]:justify-center max-md:[&>button]:gap-1.5 max-md:[&>button]:px-2!"
            items={TICKET_TABS.map((value) => ({
              value,
              label: TAB_LABEL[value],
              count: tickets.status === 'ready' ? countByStatus(groups, value) : undefined,
            }))}
          />
        </div>

        <div className="mt-6" role="tabpanel" aria-label={`${TAB_LABEL[tab]} bookings`}>
          {tickets.status === 'loading' && <TicketsSkeleton />}
          {tickets.status === 'error' && (
            <ErrorState
              title="Can't load tickets"
              description="Error loading tickets. Please try again later."
              onRetry={reload}
            />
          )}
          {tickets.status === 'ready' &&
            (visible.length === 0 ? (
              <EmptyState eyebrow="Empty tab" {...EMPTY_COPY[tab]} />
            ) : (
              <ul className="flex flex-col gap-4">
                {visible.map((group) => (
                  <BookingCard
                    key={group.key}
                    group={group}
                    seats={seatsWithStatus(group, tab)}
                    open={isOpen(group.key)}
                    onToggle={() => toggle(group.key)}
                    onCancelSeat={setPendingCode}
                  />
                ))}
              </ul>
            ))}
        </div>
      </main>

      <ConfirmDialog
        open={pendingCode !== null}
        title="Cancel this booking?"
        description={
          <>
            Ticket: <span className="ticket-code text-tx">{pendingCode}</span>
            <br />
            Do you wish to cancel this booking? This action cannot be undone.
          </>
        }
        cancelLabel="Keep booking"
        confirmLabel="Cancel booking"
        loading={cancelling}
        onCancel={() => setPendingCode(null)}
        onConfirm={handleCancel}
      />

      <StatusDialog
        open={result !== null}
        tone={result?.ok ? 'success' : 'error'}
        title={result?.ok ? 'Booking cancelled' : 'Cancel failed'}
        message={result?.message ?? ''}
        actionLabel="Done"
        onAction={() => setResult(null)}
      />
    </div>
  )
}
