import StatePanel, { type StatePanelProps } from './StatePanel'

export type EmptyStateProps = Omit<StatePanelProps, 'tone'>

/** "Nothing here yet" panel. Pass an `action` (e.g. a ghost "Clear filter" Button) when there is one. */
export default function EmptyState(props: EmptyStateProps) {
  return <StatePanel {...props} />
}
