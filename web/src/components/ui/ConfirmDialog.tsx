import type { ReactNode } from 'react'
import Button from './Button'
import Modal from './Modal'

export interface ConfirmDialogProps {
  open: boolean
  title: ReactNode
  description?: ReactNode
  /** e.g. "Yes, Book Now" */
  confirmLabel: string
  /** e.g. "Go Back" */
  cancelLabel?: string
  onConfirm: () => void
  /** Called by the cancel button, Esc and scrim click. */
  onCancel: () => void
  /** Disables both buttons and shows a spinner on confirm. */
  loading?: boolean
}

/** Two-button confirmation (replaces the browser confirm()). Cancel left (ghost), confirm right (red). */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm" showClose={false}>
      {description && <p className="mt-4 text-base text-mu">{description}</p>}
      <div className="mt-6 flex gap-3">
        <Button variant="ghost" size="lg" className="flex-1" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button size="lg" className="flex-1" onClick={onConfirm} loading={loading} data-autofocus>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
