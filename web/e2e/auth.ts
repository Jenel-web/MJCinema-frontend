import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { API_URL, SCHEDULE_ID, getCredentials, missingCredsMessage, type Role } from './env.ts'

interface LoginBody {
  userId: number
  username: string
  jwtToken: string
  role: string
}

/** Real POST /user/login (server side, so CORS does not apply to this request). */
export async function fetchSession(request: APIRequestContext, role: Role): Promise<LoginBody> {
  const creds = getCredentials(role)
  test.skip(!creds, missingCredsMessage(role))
  const res = await request.post(`${API_URL}/user/login`, {
    data: creds,
    headers: { 'Content-Type': 'application/json' },
    timeout: 120_000, // cold start
  })
  expect(res.ok(), `login as ${role} failed with HTTP ${res.status()}`).toBe(true)
  return (await res.json()) as LoginBody
}

/**
 * Logs in against the real backend and puts the session into localStorage
 * (same keys as the app: token, userId, username) before any page script runs.
 * Skips the test when that role has no credentials in .env.local.
 */
export async function loginAs(page: Page, request: APIRequestContext, role: Role): Promise<LoginBody> {
  const session = await fetchSession(request, role)
  const entries: Record<string, string> = {
    token: session.jwtToken,
    userId: String(session.userId),
    username: session.username,
  }
  if (SCHEDULE_ID) entries.selectedScheduleId = SCHEDULE_ID
  await page.addInitScript((data) => {
    for (const [key, value] of Object.entries(data)) localStorage.setItem(key, value)
  }, entries)
  return session
}
