import { useEffect, useState, type ComponentType, type SVGProps } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '../../api'
import { Logo } from '../../components/ui'
import {
  CalendarIcon,
  CloseIcon,
  HomeIcon,
  LogoutIcon,
  MenuIcon,
  SettingsIcon,
  TicketIcon,
  UsersIcon,
} from '../../components/ui/icons'
import { cn } from '../../lib/cn'

type Icon = ComponentType<SVGProps<SVGSVGElement>>

const NAV: { to: string; label: string; icon: Icon; end?: boolean }[] = [
  { to: '/admin', label: 'Home', icon: HomeIcon, end: true },
  { to: '/admin/movies', label: 'Movies', icon: CalendarIcon },
  { to: '/admin/schedules', label: 'Schedules', icon: CalendarIcon },
  { to: '/admin/bookings', label: 'Bookings', icon: TicketIcon },
  { to: '/admin/users', label: 'Users', icon: UsersIcon },
]

const itemBase =
  'flex h-11 w-full items-center gap-3 rounded-full border px-4 text-[15px] font-medium transition duration-150 ease-out'

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate()

  function handleLogout() {
    logout() // localStorage.clear(), same as the dashboard logout
    navigate('/')
  }

  return (
    <div className="flex h-full flex-col px-4 pt-6 pb-6">
      <div className="px-2">
        <Logo size={28} />
      </div>
      <nav aria-label="Admin" className="mt-4 flex flex-col gap-1">
        <p className="px-3 pb-1 text-[13px] text-mu">Manage</p>
        {NAV.map(({ to, label, icon: NavIcon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                itemBase,
                isActive
                  ? 'border-rd-line bg-rd-tint text-tx'
                  : 'border-transparent text-mu hover:bg-s3 hover:text-tx',
              )
            }
          >
            {({ isActive }) => (
              <>
                <NavIcon className={cn('text-xl', isActive && 'text-rd2')} />
                {label}
              </>
            )}
          </NavLink>
        ))}
        <p className="mt-4 px-3 pb-1 text-[13px] text-mu">Help center</p>
        {/* No behaviour (legacy and md section 10.2). */}
        <button type="button" className={cn(itemBase, 'border-transparent text-mu hover:bg-s3 hover:text-tx')}>
          <SettingsIcon className="text-xl" />
          Settings
        </button>
      </nav>
      <button
        type="button"
        onClick={handleLogout}
        className={cn(itemBase, 'mt-auto border-transparent text-err hover:bg-s3')}
      >
        <LogoutIcon className="text-xl" />
        Logout
      </button>
    </div>
  )
}

/** Admin shell: 248px sidebar on desktop, top bar + drawer below lg. No route guard (as legacy). */
export default function AdminLayout() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 border-r border-ln bg-s1/70 lg:block">
        <Sidebar />
      </aside>

      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ln bg-bg px-4 lg:hidden">
        <Logo size={24} />
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="inline-flex size-11 items-center justify-center rounded-full border border-ln bg-s1 text-xl hover:bg-s3"
        >
          <MenuIcon />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="animate-fade absolute inset-0 bg-scrim" onClick={() => setOpen(false)} />
          <aside className="animate-fade absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-ln2 bg-s1">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-3 inline-flex size-9 items-center justify-center rounded-full text-lg text-mu hover:bg-s3 hover:text-tx"
            >
              <CloseIcon />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <main className="page-glow min-w-0 flex-1 px-4 pt-6 pb-12 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
