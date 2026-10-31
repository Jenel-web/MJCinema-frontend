import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { CheckIcon, CloseIcon } from './icons'
import { ToastContext, type ToastApi, type ToastOptions } from './toast-context'

interface ActiveToast extends ToastOptions {
  id: number
}

/**
 * One toast at a time: showing a new one replaces the current one (same as the legacy admin toast).
 * Bottom right on desktop, full width on mobile. Auto-closes after 5s.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ActiveToast | null>(null)
  const nextId = useRef(0)

  const show = useCallback((options: ToastOptions) => {
    nextId.current += 1
    setToast({ ...options, id: nextId.current })
  }, [])
  const dismiss = useCallback(() => setToast(null), [])

  useEffect(() => {
    if (!toast) return
    const duration = toast.duration ?? 5000
    if (duration === 0) return
    const timer = setTimeout(() => setToast(null), duration)
    return () => clearTimeout(timer)
  }, [toast])

  const api = useMemo<ToastApi>(() => ({ show, dismiss }), [show, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex justify-end sm:inset-x-auto sm:right-6 sm:bottom-6"
        >
          {toast && <ToastCard key={toast.id} toast={toast} onClose={dismiss} />}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export interface ToastCardProps {
  toast: ToastOptions
  onClose?: () => void
  className?: string
}

/** The toast surface itself (also rendered statically in the styleguide). */
export function ToastCard({ toast, onClose, className }: ToastCardProps) {
  const isError = toast.type === 'error'
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={cn(
        'animate-rise pointer-events-auto flex w-full max-w-toast items-start gap-3',
        'rounded-card border border-ln2 bg-s2 p-4',
        className,
      )}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-icon border text-xl',
          isError ? 'border-err-line bg-err-tint text-err' : 'border-ok-line bg-ok-tint text-ok',
        )}
      >
        {isError ? <CloseIcon /> : <CheckIcon />}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[15px] leading-[22px] font-semibold text-tx">{toast.title}</p>
        {toast.message && <p className="text-sm leading-5 text-mu">{toast.message}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onClose}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-lg text-mu transition duration-150 ease-out hover:bg-s3 hover:text-tx"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  )
}
