import Button from './Button'
import StatePanel from './StatePanel'

export interface ErrorStateProps {
  title?: string
  description?: string
  /** Shows a red "Try again" button when provided. */
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

/** Load-failure panel with a red outline and optional retry. */
export default function ErrorState({
  title = "Can't load this",
  description = 'The server is offline. Check your connection and try again.',
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div role="alert">
      <StatePanel
        tone="error"
        eyebrow="Error"
        title={title}
        description={description}
        className={className}
        action={onRetry && <Button onClick={onRetry}>{retryLabel}</Button>}
      />
    </div>
  )
}
