import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface StatePanelProps {
  /** Small muted label above the title (e.g. "Empty", "Error"). */
  eyebrow?: string
  title: string
  description?: ReactNode
  /** Button(s) under the text. */
  action?: ReactNode
  tone?: 'default' | 'error'
  className?: string
}

/** Shared layout for EmptyState and ErrorState. */
export default function StatePanel({
  eyebrow,
  title,
  description,
  action,
  tone = 'default',
  className,
}: StatePanelProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-card border bg-s1 px-6 py-10 text-center',
        tone === 'error' ? 'border-err-line' : 'border-ln',
        className,
      )}
    >
      {eyebrow && <p className="text-sm text-mu">{eyebrow}</p>}
      <h3 className={cn('heading text-[28px]', eyebrow && 'mt-3')}>{title}</h3>
      {description && <p className="mt-3 max-w-[34ch] text-[15px] text-mu">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
