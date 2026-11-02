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

const NOT_LOGGED_IN = { message: 'Please log in to continue.' }
const EXPIRED_BANNER = 'Your session expired. Please log in again.'

const schedule = {
  scheduleId: 7,
  movie: { title: 'Alpha Run' },
  showDate: '2026-10-31',
  startTime: '16:15:00',
  cinema: { cinemaName: 'Cinema 3', location: 'SM City North', totalRows: 10, totalColumns: 14, seatLayout: 'SSSS_SSSSSS_SSSS' },
}
const prices = [
  { seatCategory: 'VIP', price: 450 },
  { seatCategory: 'REGULAR', price: 320 },
  { seatCategory: 'BALCONY', price: 260 },
]

interface MockOptions {
  book?: (route: Route) => unknown
  login?: (route: Route) => unknown
}

/** Mocks the backend: the booking page's data, plus a 401 for every protected call unless overridden. */
async function mockApi(page: Page, opts: MockOptions = {}) {
  await page.route(`${API_URL}/**`, async (route) => {
    const req = route.request()
    const path = new URL(req.url()).pathname
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CRED_CORS })
    if (path === '/user/login') return opts.login ? opts.login(route) : json(route, 400, { message: 'Bad credentials' })
    if (path === '/schedule/7') return json(route, 200, schedule)
    if (path === '/schedule/schedPrice/7') return json(route, 200, prices)
    if (path === '/seat/occupied/7') return json(route, 200, [])
    if (path === '/ticket/book') return opts.book ? opts.book(route) : json(route, 401, NOT_LOGGED_IN, CRED_CORS)
    if (['/movie/show', '/schedule/now-showing', '/schedule/coming-soon'].includes(path)) return json(route, 200, [])
    if (path === '/ticket/mytickets' || path === '/user/getUser') return json(route, 401, NOT_LOGGED_IN)
    return json(route, 404, { message: 'unmocked' })
  })
}

async function seed(page: Page) {
  await page.addInitScript(() => {
    // only on the first load, so a refresh after the redirect keeps the cleared storage
    if (sessionStorage.getItem('seeded')) return
    sessionStorage.setItem('seeded', '1')
    localStorage.setItem('token', 'expired.token')
    localStorage.setItem('userId', '1')
    localStorage.setItem('username', 'mj.cortas')
    localStorage.setItem('selectedScheduleId', '7')
  })
}

const seat = (page: Page, id: string) => page.getByRole('button', { name: new RegExp(`^Seat ${id},`) })

async function bookSeatA1(page: Page) {
  await page.goto('/bookseat')
  await seat(page, 'A1').click()
  await page.getByRole('button', { name: 'Confirm booking' }).click()
  await page.getByRole('button', { name: 'Yes, Book Now' }).click()
}

test.describe('session expired (401 from a protected endpoint)', () => {
  test('booking: clears localStorage, goes to / and says why', async ({ page }) => {
    await seed(page)
    await mockApi(page)
    await bookSeatA1(page)

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText(EXPIRED_BANNER)).toBeVisible()
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([])
    // no "Booking Failed" dialog is left behind
    await expect(page.getByRole('button', { name: 'Okay' })).toHaveCount(0)
  })

  test('the reason is shown once: a refresh on / does not repeat it', async ({ page }) => {
    await seed(page)
    await mockApi(page)
    await bookSeatA1(page)
    await expect(page.getByText(EXPIRED_BANNER)).toBeVisible()
    await page.reload()
    await expect(page.getByLabel('Username')).toBeVisible()
    await expect(page.getByText(EXPIRED_BANNER)).toHaveCount(0)
  })

  test('My Bookings: a 401 on the tickets call goes to /', async ({ page }) => {
    await seed(page)
    await mockApi(page)
    await page.goto('/tickets')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText(EXPIRED_BANNER)).toBeVisible()
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([])
  })

  test('other errors are unchanged: a 400 still shows "Booking Failed" and keeps the session', async ({ page }) => {
    await seed(page)
    await mockApi(page, { book: (route) => json(route, 400, { message: 'Seat is already taken.' }, CRED_CORS) })
    await bookSeatA1(page)

    await expect(page.getByText('Booking Failed')).toBeVisible()
    await expect(page.getByText('Seat is already taken.')).toBeVisible()
    await expect(page).toHaveURL(/\/bookseat$/)
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBe('expired.token')
  })

  test('a 401 from /user/login is a wrong password, not an expired session', async ({ page }) => {
    await mockApi(page, { login: (route) => json(route, 401, { message: 'Bad credentials' }) })
    await page.goto('/')
    await page.getByLabel('Username').fill('mj.cortas')
    await page.getByLabel('Password', { exact: true }).fill('wrong-pass')
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page.getByText('Invalid Username or Password.')).toBeVisible()
    await expect(page.getByText(EXPIRED_BANNER)).toHaveCount(0)
    await expect(page).toHaveURL(/\/$/)
  })
})
