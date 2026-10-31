import { forwardRef, useId, type SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'
import { ChevronDownIcon } from './icons'
import { fieldBase, fieldBorder, fieldSizes, type FieldSize } from './field'

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  size?: FieldSize
}

/** Native <select> styled to match Input. Pass <option> children. */
const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, size = 'md', className, id, children, ...rest },
  ref,
) {
  const autoId = useId()
  const selectId = id ?? autoId
  const describedBy = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <label htmlFor={selectId} className="text-[13px] leading-[18px] font-medium text-tx">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            fieldBase,
            fieldSizes[size],
            fieldBorder(!!error),
            'appearance-none pr-11',
          )}
          {...rest}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-lg text-mu">
          <ChevronDownIcon />
        </span>
      </div>
      {error ? (
        <p id={`${selectId}-error`} role="alert" className="text-[13px] leading-[18px] text-err">
          {error}
        </p>
      ) : hint ? (
        <p id={`${selectId}-hint`} className="text-[13px] leading-[18px] text-mu">
          {hint}
        </p>
      ) : null}
    </div>
  )
})

export default Select
