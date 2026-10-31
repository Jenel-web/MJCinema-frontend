import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout, STORAGE_KEYS } from '../../api'
import { Avatar } from '../../components/ui'
import { ChevronDownIcon, LogoutIcon, TicketIcon, UserIcon } from '../../components/ui/icons'
import { cn } from '../../lib/cn'

const itemClass =
  'flex h-11 w-full items-center gap-3 rounded-ctl px-3 text-left text-[15px] transition duration-150 ease-out hover:bg-s3'

/** Avatar + username button with the My bookings / Profile / Logout dropdown. */
export default function ProfileMenu() {
  const navigate = useNavigate()
  const username = localStorage.getItem(STORAGE_KEYS.username)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Legacy: clicking anywhere outside the button and the menu closes it. Esc closes too.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function handleLogout() {
    logout() // localStorage.clear()
    navigate('/')
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={username ? `Account menu, ${username}` : 'Account menu'}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-11 items-center gap-2.5 rounded-full border border-ln bg-s1 pr-1 pl-1 transition duration-150 ease-out hover:bg-s3',
          'md:pr-3.5',
          open && 'border-ln2',
        )}
      >
        <Avatar name={username} className="size-9 md:size-8" />
        <span className="hidden max-w-[140px] truncate text-sm font-semibold md:inline">
          {username ?? 'Account'}
        </span>
        <ChevronDownIcon
          className={cn('hidden text-mu transition-transform duration-150 md:block', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="animate-rise absolute top-[calc(100%+8px)] right-0 z-40 w-60 rounded-card border border-ln2 bg-s1 p-2"
        >
          <button role="menuitem" type="button" className={itemClass} onClick={() => navigate('/tickets')}>
            <TicketIcon className="text-lg text-mu" />
            My bookings
          </button>
          {/* Not implemented in the legacy app either: no behaviour. */}
          <button role="menuitem" type="button" className={itemClass}>
            <UserIcon className="text-lg text-mu" />
            Profile
          </button>
          <div className="my-1.5 h-px bg-ln" />
          <button role="menuitem" type="button" className={cn(itemClass, 'text-err')} onClick={handleLogout}>
            <LogoutIcon className="text-lg" />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}
