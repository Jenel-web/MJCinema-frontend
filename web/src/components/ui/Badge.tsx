import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/**
 * success: Active / Paid / Now showing. warning: Coming soon / Pending.
 * cancelled: Cancelled. neutral: Completed / Ended.
 */
export type BadgeTone = 'success' | 'warning' | 'cancelled' | 'neutral'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

const tones: Record<BadgeTone, string> = {
  success: 'bg-badge-ok text-ok',
  warning: 'bg-badge-wn text-wn',
  cancelled: 'bg-badge-cancel text-err',
  neutral: 'bg-badge-neutral text-mu',
}

export default function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap',
        tones[tone],
        className,
      )}
      {...rest}
    />
  )
}
