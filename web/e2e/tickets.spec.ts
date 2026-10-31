import { expect, test, type Page, type Route } from '@playwright/test'
import { API_URL } from './env.ts'

const ORIGIN = 'http://127.0.0.1:5500'
const CORS = { 'access-control-allow-origin': '*' }
const CRED_CORS = {
  'access-control-allow-origin': ORIGIN,
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
}
const json = (route: Route, status: number, body: unknown, headers: Record<string, string> = CORS) =>
  route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(body) })

const t = (title: string, showDate: string, startTime: string, seatNumber: string, ticketStatus: string) => ({
  title,
  showDate,
  startTime,
  location: 'SM City North',
  seatNumber,
  seatCategory: 'REGULAR',
  ticketCode: `MJC-${title.slice(0, 2)}-${seatNumber}`,
  ticketStatus,
})
const tickets = () => [
  t('Night Harbor', '2026-10-31', '16:15:00', 'D6', 'ACTIVE'),
  t('Night Harbor', '2026-10-31', '16:15:00', 'D7', 'ACTIVE'),
  t('Night Harbor', '2026-10-31', '16:15:00', 'D8', 'COMPLETED'),
  t('Ember Road', '2026-11-02', '21:15:00', 'A1', 'ACTIVE'),
  t('Ember Road', '2026-11-03', '21:15:00', 'A2', 'COMPLETED'),
]

type Call = { method: string; path: string; search: string; headers: Record<string, string>; body: unknown }

interface MockOptions {
  tickets?: (route: Route) => unknown
  user?: (route: Route) => unknown
  cancel?: (route: Route) => unknown
}

async function mockApi(page: Page, opts: MockOptions = {}) {
  const log: Call[] = []
  await page.route(`${API_URL}/**`, async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CRED_CORS })
    log.push({
      method: req.method(),
      path: url.pathname,
      search: url.search,
      headers: await req.allHeaders(),
      body: req.postData() ? JSON.parse(req.postData()!) : null,
    })
    if (url.pathname === '/ticket/mytickets') return opts.tickets ? opts.tickets(route) : json(route, 200, tickets())
    if (url.pathname === '/user/getUser') {
      return opts.user ? opts.user(route) : json(route, 200, { username: 'mj.cortas', balance: 2450 })
    }
    if (url.pathname === '/ticket/cancel') return opts.cancel ? opts.cancel(route) : json(route, 200, {}, CRED_CORS)
    return json(route, 404, { message: 'unmocked' })
  })
  return log
}

async function seed(page: Page, extra: Record<string, string> = {}) {
  await page.addInitScript(
    (data) => {
      for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v)
    },
    { token: 't', userId: '1', username: 'mj.cortas', ...extra },
  )
}

const shot = (page: Page, project: string, name: string) =>
  page.screenshot({ path: `e2e-output/tickets/${project}/${name}.png`, fullPage: true })
const card = (page: Page, title: string) => page.getByRole('listitem').filter({ has: page.getByText(title, { exact: true }) })
const calls = (log: Call[], path: string) => log.filter((c) => c.path === path)

test.describe('my bookings', () => {
  test('logged out: no calls, message and Log in to /', async ({ page }, info) => {
    const log = await mockApi(page)
    await page.goto('/tickets')
    await expect(page.getByText('Please log in to view your tickets.')).toBeVisible()
    await shot(page, info.project.name, 'logged-out')
    expect(log).toEqual([])
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('load calls: both with Bearer + JSON, userId query', async ({ page }) => {
    await seed(page)
    const log = await mockApi(page)
    await page.goto('/tickets')
    await expect(page.getByText('mj.cortas', { exact: true })).toBeVisible()
    const mine = calls(log, '/ticket/mytickets')[0]
    const me = calls(log, '/user/getUser')[0]
    for (const [c, search] of [[mine, '?userId=1'], [me, '?userId=1']] as const) {
      expect(c.method).toBe('GET')
      expect(c.search).toBe(search)
      expect(c.headers['authorization']).toBe('Bearer t')
      expect(c.headers['content-type']).toContain('application/json')
    }
  })

  test('header, balance, grouping, tab counts and default expansion', async ({ page }, info) => {
    await seed(page)
    await mockApi(page)
    await page.goto('/tickets')
    await expect(page.getByText('₱2,450.00').locator('visible=true').first()).toBeVisible()
    await expect(page.getByRole('tab', { name: /^Active\s*2$/ })).toBeVisible() // 2 cards with active seats
    await expect(page.getByRole('tab', { name: /^Completed\s*2$/ })).toBeVisible() // Night Harbor + Ember Road (other date)
    await expect(page.getByRole('tab', { name: /^Cancelled\s*0$/ })).toBeVisible()
    await expect(card(page, 'Night Harbor')).toHaveCount(1)
    await expect(card(page, 'Night Harbor').getByRole('button', { name: /^Cancel ticket/ })).toHaveCount(2)
    await expect(card(page, 'Ember Road').getByRole('button', { expanded: false })).toBeVisible()
    await page.waitForLoadState('networkidle')
    await shot(page, info.project.name, 'active')
  })

  test('COMPLETED tab hides cards without completed seats; rows get a tag, no Cancel', async ({ page }) => {
    await seed(page)
    await mockApi(page)
    await page.goto('/tickets')
    await page.getByRole('tab', { name: /^Completed/ }).click()
    await expect(page.getByText('COMPLETED', { exact: true }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /^Cancel ticket/ })).toHaveCount(0)
  })

  test('empty tab shows the empty state', async ({ page }, info) => {
    await seed(page)
    await mockApi(page)
    await page.goto('/tickets')
    await page.getByRole('tab', { name: /^Cancelled/ }).click()
    await expect(page.getByRole('heading', { name: 'No cancelled bookings' })).toBeVisible()
    await expect(page.getByText('Bookings you cancel will show up here.')).toBeVisible()
    await shot(page, info.project.name, 'empty-tab')
  })

  test('cancel: confirm, PATCH with ticketCode, result, tickets reload, balance does not', async ({ page }, info) => {
    await seed(page)
    let cancelled = false
    const log = await mockApi(page, {
      tickets: (route) =>
        json(route, 200, cancelled ? tickets().map((x) => (x.seatNumber === 'D6' ? { ...x, ticketStatus: 'CANCELLED' } : x)) : tickets()),
      cancel: (route) => {
        cancelled = true
        return json(route, 200, {}, CRED_CORS)
      },
    })
    await page.goto('/tickets')
    await expect(card(page, 'Night Harbor')).toBeVisible()
    const listBefore = calls(log, '/ticket/mytickets').length // dev StrictMode doubles the mount fetch
    const userBefore = calls(log, '/user/getUser').length
    await page.getByRole('button', { name: 'Cancel ticket MJC-Ni-D6' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Ticket: MJC-Ni-D6')
    await expect(dialog).toContainText('Do you wish to cancel this booking? This action cannot be undone.')
    await shot(page, info.project.name, 'cancel-dialog')
    await dialog.getByRole('button', { name: 'Cancel booking' }).click()
    await expect(page.getByText('Ticket cancelled successfully.')).toBeVisible()
    await shot(page, info.project.name, 'cancel-result')
    const patch = calls(log, '/ticket/cancel')
    expect(patch).toHaveLength(1)
    expect(patch[0].method).toBe('PATCH')
    expect(patch[0].body).toEqual({ ticketCode: 'MJC-Ni-D6' })
    expect(patch[0].headers['authorization']).toBe('Bearer t')
    expect(patch[0].headers['content-type']).toContain('application/json')
    await page.getByRole('button', { name: 'Done' }).click()
    await expect(page.getByRole('tab', { name: /^Cancelled\s*1$/ })).toBeVisible()
    expect(calls(log, '/ticket/mytickets')).toHaveLength(listBefore + 1)
    expect(calls(log, '/user/getUser')).toHaveLength(userBefore)
  })

  test('Keep booking closes without a call', async ({ page }) => {
    await seed(page)
    const log = await mockApi(page)
    await page.goto('/tickets')
    await page.getByRole('button', { name: 'Cancel ticket MJC-Ni-D6' }).click()
    await page.getByRole('button', { name: 'Keep booking' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(calls(log, '/ticket/cancel')).toEqual([])
  })

  test('cancel failure: "Error: <message>"', async ({ page }) => {
    await seed(page)
    await mockApi(page, { cancel: (route) => json(route, 400, { message: 'Too late' }, CRED_CORS) })
    await page.goto('/tickets')
    await page.getByRole('button', { name: 'Cancel ticket MJC-Ni-D6' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel booking' }).click()
    await expect(page.getByText('Error: Too late')).toBeVisible()
  })

  test('user failure: "Profile" fallback, tickets still shown', async ({ page }) => {
    await seed(page)
    await mockApi(page, { user: (route) => json(route, 500, { message: 'x' }) })
    await page.goto('/tickets')
    await expect(page.getByText('Profile', { exact: true }).first()).toBeVisible()
    await expect(card(page, 'Night Harbor')).toBeVisible()
  })

  test('loading skeleton, then error with retry', async ({ page }, info) => {
    await seed(page)
    let failing = true
    const log = await mockApi(page, {
      tickets: async (route) => {
        await new Promise((r) => setTimeout(r, 1200))
        return failing ? json(route, 500, { message: 'boom' }) : json(route, 200, tickets())
      },
    })
    await page.goto('/tickets')
    await expect(page.getByLabel('Loading tickets')).toBeVisible()
    await shot(page, info.project.name, 'loading')
    await expect(page.getByText('Error loading tickets. Please try again later.')).toBeVisible()
    await shot(page, info.project.name, 'error')
    failing = false
    const before = log.length
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(card(page, 'Night Harbor')).toBeVisible()
    expect(log.length - before).toBe(2)
  })

  test('Back goes back in history', async ({ page }) => {
    await seed(page)
    await mockApi(page)
    await page.goto('/')
    await page.goto('/tickets')
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})
