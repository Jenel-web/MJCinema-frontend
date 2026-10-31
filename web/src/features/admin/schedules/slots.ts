/** Slot icons from the legacy admin (static/js/admin.js). Unknown slots fall back to the film icon. */
const SLOT_ICON: Record<string, string> = {
  MORNING: '🌅',
  MIDDAY: '🌤️',
  AFTERNOON: '☀️',
  EVENING: '🌆',
  NIGHT: '🌙',
  MIDNIGHT: '🌃',
}

export const slotIcon = (slot: string) => SLOT_ICON[slot] ?? '🎬'

/** "MORNING" -> "Morning". */
export const slotLabel = (slot: string) => slot.charAt(0) + slot.slice(1).toLowerCase()
