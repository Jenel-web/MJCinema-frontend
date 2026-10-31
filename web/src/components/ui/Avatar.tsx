import { cn } from '../../lib/cn'

export interface AvatarProps {
  /** Name the initial is taken from. */
  name?: string | null
  className?: string
}

/** Round red avatar with the first letter of the name (44px touch size on mobile buttons wraps it). */
export default function Avatar({ name, className }: AvatarProps) {
  const initial = name?.trim().charAt(0).toUpperCase() || '?'
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-rd text-sm font-bold text-white',
        className,
      )}
    >
      {initial}
    </span>
  )
}
