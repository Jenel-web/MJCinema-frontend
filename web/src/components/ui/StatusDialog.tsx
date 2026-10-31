import { cn } from '../../lib/cn'
import Button from './Button'
import { AlertIcon, CheckIcon } from './icons'
import Modal from './Modal'

export interface StatusDialogProps {
  open: boolean
  tone: 'success' | 'error'
  title: string
  message: string
  /** e.g. "Okay" */
  actionLabel: string
  /** The only way out: Esc and scrim clicks do not close it (legacy status modal). */
  onAction: () => void
}

/** Result dialog: icon, title, message and a single button. */
export default function StatusDialog({ open, tone, title, message, actionLabel, onAction }: StatusDialogProps) {
  const ok = tone === 'success'
  return (
    <Modal
      open={open}
      onClose={onAction}
      aria-label={title}
      size="sm"
      showClose={false}
      closeOnOverlay={false}
      closeOnEsc={false}
    >
      <div className="flex flex-col items-center text-center">
        <span
          className={cn(
            'flex size-[52px] items-center justify-center rounded-full text-2xl',
            ok ? 'bg-ok-tint text-ok' : 'bg-err-tint text-err',
          )}
        >
          {ok ? <CheckIcon /> : <AlertIcon />}
        </span>
        <h2 className="heading mt-5 text-[32px]">{title}</h2>
        <p className="mt-3 text-base text-mu">{message}</p>
        <Button size="lg" fullWidth className="mt-6" onClick={onAction} data-autofocus>
          {actionLabel}
        </Button>
      </div>
    </Modal>
  )
}
