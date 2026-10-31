import { cn } from '../../lib/cn'

/**
 * Loading placeholder. Static on purpose: the design says nothing animates on its own.
 * Size it with className, e.g. `aspect-[2/3]` for a poster or `h-4 w-32` for a text line.
 */
export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('rounded-ctl border border-ln bg-linear-to-b from-s3 to-s1', className)}
    />
  )
}
