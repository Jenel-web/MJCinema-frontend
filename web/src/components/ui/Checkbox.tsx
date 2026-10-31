import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { CheckIcon } from './icons'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, id, disabled, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'inline-flex items-center gap-3 text-sm text-mu select-none',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      <span className="relative inline-flex size-5 shrink-0">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          disabled={disabled}
          className="peer absolute inset-0 size-full cursor-[inherit] opacity-0"
          {...rest}
        />
        <span className="absolute inset-0 rounded-md border border-ln2 bg-s2 transition duration-150 ease-out peer-checked:border-rd peer-checked:bg-rd peer-focus-visible:ring-4 peer-focus-visible:ring-focus" />
        <CheckIcon className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white opacity-0 peer-checked:opacity-100" />
      </span>
      {label}
    </label>
  )
})

export default Checkbox
