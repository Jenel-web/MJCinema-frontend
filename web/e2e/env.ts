import { loadEnv } from 'vite'

// Reads web/.env.local (and .env) without the VITE_ prefix filter, plus real process env.
const fileEnv = loadEnv('development', process.cwd(), '')
const get = (key: string): string => (process.env[key] ?? fileEnv[key] ?? '').trim()

export const API_URL = (get('VITE_API_URL') || 'https://mjcinema-backend-new.onrender.com').replace(/\/+$/, '')

export type Role = 'user' | 'admin'

export interface Credentials {
  username: string
  password: string
}

/** Returns the account for a role, or null when its pair is blank in .env.local. */
export function getCredentials(role: Role): Credentials | null {
  const prefix = role === 'user' ? 'E2E_USER' : 'E2E_ADMIN'
  const username = get(`${prefix}_USERNAME`)
  const password = get(`${prefix}_PASSWORD`)
  return username && password ? { username, password } : null
}

export const SCHEDULE_ID = get('E2E_SCHEDULE_ID')

export const missingCredsMessage = (role: Role) =>
  `Set E2E_${role.toUpperCase()}_USERNAME and E2E_${role.toUpperCase()}_PASSWORD in web/.env.local`
