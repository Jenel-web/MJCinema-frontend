import { useRef, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'

export interface TabItem<T extends string = string> {
  value: T
  label: string
  /** Small count pill after the label (e.g. tickets per status). */
  count?: number
}

export interface TabsProps<T extends string = string> {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  /** tab: segmented pill, active = light fill (bookings). chip: separate pills, active = red (filters, nav-like). */
  variant?: 'tab' | 'chip'
  'aria-label': string
  className?: string
}

/** Controlled tab list with arrow-key navigation. Consumers render the matching panel. */
export default function Tabs<T extends string>({
  items,
  value,
  onChange,
  variant = 'tab',
  className,
  'aria-label': ariaLabel,
}: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    let next = index
    if (e.key === 'ArrowRight') next = (index + 1) % items.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else return
    e.preventDefault()
    onChange(items[next].value)
    refs.current[next]?.focus()
  }

  const isTab = variant === 'tab'

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex max-w-full overflow-x-auto',
        isTab ? 'gap-1 rounded-full border border-ln bg-chip p-1' : 'gap-2',
        className,
      )}
    >
      {items.map((item, i) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-full font-medium whitespace-nowrap',
              'transition duration-150 ease-out',
              isTab ? 'h-11 px-5 text-[15px]' : 'h-9 border px-4 text-sm',
              active
                ? isTab
                  ? 'bg-tx text-bg'
                  : 'border-rd bg-rd text-white'
                : isTab
                  ? 'text-mu hover:text-tx'
                  : 'border-ln bg-chip text-mu hover:bg-s3 hover:text-tx',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
                  active && isTab ? 'bg-bg/15 text-bg' : 'bg-s3 text-mu',
                  active && !isTab && 'bg-white/20 text-white',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
