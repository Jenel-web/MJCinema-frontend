import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { CloseIcon } from './icons'

export type ModalSize = 'sm' | 'md' | 'lg'

export interface ModalProps {
  open: boolean
  onClose: () => void
  /** Rendered as the dialog heading (Barlow Condensed 32). */
  title?: ReactNode
  /** Required when there is no title. */
  'aria-label'?: string
  /** sm 460 (confirm, status), md 540 (add movie / schedule), lg 1040 (movie details). */
  size?: ModalSize
  /** Show the ✕ button. Default true. */
  showClose?: boolean
  /** Click on the scrim closes. Default true. */
  closeOnOverlay?: boolean
  /** Esc closes. Default true. */
  closeOnEsc?: boolean
  /** Default true. Pass false to supply your own padding inside (e.g. edge-to-edge sections). */
  padded?: boolean
  /** Below the md breakpoint the dialog becomes a full-screen sheet. */
  fullscreenOnMobile?: boolean
  className?: string
  children?: ReactNode
}

const sizes: Record<ModalSize, string> = {
  sm: 'max-w-dialog-sm',
  md: 'max-w-dialog-md',
  lg: 'max-w-dialog-lg',
}

const FOCUSABLE =
  'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])'

export default function Modal({
  open,
  onClose,
  title,
  size = 'md',
  showClose = true,
  closeOnOverlay = true,
  closeOnEsc = true,
  padded = true,
  fullscreenOnMobile = false,
  className,
  children,
  'aria-label': ariaLabel,
}: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  // Keep the latest callbacks without re-running the focus effect on every render.
  const onCloseRef = useRef(onClose)
  const closeOnEscRef = useRef(closeOnEsc)
  useEffect(() => {
    onCloseRef.current = onClose
    closeOnEscRef.current = closeOnEsc
  })

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden' // lock page scroll while open

    const focusables = () =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)) : []
    const initial =
      panel?.querySelector<HTMLElement>('[data-autofocus]') ??
      focusables().find((el) => !el.hasAttribute('data-modal-close')) ??
      panel
    initial?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscRef.current) {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className={cn(
        'animate-fade fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4',
        fullscreenOnMobile && 'max-md:p-0',
      )}
      onMouseDown={(e) => {
        if (closeOnOverlay && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        tabIndex={-1}
        className={cn(
          'animate-rise relative max-h-[calc(100dvh-2rem)] w-full overflow-y-auto',
          'rounded-dialog border border-ln2 bg-s1 focus:outline-none',
          padded && 'p-7',
          fullscreenOnMobile &&
            'max-md:h-dvh max-md:max-h-none max-md:max-w-none max-md:rounded-none max-md:border-0',
          sizes[size],
          className,
        )}
      >
        {showClose && (
          <button
            type="button"
            data-modal-close
            aria-label="Close"
            onClick={onClose}
            className="absolute top-5 right-5 inline-flex size-9 items-center justify-center rounded-full bg-ghost text-lg text-mu transition duration-150 ease-out hover:bg-s3 hover:text-tx"
          >
            <CloseIcon />
          </button>
        )}
        {title && (
          <h2 id={titleId} className={cn('heading text-[32px]', showClose && 'pr-12')}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
