import { expect, test, type Page, type Route } from '@playwright/test'
import { API_URL } from './env.ts'

const REGISTER_URL = `${API_URL}/user/register`
const CORS = { 'access-control-allow-origin': '*' }
const PREFLIGHT = { ...CORS, 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) })

/** Mocks POST /user/register; `handler` answers the real request, preflights are handled here. */
async function mockRegister(page: Page, handler: (route: Route) => unknown) {
  await page.route(REGISTER_URL, (route) =>
    route.request().method() === 'OPTIONS' ? route.fulfill({ status: 204, headers: PREFLIGHT }) : handler(route),
  )
}

async function fill(page: Page, username = 'new.user', password = 'longenough1', confirm = password) {
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password').fill(confirm)
}

const join = (page: Page) => page.getByRole('button', { name: 'Join' })
const shot = (page: Page, project: string, name: string) =>
  page.screenshot({ path: `e2e-output/register/${project}/${name}.png` })

test.describe('register (mocked API)', () => {
  test('renders the screen', async ({ page }, info) => {
    await page.goto('/register')
    await expect(page.getByLabel('Username')).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Confirm password')).toBeVisible()
    await expect(join(page)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to login' })).toHaveAttribute('href', '/')
    await shot(page, info.project.name, 'default')
  })

  test('sends exactly POST /user/register { username, password, confirm }, JSON content-type, no auth', async ({ page }) => {
    let seen: { method: string; body: unknown; headers: Record<string, string> } | null = null
    await mockRegister(page, (route) => {
      const req = route.request()
      seen = { method: req.method(), body: req.postDataJSON(), headers: req.headers() }
      return json(route, 200, {})
    })
    await page.goto('/register')
    await fill(page, 'new.user', 'longenough1')
    await join(page).click()
    await expect(page.getByRole('status')).toHaveText('Account Created. Redirecting...')
    expect(seen).not.toBeNull()
    expect(seen!.method).toBe('POST')
    expect(seen!.body).toEqual({ username: 'new.user', password: 'longenough1', confirm: 'longenough1' })
    expect(seen!.headers['content-type']).toContain('application/json')
    expect(seen!.headers['authorization']).toBeUndefined()
  })

  test('passwords differ: exact banner, card shakes, banner hides after 3s, no request sent', async ({ page }, info) => {
    let calls = 0
    await mockRegister(page, (route) => {
      calls += 1
      return json(route, 200, {})
    })
    await page.goto('/register')
    await fill(page, 'new.user', 'longenough1', 'different-pass')
    await join(page).click()
    const banner = page.getByRole('alert')
    await expect(banner).toHaveText('Passwords do not match.')
    await expect(page.locator('.animate-shake')).toHaveCount(1)
    await shot(page, info.project.name, 'error-mismatch')
    await expect(page.locator('.animate-shake')).toHaveCount(0, { timeout: 2000 })
    await expect(banner).toBeHidden({ timeout: 5000 })
    expect(calls).toBe(0)
  })

  test('password under 8 characters: exact banner, no request sent', async ({ page }, info) => {
    let calls = 0
    await mockRegister(page, (route) => {
      calls += 1
      return json(route, 200, {})
    })
    await page.goto('/register')
    await fill(page, 'new.user', 'short1')
    await join(page).click()
    await expect(page.getByRole('alert')).toHaveText('Password length should be more than 8 characters.')
    await shot(page, info.project.name, 'error-short')
    expect(calls).toBe(0)
  })

  test('exactly 8 characters passes the legacy check (length < 8 is the only failure)', async ({ page }) => {
    await mockRegister(page, (route) => json(route, 200, {}))
    await page.goto('/register')
    await fill(page, 'new.user', 'exactly8')
    await join(page).click()
    await expect(page.getByRole('status')).toHaveText('Account Created. Redirecting...')
  })

  test('mismatch is reported before length (legacy order)', async ({ page }) => {
    await page.goto('/register')
    await fill(page, 'new.user', 'abc', 'xyz')
    await join(page).click()
    await expect(page.getByRole('alert')).toHaveText('Passwords do not match.')
  })

  test('empty form is not blocked by the browser; falls to the length message (legacy quirk)', async ({ page }) => {
    await page.goto('/register')
    await join(page).click()
    await expect(page.getByRole('alert')).toHaveText('Password length should be more than 8 characters.')
  })

  test('success: green message, goes to / after 2s (not before)', async ({ page }, info) => {
    await mockRegister(page, (route) => json(route, 200, {}))
    await page.goto('/register')
    await fill(page)
    const clickedAt = Date.now()
    await join(page).click()
    await expect(page.getByRole('status')).toHaveText('Account Created. Redirecting...')
    await shot(page, info.project.name, 'success')
    await page.waitForTimeout(1200)
    expect(new URL(page.url()).pathname).toBe('/register') // still waiting at ~1.2s
    await expect(page).toHaveURL(/\/$/, { timeout: 3000 })
    const elapsed = Date.now() - clickedAt
    expect(elapsed).toBeGreaterThanOrEqual(1900)
    expect(elapsed).toBeLessThan(3500)
    // success must not log anyone in
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull()
  })

  test('success: submit is locked while waiting to redirect (no duplicate account)', async ({ page }) => {
    let calls = 0
    await mockRegister(page, (route) => {
      calls += 1
      return json(route, 200, {})
    })
    await page.goto('/register')
    await fill(page)
    await join(page).click()
    await expect(join(page)).toBeDisabled()
    await page.waitForTimeout(300)
    expect(calls).toBe(1)
  })

  test('server error: red popup with the server message, auto-hides after 3s, no redirect', async ({ page }, info) => {
    await mockRegister(page, (route) => json(route, 409, { message: 'Username already exists' }))
    await page.goto('/register')
    await fill(page)
    await join(page).click()
    const popup = page.getByRole('alert').filter({ hasText: 'Username already exists' })
    await expect(popup).toBeVisible()
    await shot(page, info.project.name, 'error-server')
    await expect(popup).toBeHidden({ timeout: 5000 }) // ~3s
    expect(new URL(page.url()).pathname).toBe('/register')
    await expect(join(page)).toBeEnabled()
  })

  test('server unreachable: popup "Server is offline. Try again later."', async ({ page }) => {
    await page.route(REGISTER_URL, (route) => route.abort('failed'))
    await page.goto('/register')
    await fill(page)
    await join(page).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Server is offline. Try again later.' })).toBeVisible()
  })

  test('loading state: button busy, double submit blocked, slow-server hint', async ({ page }, info) => {
    let calls = 0
    await mockRegister(page, async (route) => {
      calls += 1
      await new Promise((r) => setTimeout(r, 5000))
      return json(route, 200, {})
    })
    await page.goto('/register')
    await fill(page)
    await join(page).click()
    await expect(join(page)).toBeDisabled()
    await expect(join(page)).toHaveAttribute('aria-busy', 'true')
    await page.getByLabel('Confirm password').press('Enter')
    await expect(page.getByText(/Creating your account can take up to a minute/)).toBeVisible({ timeout: 6000 })
    await shot(page, info.project.name, 'loading-slow')
    await expect(page.getByRole('status')).toHaveText('Account Created. Redirecting...', { timeout: 8000 })
    expect(calls).toBe(1)
  })

  test('live checklist reflects the two rules but never blocks submit', async ({ page }) => {
    await page.goto('/register')
    const rules = page.getByRole('list', { name: 'Password requirements' })
    const eight = rules.getByText('At least 8 characters')
    const match = rules.getByText('Matches the confirmation')
    await expect(eight).toHaveClass(/text-mu/)
    await page.getByLabel('Password', { exact: true }).fill('longenough1')
    await expect(eight).toHaveClass(/text-ok/)
    await expect(match).toHaveClass(/text-mu/)
    await page.getByLabel('Confirm password').fill('longenough1')
    await expect(match).toHaveClass(/text-ok/)
    await page.getByLabel('Confirm password').fill('nope')
    await expect(match).toHaveClass(/text-mu/)
  })

  test('Enter key submits; Back to login goes to /', async ({ page }) => {
    await page.goto('/register')
    await fill(page, 'u', 'a', 'b')
    await page.getByLabel('Confirm password').press('Enter')
    await expect(page.getByRole('alert')).toHaveText('Passwords do not match.')
    await page.getByRole('link', { name: 'Back to login' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('layout: no horizontal overflow; mobile hides the desktop heading, same stacked layout as login', async ({ page }, info) => {
    await page.goto('/register')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBe(0)
    const heading = page.getByRole('heading', { name: 'Create account' })
    if (info.project.name === 'mobile') await expect(heading).toBeHidden()
    else await expect(heading).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Join the')
  })

  test('hero art is decorative: no movie titles and no API call on load', async ({ page }) => {
    const calls: string[] = []
    page.on('request', (r) => { if (r.url().startsWith(API_URL)) calls.push(r.url()) })
    await page.goto('/register')
    await page.waitForLoadState('networkidle')
    expect(calls).toEqual([])
    for (const title of ['Night Harbor', 'Velvet Hour', 'Ember Road', 'Deep Quiet', 'Glass Garden', 'Kite Season']) {
      await expect(page.getByText(title)).toHaveCount(0)
    }
  })
})
