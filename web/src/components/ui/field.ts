export type FieldSize = 'sm' | 'md' | 'lg'

/** Heights: lg 52 (auth), md 48 (dialogs), sm 44 (search). */
export const fieldSizes: Record<FieldSize, string> = {
  lg: 'h-[52px]',
  md: 'h-12',
  sm: 'h-11',
}

/** Shared control surface for Input and Select. */
export const fieldBase =
  'w-full rounded-ctl border bg-s2 px-4 text-tx transition duration-150 ease-out ' +
  'placeholder:text-mu focus:outline-none focus:ring-4 focus:ring-focus disabled:opacity-50'

export const fieldBorder = (error: boolean) =>
  error ? 'border-err focus:border-err' : 'border-ln focus:border-rd'
