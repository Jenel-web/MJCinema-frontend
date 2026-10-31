import { expect, test, type Page, type Route } from '@playwright/test'
import { API_URL } from './env.ts'

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
}
const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) })
const text = (route: Route, status: number, body: string) =>
  route.fulfill({ status, contentType: 'text/plain', headers: CORS, body })

const best = [
  { slot: 'EVENING', averageRevenue: 4200 },
  { slot: 'AFTERNOON', averageRevenue: 2100 },
  { slot: 'MORNING', averageRevenue: 1050.5 },
]
const stat = (title: string, pct: number) => ({
  title,
  cinemaName: 'SM City North',
  showDate: '2026-10-31',
  slot: 'EVENING',
  occupiedSeats: Math.round(pct),
  availableSeats: 100 - Math.round(pct),
  percentage: pct,
})
const stats = [stat('Night Harbor', 92), stat('Deep Quiet', 80), stat('Ember Road', 64.5), stat('Low Tide', 50), stat('Kite Season', 19)]

type Call = { method: string; path: string; headers: Record<string, string>; body: unknown }

async function mockAdmin(page: Page, over: Record<string, (r: Route) => unknown> = {}) {
  const log: Call[] = []
  await page.addInitScript(() => localStorage.setItem('token', 'tok123'))
  await page.route(`${API_URL}/**`, async (route) => {
    const req = route.request()
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    const path = new URL(req.url()).pathname
    log.push({
      method: req.method(),
      path,
      headers: await req.allHeaders(),
      body: req.postData() ? JSON.parse(req.postData()!) : null,
    })
    if (over[path]) return over[path](route)
    const bodies: Record<string, unknown> = {
      '/schedule/bestShowtime': best,
      '/schedule/showScheduleCount': 148,
      '/schedule/showAverageRevenue': 3258,
      '/schedule/seatStats': stats,
      '/movie/show': [{ movieId: 5, title: 'Night Harbor' }, { movieId: 6, title: 'Deep Quiet' }],
      '/cinema/all': [{ cinemaId: 2, cinemaName: 'Cinema 3', location: 'SM City North' }],
      '/schedule/showSlots': ['MORNING', 'MIDDAY', 'AFTERNOON', 'EVENING', 'NIGHT', 'MIDNIGHT'],
    }
    return path in bodies ? json(route, 200, bodies[path]) : json(route, 404, {})
  })
  return log
}

const calls = (log: Call[], path: string) => log.filter((c) => c.path === path)
const shot = (page: Page, project: string, name: string) =>
  page.screenshot({ path: `e2e-output/admin-schedules/${project}/${name}.png`, fullPage: true })

async function fillForm(page: Page) {
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Movie').selectOption('5')
  await dialog.getByLabel('Cinema').selectOption('2')
  await dialog.getByLabel('Date').fill('2026-11-05')
  await dialog.getByRole('button', { name: /Evening/ }).click()
  await dialog.getByLabel('VIP (₱)').fill('450')
  await dialog.getByLabel('Regular (₱)').fill('320')
  await dialog.getByLabel('Balcony (₱)').fill('260')
}

const openModal = async (page: Page) => {
  await page.getByRole('button', { name: 'Add schedule' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

test.describe('admin schedules', () => {
  test('load: four calls with Bearer + JSON, values, bars, thresholds', async ({ page }, info) => {
    const log = await mockAdmin(page)
    await page.goto('/admin/schedules')
    await expect(page.getByText('148', { exact: true })).toBeVisible()
    await expect(page.getByText('₱3,258.00')).toBeVisible()
    for (const path of ['/schedule/bestShowtime', '/schedule/showScheduleCount', '/schedule/showAverageRevenue', '/schedule/seatStats']) {
      const c = calls(log, path)[0]
      expect(c.method, path).toBe('GET')
      expect(c.headers['authorization'], path).toBe('Bearer tok123')
      expect(c.headers['content-type'], path).toContain('application/json')
    }
    await expect(page.getByText('By average revenue')).toBeVisible()
    await expect(page.getByText('₱4,200.00')).toBeVisible()
    await expect(page.getByText('₱1,050.50')).toBeVisible()
    await expect(page.getByText(/this week|vs last week|Stat 3|Stat 4/)).toHaveCount(0)
    // gold bar relative to the largest: 2100 / 4200 = 50%
    const bar = page.getByRole('img', { name: /Afternoon average revenue/ }).locator('span')
    expect((await bar.evaluate((el) => (el as HTMLElement).style.width))).toBe('50%')
    // occupancy colours: >=80 green, >=50 gold, else red
    const fill = (title: string) => page.getByRole('row', { name: new RegExp(title) }).locator('td span span').first()
    await expect(fill('Night Harbor')).toHaveClass(/bg-ok/)
    await expect(fill('Deep Quiet')).toHaveClass(/bg-ok/)
    await expect(fill('Ember Road')).toHaveClass(/bg-gd/)
    await expect(fill('Low Tide')).toHaveClass(/bg-gd/)
    await expect(fill('Kite Season')).toHaveClass(/bg-rd2/)
    await expect(page.getByText('64.5%')).toBeVisible()
    await expect(page.getByRole('columnheader')).toHaveText(['Title', 'Cinema', 'Show date', 'Slot', 'Occupied', 'Available', 'Occupancy'])
    await page.waitForLoadState('networkidle')
    await shot(page, info.project.name, 'default')
  })

  test('empty seat stats, error with retry, loading', async ({ page }, info) => {
    let fail = true
    await mockAdmin(page, {
      '/schedule/seatStats': async (r) => {
        await new Promise((res) => setTimeout(res, 800))
        return fail ? json(r, 500, {}) : json(r, 200, [])
      },
    })
    await page.goto('/admin/schedules')
    await expect(page.getByLabel('Loading seat stats')).toBeVisible()
    await shot(page, info.project.name, 'loading')
    await expect(page.getByRole('heading', { name: "Can't load seat stats" })).toBeVisible()
    await shot(page, info.project.name, 'error')
    fail = false
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByRole('heading', { name: 'No active schedules found.' })).toBeVisible()
    await shot(page, info.project.name, 'empty')
  })

  test('modal: opens, three option calls (showSlots Authorization only), labels, close paths clear the fields', async ({ page }, info) => {
    const log = await mockAdmin(page)
    await page.goto('/admin/schedules')
    await openModal(page)
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('option', { name: 'Night Harbor' })).toBeAttached()
    await expect(dialog.getByRole('option', { name: 'Cinema 3 — SM City North' })).toBeAttached()
    await expect(dialog.getByRole('button', { name: /Midnight/ })).toBeVisible()
    for (const path of ['/movie/show', '/cinema/all', '/schedule/showSlots']) {
      const c = calls(log, path)[0]
      expect(c.headers['authorization'], path).toBe('Bearer tok123')
      expect(c.headers['content-type'], path).toBeUndefined()
    }
    await fillForm(page)
    await page.waitForTimeout(300)
    await shot(page, info.project.name, 'modal')
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toHaveCount(0)
    await openModal(page)
    await expect(page.getByRole('dialog').getByLabel('Date')).toHaveValue('')
    await expect(page.getByRole('dialog').getByLabel('VIP (₱)')).toHaveValue('')
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await openModal(page)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeVisible() // Esc does not close this modal (legacy)
    await page.mouse.click(5, 5)
    await expect(page.getByRole('dialog')).toHaveCount(0) // outside click
  })

  test('empty field: error toast, no POST', async ({ page }, info) => {
    const log = await mockAdmin(page)
    await page.goto('/admin/schedules')
    await openModal(page)
    await page.getByRole('dialog').getByLabel('Movie').selectOption('5')
    await page.getByRole('dialog').getByRole('button', { name: 'Add schedule' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Please fill in all fields before submitting.' })).toBeVisible()
    await shot(page, info.project.name, 'toast-error')
    expect(calls(log, '/schedule/add')).toEqual([])
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('submit: POST body, plain-text toast, reloads the four resources', async ({ page }, info) => {
    const log = await mockAdmin(page, { '/schedule/add': (r) => text(r, 200, 'Schedule added successfully') })
    await page.goto('/admin/schedules')
    await expect(page.getByText('148', { exact: true })).toBeVisible()
    const before = ['/schedule/bestShowtime', '/schedule/showScheduleCount', '/schedule/showAverageRevenue', '/schedule/seatStats'].map(
      (p) => calls(log, p).length,
    )
    await openModal(page)
    await fillForm(page)
    await page.getByRole('dialog').getByRole('button', { name: 'Add schedule' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Schedule added successfully' })).toBeVisible()
    await shot(page, info.project.name, 'toast-success')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    const post = calls(log, '/schedule/add')
    expect(post).toHaveLength(1)
    expect(post[0].method).toBe('POST')
    expect(post[0].headers['authorization']).toBe('Bearer tok123')
    expect(post[0].headers['content-type']).toContain('application/json')
    expect(post[0].body).toEqual({
      movieId: 5, cinemaId: 2, showDate: '2026-11-05', slot: 'EVENING', vipPrice: 450, regPrice: 320, balPrice: 260,
    })
    const paths = ['/schedule/bestShowtime', '/schedule/showScheduleCount', '/schedule/showAverageRevenue', '/schedule/seatStats']
    await expect.poll(() => paths.map((p) => calls(log, p).length)).toEqual(before.map((n) => n + 1))
  })

  test('server error text: error toast, modal closes, no reload', async ({ page }) => {
    const log = await mockAdmin(page, { '/schedule/add': (r) => text(r, 400, 'Cinema is already booked for that slot') })
    await page.goto('/admin/schedules')
    await expect(page.getByText('148', { exact: true })).toBeVisible()
    const stats0 = calls(log, '/schedule/seatStats').length
    await openModal(page)
    await fillForm(page)
    await page.getByRole('dialog').getByRole('button', { name: 'Add schedule' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'Cinema is already booked for that slot' })).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(calls(log, '/schedule/seatStats')).toHaveLength(stats0)
  })

  test('option list failure shows "Failed to load"', async ({ page }) => {
    await mockAdmin(page, { '/cinema/all': (r) => json(r, 500, {}) })
    await page.goto('/admin/schedules')
    await openModal(page)
    await expect(page.getByRole('dialog').getByRole('option', { name: 'Failed to load' })).toBeAttached()
  })
})
