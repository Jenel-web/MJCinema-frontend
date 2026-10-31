import { createContext } from 'react'

export interface ToastOptions {
  type?: 'success' | 'error'
  title: string
  message?: string
  /** ms before auto close. Default 5000; 0 keeps it until dismissed. */
  duration?: number
}

export interface ToastApi {
  show: (options: ToastOptions) => void
  dismiss: () => void
}

export const ToastContext = createContext<ToastApi | null>(null)
