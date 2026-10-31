import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { Spinner } from './icons'

export type ButtonVariant = 'primary' | 'ghost' | 'danger-soft'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** sm 36, md 44, lg 48 (auth, hero), xl 52 (seats, mobile primary). */
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  /** Square 44px pill for icon-only buttons; pass an aria-label. */
  iconOnly?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-rd text-white hover:bg-rd2 disabled:bg-s3 disabled:text-dis disabled:hover:bg-s3',
  ghost:
    'bg-ghost text-tx border border-ln2 hover:bg-s3 disabled:bg-s3 disabled:text-dis',
  'danger-soft':
    'bg-danger-soft text-danger border border-danger-line hover:bg-err-tint disabled:bg-s3 disabled:border-transparent disabled:text-dis',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
  xl: 'h-[52px] px-7 text-base',
}

const iconSizes: Record<ButtonSize, string> = {
  sm: 'size-9',
  md: 'size-11',
  lg: 'size-12',
  xl: 'size-[52px]',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    iconOnly = false,
    className,
    disabled,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap',
        'transition duration-150 ease-out active:scale-[0.98] disabled:active:scale-100',
        variants[variant],
        iconOnly ? iconSizes[size] : sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
})

export default Button
