interface Props {
  title: string
  legacy: string
}

export default function PlaceholderPage({ title, legacy }: Props) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="font-display text-5xl font-extrabold tracking-wide uppercase">{title}</h1>
      <p className="text-mu">Placeholder. Screen not built yet.</p>
      <p className="text-mu text-sm">Legacy: {legacy}</p>
    </main>
  )
}
