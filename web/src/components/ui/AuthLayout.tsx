import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import ArtCard from './ArtCard'
import Logo from './Logo'

export interface AuthLayoutProps {
  /** Hero headline. Use <br /> for the desktop line break. */
  headline: ReactNode
  description: string
  /** Hues of the three decorative cards: left, middle (front), right. */
  art: [number, number, number]
  /** Heading above the form on desktop (hidden on mobile, where the headline leads). */
  title: string
  /** Applied to the card, e.g. the shake animation. */
  cardClassName?: string
  children: ReactNode
}

/**
 * Two-panel auth screen shared by Login and Register: brand panel (logo, decorative art, headline)
 * on the left, form on the right. On mobile it stacks without the card chrome.
 */
export default function AuthLayout({
  headline,
  description,
  art,
  title,
  cardClassName,
  children,
}: AuthLayoutProps) {
  const [left, middle, right] = art
  return (
    <main className="page-glow flex min-h-dvh px-4 py-8 md:items-center md:justify-center md:px-10 md:py-12">
      <div
        className={cn(
          'w-full max-w-[1200px] md:grid md:min-h-[620px] md:grid-cols-2 md:overflow-hidden',
          'md:rounded-auth md:border md:border-ln',
          cardClassName,
        )}
      >
        <section className="flex flex-col md:page-glow md:p-12">
          <Logo size={30} />

          {/* Desktop: three overlapping cards (positioned by wrappers) */}
          <div aria-hidden="true" className="relative mt-10 hidden h-[246px] w-[380px] md:block">
            <div className="absolute top-9 left-0 z-10 w-[140px]">
              <ArtCard hue={left} />
            </div>
            <div className="absolute top-0 left-[120px] z-20 w-[140px]">
              <ArtCard hue={middle} />
            </div>
            <div className="absolute top-3 left-[240px] z-30 w-[140px]">
              <ArtCard hue={right} />
            </div>
          </div>

          {/* Mobile: row of three, middle one larger */}
          <div aria-hidden="true" className="mt-8 flex items-center justify-center gap-3 md:hidden">
            <ArtCard hue={left} className="w-[26%]" />
            <ArtCard hue={middle} className="w-[32%]" />
            <ArtCard hue={right} className="w-[26%]" />
          </div>

          <h1 className="heading mt-6 max-w-[420px] text-[44px] md:mt-8 md:max-w-none md:text-[64px] md:leading-[0.95]">
            {headline}
          </h1>
          <p className="mt-4 hidden max-w-[360px] text-[17px] leading-[26px] text-mu md:block">
            {description}
          </p>
        </section>

        <section className="mt-6 flex flex-col justify-center md:mt-0 md:bg-s1 md:p-12 lg:p-14">
          <h2 className="heading mb-8 hidden text-[48px] md:block">{title}</h2>
          {children}
        </section>
      </div>
    </main>
  )
}
