import { useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { posterUrl } from '../../lib/format'

export interface PosterProps {
  /** `movie.poster` from the API (TMDB path). */
  src?: string | null
  /** Movie title, used as the alt text. */
  alt: string
  /** Shown centered when there is no poster or it fails to load (e.g. an icon). */
  fallback?: ReactNode
  className?: string
}

/**
 * Real movie poster (2:3) from TMDB. While it loads, or if there is none or it fails,
 * a neutral surface shows. Never substitute generated art for a poster.
 */
export default function Poster({ src, alt, fallback, className }: PosterProps) {
  const url = posterUrl(src)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const failed = !url || failedUrl === url

  return (
    <div
      className={cn(
        'relative aspect-[2/3] overflow-hidden rounded-ctl border border-ln2 bg-linear-to-b from-s3 to-s1',
        className,
      )}
    >
      {failed && fallback && (
        <div className="absolute inset-0 flex items-center justify-center text-xl text-mu">{fallback}</div>
      )}
      {!failed && (
        <img
          src={url}
          alt={alt}
          loading="lazy"
          onError={() => setFailedUrl(url)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </div>
  )
}
