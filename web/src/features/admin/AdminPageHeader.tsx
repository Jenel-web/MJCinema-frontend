import type { ReactNode } from 'react'

/** Admin page title (Barlow Condensed 800, 40) with an optional right-hand action slot. */
export default function AdminPageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex min-h-12 flex-wrap items-center justify-between gap-3">
      <h1 className="heading text-[40px]">{title}</h1>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  )
}
