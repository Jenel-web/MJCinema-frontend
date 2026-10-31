import { expect, test, type Page, type Route } from '@playwright/test'
import { API_URL } from './env.ts'

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
}
const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) })

const trend: Record<string, number> = {}
;[40, 120, 90, 210, 160, 260, 230, 330, 290, 350, 310, 390].forEach((v, i) => {
  const d = new Date(2026, 7, 10 + i * 7)
  trend[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`] = v
})

interface Calls {
  paths: string[]
  headers: Record<string, string>[]
}

async function mockAdmin(page: Page, over: Record<string, (r: Route) => unknown> = {}): Promise<Calls> {
  const calls: Calls = { paths: [], headers: [] }
  await page.addInitScript(() => localStorage.setItem('token', 'tok123'))
  await page.route(`${API_URL}/**`, (route) => {
    const req = route.request()
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    const path = new URL(req.url()).pathname
    calls.paths.push(path)
    calls.headers.push(req.headers())
    if (over[path]) return over[path](route)
    const bodies: Record<string, unknown> = {
      '/ticket/totalSales': 482300,
      '/ticket/showTotalBookings': 3284,
      '/user/showTotalUsers': 1126,
      '/ticket/showRevenueToday': 18940.5,
      '/ticket/getSalesTrend': trend,
    }
    return path in bodies ? json(route, 200, bodies[path]) : json(route, 404, {})
  })
  return calls
}

// On mobile the nav lives in a drawer. Retry the click in case it lands before hydration.
async function openMenu(page: Page) {
  if ((page.viewportSize()?.width ?? 1440) >= 1024) return
  await expect(async () => {
    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(page.getByRole('navigation', { name: 'Admin' })).toBeVisible({ timeout: 1000 })
  }).toPass()
}

test('admin home: cards, chart, calls, reload', async ({ page }, testInfo) => {
  const calls = await mockAdmin(page)
  await page.goto('/admin')
  await expect(page.getByText('₱482,300.00')).toBeVisible()
  await expect(page.getByText('3,284')).toBeVisible()
  await expect(page.getByText('1,126')).toBeVisible()
  await expect(page.getByText('₱18,940.50')).toBeVisible()
  await expect(page.getByText('Wk of Aug 10')).toBeVisible()
  expect([...new Set(calls.paths)].sort()).toEqual(
    ['/ticket/getSalesTrend', '/ticket/showRevenueToday', '/ticket/showTotalBookings', '/ticket/totalSales', '/user/showTotalUsers'].sort(),
  )
  for (const h of calls.headers) {
    expect(h['authorization']).toBe('Bearer tok123')
    expect(h['content-type']).toBe('application/json')
  }
  await page.screenshot({ path: `e2e-output/screens/${testInfo.project.name}/admin-home.png`, fullPage: true })

  const before = calls.paths.length
  await openMenu(page)
  await page.getByRole('link', { name: 'Home' }).click()
  await expect.poll(() => calls.paths.length).toBe(before + 5)
})

test('admin home: failure shows N/A and chart error with retry', async ({ page }) => {
  let trendFails = true  // StrictMode (dev) runs effects twice, so count by state, not by call
  await mockAdmin(page, {
    '/ticket/totalSales': (r) => json(r, 500, {}),
    '/ticket/showTotalBookings': (r) => r.abort(),
    '/ticket/getSalesTrend': (r) => (trendFails ? json(r, 500, {}) : json(r, 200, trend)),
  })
  await page.goto('/admin')
  await expect(page.getByText('N/A')).toHaveCount(2)
  await expect(page.getByText("Can't load weekly sales")).toBeVisible()
  trendFails = false
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByText('Wk of Aug 10')).toBeVisible()
})

test('admin home: empty trend', async ({ page }) => {
  await mockAdmin(page, { '/ticket/getSalesTrend': (r) => json(r, 200, {}) })
  await page.goto('/admin')
  await expect(page.getByText('No sales yet')).toBeVisible()
})

test('admin shell: routes, active item, logout', async ({ page }) => {
  await mockAdmin(page)
  await page.goto('/admin')
  const nav = async (name: string) => {
    await openMenu(page)
    await page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name }).click()
  }
  for (const [name, path] of [['Movies', '/admin/movies'], ['Schedules', '/admin/schedules'], ['Bookings', '/admin/bookings'], ['Users', '/admin/users']]) {
    await nav(name)
    await expect(page).toHaveURL(new RegExp(`${path}$`))
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible()
    if ((page.viewportSize()?.width ?? 1440) >= 1024) await expect(page.getByRole('link', { name })).toHaveAttribute('aria-current', 'page')
  }
  await openMenu(page)
  await page.getByRole('button', { name: 'Logout' }).click()
  await expect(page).toHaveURL(/127\.0\.0\.1:5500\/$/)
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
})

test('toast: replaces, closes, auto-dismisses at 5s', async ({ page }, testInfo) => {
  await page.goto('/styleguide')
  const live = page.locator('[aria-live="polite"]')
  await page.getByRole('button', { name: 'Show success' }).click()
  await expect(live.getByText('Movie added')).toBeVisible()
  const box = await live.getByRole('status').boundingBox()
  expect(Math.round(box!.width)).toBeLessThanOrEqual(380)
  await page.screenshot({ path: `e2e-output/screens/${testInfo.project.name}/toast.png` })
  await page.getByRole('button', { name: 'Show error' }).click()
  await expect(live.getByText('Something went wrong')).toBeVisible()
  await expect(live.getByText('Movie added')).toHaveCount(0)
  await live.getByRole('button', { name: 'Dismiss' }).click()
  await expect(live.getByRole('alert')).toHaveCount(0)
  await page.getByRole('button', { name: 'Show success' }).click()
  await expect(live.getByRole('status')).toBeVisible()
  await page.waitForTimeout(4600)
  await expect(live.getByRole('status')).toBeVisible()
  await expect(live.getByRole('status')).toHaveCount(0, { timeout: 1500 })
})
