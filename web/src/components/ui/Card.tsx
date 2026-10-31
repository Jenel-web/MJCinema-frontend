import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** solid: --s1 surface. glass: white-to-transparent gradient (stat cards, hero panels). */
  variant?: 'solid' | 'glass'
  /** md 24 (cards), lg 28 (dialog-like panels), none. */
  padding?: 'none' | 'md' | 'lg'
}

const padding = { none: '', md: 'p-6', lg: 'p-7' } as const

/** Card: radius 16, 1px --ln border, no shadows. */
export function Card({ variant = 'solid', padding: pad = 'md', className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card',
        variant === 'glass' ? 'glass' : 'border border-ln bg-s1',
        padding[pad],
        className,
      )}
      {...rest}
    />
  )
}

/** Card heading: Barlow Condensed 800, 28. */
export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('heading text-[28px]', className)} {...rest} />
}

export default Card
