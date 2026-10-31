import { BASE_URL, STORAGE_KEYS } from './config'

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; message: string; data?: unknown }

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.token)
}

/** `Authorization: Bearer <token>` (token read at call time, like the legacy code). */
export function bearer(): Record<string, string> {
  return { Authorization: `Bearer ${getToken()}` }
}
const JSON_CT = { 'Content-Type': 'application/json' }

/** Authorization + Content-Type: the header set most authenticated legacy calls send. */
export const authJson = (): Record<string, string> => ({
  ...bearer(),
  ...JSON_CT,
})
/** Content-Type only (login/register). */
export const jsonOnly = (): Record<string, string> => ({ ...JSON_CT })

interface Options {
  method?: 'GET' | 'POST' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
  credentials?: RequestCredentials
  /** Response body is plain text, not JSON (movie/add, schedule/add). */
  text?: boolean
}

async function readError(res: Response): Promise<{ message: string; data?: unknown }> {
  const raw = await res.text()
  try {
    const data = JSON.parse(raw)
    return { message: data?.message ?? raw, data }
  } catch {
    return { message: raw }
  }
}

/**
 * Network failures throw (TypeError), exactly like fetch; callers decide what to show,
 * as the legacy screens did. HTTP errors resolve to { ok: false, message }.
 */
export async function request<T>(path: string, opts: Options = {}): Promise<ApiResult<T>> {
  const init: RequestInit = { method: opts.method ?? 'GET' }
  if (opts.headers) init.headers = opts.headers
  if (opts.body !== undefined) init.body = JSON.stringify(opts.body)
  if (opts.credentials) init.credentials = opts.credentials

  const res = await fetch(`${BASE_URL}${path}`, init)
  if (!res.ok) {
    const { message, data } = await readError(res)
    return { ok: false, status: res.status, message, data }
  }
  const data = (opts.text ? await res.text() : await res.json()) as T
  return { ok: true, status: res.status, data }
}
