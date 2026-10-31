import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Align = 'left' | 'center' | 'right'
const align: Record<Align, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

/** Scrolls horizontally on narrow screens. Compose with Thead / Tbody / Tr / Th / Td. */
export function Table({ className, ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)} {...rest} />
    </div>
  )
}

export function Thead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />
}

export function Tbody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />
}

/** Body rows get a 1px divider. */
export function Tr({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-b border-ln last:border-b-0', className)} {...rest} />
}

/** Header cell: caption style (13/18, 500, muted) on a faint fill; row corners rounded. */
export function Th({
  align: a = 'left',
  className,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & { align?: Align }) {
  return (
    <th
      scope="col"
      className={cn(
        'h-11 bg-chip px-4 text-[13px] leading-[18px] font-medium whitespace-nowrap text-mu',
        'first:rounded-l-[10px] last:rounded-r-[10px]',
        align[a],
        className,
      )}
      {...rest}
    />
  )
}

/** Body cell: ~52px rows. */
export function Td({
  align: a = 'left',
  className,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & { align?: Align }) {
  return <td className={cn('h-[52px] px-4 text-tx', align[a], className)} {...rest} />
}
