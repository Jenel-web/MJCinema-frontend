import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface SlotChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  /** md 44 (time slots), lg 48 (dates). */
  size?: 'md' | 'lg'
}

/** Selectable rounded chip (radius 12) for date and time-slot pickers. Selected = red. */
export default function SlotChip({
  selected = false,
  size = 'md',
  className,
  type = 'button',
  ...rest
}: SlotChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-ctl border text-sm font-semibold whitespace-nowrap',
        'transition duration-150 ease-out',
        size === 'lg' ? 'h-12 px-5' : 'h-11 px-4',
        selected
          ? 'border-rd bg-rd text-white hover:bg-rd2'
          : 'border-ln bg-s2 text-tx hover:bg-s3',
        className,
      )}
      {...rest}
    />
  )
}
