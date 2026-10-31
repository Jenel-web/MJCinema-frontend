import type { CSSProperties } from 'react'
import { cn } from '../../lib/cn'

export interface PosterCardProps {
  title: string
  /** Hue 0-360 (2 red, 32 orange, 212 blue, 160 green, 275 purple, 340 pink, 48 gold, 190 teal). */
  hue: number
  className?: string
  style?: CSSProperties
}

/** Placeholder poster art (2:3). Use a real TMDB image where a movie exists. */
export default function PosterCard({ title, hue, className, style }: PosterCardProps) {
  return (
    <div
      className={cn(
        'relative flex aspect-[2/3] items-end overflow-hidden rounded-ctl border border-ln2 p-3',
        className,
      )}
      style={{
        backgroundImage: `radial-gradient(110% 70% at 75% 8%, hsl(${hue} 75% 48%), transparent 62%), linear-gradient(180deg, hsl(${hue} 45% 20%), hsl(${hue} 55% 7%))`,
        ...style,
      }}
    >
      <span className="heading text-[clamp(14px,1.6vw,20px)] leading-none text-tx">{title}</span>
    </div>
  )
}
