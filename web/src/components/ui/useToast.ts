import { useContext } from 'react'
import { ToastContext, type ToastApi } from './toast-context'

/** `const toast = useToast(); toast.show({ type: 'success', title: 'Movie added' })` */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
