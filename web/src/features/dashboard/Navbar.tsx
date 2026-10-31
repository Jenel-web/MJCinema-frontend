import { Logo } from '../../components/ui'
import { cn } from '../../lib/cn'
import ProfileMenu from './ProfileMenu'
import { TAB_LABELS, type DashboardTab } from './types'

const TABS: DashboardTab[] = ['now', 'soon', 'cinema']

interface NavbarProps {
  tab: DashboardTab
  onTab: (tab: DashboardTab) => void
}

/**
 * Top bar: logo, Now Showing / Coming Soon / Cinema, profile menu.
 * On mobile the links drop to a second row (the mobile design has no other way to switch views).
 */
export default function Navbar({ tab, onTab }: NavbarProps) {
  return (
    <header className="border-b border-ln bg-bg">
      <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-x-8 px-4 md:h-[72px] md:flex-nowrap md:px-10">
        <div className="flex h-16 flex-1 items-center md:h-auto md:flex-none">
          <Logo size={30} />
        </div>

        <nav
          aria-label="Main"
          className="order-last -mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto border-t border-ln px-3 md:order-none md:mx-0 md:h-full md:w-auto md:flex-1 md:gap-2 md:overflow-visible md:border-t-0 md:px-0"
        >
          {TABS.map((t) => {
            const active = t === tab
            return (
              <button
                key={t}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onTab(t)}
                className={cn(
                  'relative flex h-12 shrink-0 items-center px-4 text-[15px] font-medium transition duration-150 ease-out md:h-full',
                  active ? 'text-tx' : 'text-mu hover:text-tx',
                  active && 'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-rd',
                )}
              >
                {TAB_LABELS[t]}
              </button>
            )
          })}
        </nav>

        <ProfileMenu />
      </div>
    </header>
  )
}
