import { cn } from '../../lib/cn'

export interface LogoProps {
  /** Wordmark font size in px. Nav 30, compact 20, hero 132. The M mark scales with it. */
  size?: number
  className?: string
}

/** Custom M mark (viewBox 0 0 40 48) + "JCINEMA" in Barlow Condensed 800, projector red. */
export default function Logo({ size = 30, className }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="MJCinema"
      className={cn('inline-flex items-baseline font-display font-extrabold text-rd', className)}
      style={{ fontSize: size, lineHeight: 1, letterSpacing: '0.02em' }}
    >
      <svg
        viewBox="0 0 40 48"
        aria-hidden="true"
        style={{ height: size * 0.7, width: size * 0.6, marginRight: size * 0.02 }}
      >
        <path d="M0 0h9l11 22L31 0h9v48h-9V18L21 38h-2L9 18v30H0z" fill="var(--color-rd)" />
        <path d="M31 0 20 22l1 16 10-20z" fill="var(--color-rd-fold)" />
      </svg>
      <span aria-hidden="true">JCINEMA</span>
    </span>
  )
}
