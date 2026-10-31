import { cn } from '../../lib/cn'

export interface ArtCardProps {
  /** Hue 0-360 (2 red, 32 orange, 160 green, 212 blue, 275 purple, 340 pink). */
  hue: number
  className?: string
}

/**
 * Decorative abstract gradient card (2:3) for hero panels. No title, no data.
 * Never use it to stand in for a real movie poster: posters come from TMDB.
 */
export default function ArtCard({ hue, className }: ArtCardProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('aspect-[2/3] rounded-ctl border border-ln2', className)}
      style={{
        backgroundImage: `radial-gradient(110% 70% at 75% 8%, hsl(${hue} 75% 48%), transparent 62%), linear-gradient(180deg, hsl(${hue} 45% 20%), hsl(${hue} 55% 7%))`,
      }}
    />
  )
}
