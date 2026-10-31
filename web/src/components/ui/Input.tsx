import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { fieldBase, fieldBorder, fieldSizes, type FieldSize } from './field'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  /** Error message; also turns the border red. */
  error?: string
  hint?: string
  size?: FieldSize
  /** Icon rendered inside the field, on the left (e.g. search). */
  leading?: ReactNode
  /** Interactive element inside the field, on the right (e.g. show/hide password button). */
  trailing?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, size = 'lg', leading, trailing, className, id, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <label htmlFor={inputId} className="text-[13px] leading-[18px] font-medium text-tx">
          {label}
        </label>
      )}
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-lg text-mu">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(fieldBase, fieldSizes[size], fieldBorder(!!error),
            !!leading && 'pl-11',
            !!trailing && 'pr-12',
          )}
          {...rest}
        />
        {trailing && (
          <span className="absolute inset-y-0 right-2 flex items-center">{trailing}</span>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-[13px] leading-[18px] text-err">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-[13px] leading-[18px] text-mu">
          {hint}
        </p>
      ) : null}
    </div>
  )
})

export default Input
