import type { Movie } from '../../api'
import { Button, Poster } from '../../components/ui'
import { ChevronRightIcon } from '../../components/ui/icons'
import { Rating } from './MovieCard'

interface HeroProps {
  movie: Movie
  onBook: () => void
  onDetails: () => void
}

/** Featured movie: the first item of GET /schedule/now-showing. */
export default function Hero({ movie, onBook, onDetails }: HeroProps) {
  return (
    <section
      aria-label="Featured movie"
      className="hero-glow md:border-b md:border-ln"
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-10 md:py-0">
        <div className="relative rounded-[20px] border border-ln bg-linear-to-b from-rd-tint to-transparent p-5 md:min-h-[560px] md:rounded-none md:border-0 md:bg-none md:p-0 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-10">
          <div className="flex flex-col items-start py-6 md:py-16 lg:max-w-[640px]">
            <span className="inline-flex h-9 items-center rounded-full bg-rd px-4 text-sm font-semibold text-white">
              Featured
            </span>
            <h2 className="heading mt-6 line-clamp-3 max-w-full text-[44px] leading-[0.92] break-words md:mt-8 md:max-w-[480px] md:text-[clamp(64px,8vw,104px)]">
              {movie.title}
            </h2>
            <p className="mt-5 flex items-center gap-3 text-[15px] text-mu">
              <Rating value={movie.rating} />
              <span>Now showing</span>
            </p>
            {movie.overview && (
              <p className="mt-5 hidden max-w-[460px] text-[17px] leading-[26px] text-mu line-clamp-3 md:block">
                {movie.overview}
              </p>
            )}
            <div className="mt-6 flex w-full gap-3 md:mt-8 md:w-auto">
              <div className="flex-1 md:flex-none">
                <Button size="lg" fullWidth className="md:px-8" onClick={onBook}>
                  Book seats
                </Button>
              </div>
              {/* Wrappers (not className) switch these: Button sets its own display. */}
              <div className="hidden md:block">
                <Button variant="ghost" size="lg" className="px-8" onClick={onDetails}>
                  View details
                </Button>
              </div>
              <div className="md:hidden">
                <Button variant="ghost" size="lg" iconOnly aria-label="View details" onClick={onDetails}>
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          </div>

          <div aria-hidden="true" className="hidden justify-self-end py-12 pr-24 lg:block">
            <Poster src={movie.poster} alt="" className="w-[300px] rotate-2" />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Loading placeholder for the hero (desktop only, like the hero art itself). */
export function HeroSkeleton() {
  return (
    <section aria-hidden="true" className="hidden border-b border-ln md:block">
      <div className="mx-auto h-[420px] w-full max-w-[1280px] px-10 py-10">
        <div className="h-full rounded-card border border-ln bg-linear-to-b from-s2 to-s1" />
      </div>
    </section>
  )
}
