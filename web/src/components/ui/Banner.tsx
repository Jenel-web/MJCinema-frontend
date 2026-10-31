import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { AlertIcon, CheckIcon } from './icons'

export interface BannerProps {
  tone?: 'error' | 'success'
  children: ReactNode
  className?: string
}

/** Inline message banner (radius 12). Error: red tint. Success: green tint. */
export default function Banner({ tone = 'error', children, className }: BannerProps) {
  const isError = tone === 'error'
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={cn(
        'flex items-center gap-3 rounded-ctl border px-4 py-3.5 text-sm',
        isError
          ? 'border-err-line bg-err-tint text-err-banner'
          : 'border-ok-line bg-ok-tint text-ok-banner',
        className,
      )}
    >
      <span className="shrink-0 text-lg">{isError ? <AlertIcon /> : <CheckIcon />}</span>
      <span>{children}</span>
    </div>
  )
}
