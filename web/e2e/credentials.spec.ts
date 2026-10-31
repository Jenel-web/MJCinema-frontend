import { expect, test } from '@playwright/test'
import { fetchSession } from './auth.ts'

// Run this first after filling web/.env.local: checks both accounts work and have the right role.
test.describe.configure({ mode: 'serial' })

test('user account logs in with role USER', async ({ request }) => {
  const session = await fetchSession(request, 'user')
  expect(session.jwtToken).toBeTruthy()
  expect(session.role).toBe('USER')
})

test('admin account logs in with a non-USER role', async ({ request }) => {
  const session = await fetchSession(request, 'admin')
  expect(session.jwtToken).toBeTruthy()
  expect(session.role).not.toBe('USER')
})
