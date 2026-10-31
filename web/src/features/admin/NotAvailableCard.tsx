import { EmptyState } from '../../components/ui'

/** The single "coming soon" card for admin pages whose backend endpoint does not exist yet. */
export default function NotAvailableCard({ description }: { description: string }) {
  return <EmptyState eyebrow="Coming soon" title="Not available yet" description={description} className="py-20" />
}
