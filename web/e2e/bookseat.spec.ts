import { expect, test, type Page, type Route } from '@playwright/test'
import { fetchSession } from './auth.ts'
import { API_URL, getCredentials } from './env.ts'

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
  schedule?: unknown | ((route: Route) => unknown)
  prices?: (route: Route) => unknown
  occupied?: (route: Route) => unknown
  book?: (route: Route) => unknown
}

type Call = { method: string; path: string; headers: Record<string, string>; body: unknown }

/** Mocks the booking endpoints plus what /dashboard needs after a successful booking. */
async function mockApi(page: Page, opts: MockOptions = {}) {
  const log: Call[] = []
  await page.route(`${API_URL}/**`, async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CRED_CORS })
    log.push({
      method: req.method(),
      path: url.pathname,
      headers: await req.allHeaders(),
      body: req.postData() ? JSON.parse(req.postData()!) : null,
    })
    if (url.pathname === '/schedule/7') {
      if (typeof opts.schedule === 'function') return opts.schedule(route)
      return json(route, 200, opts.schedule ?? schedule)
    }
    if (url.pathname === '/schedule/schedPrice/7') return opts.prices ? opts.prices(route) : json(route, 200, prices)
    if (url.pathname === '/seat/occupied/7') return opts.occupied ? opts.occupied(route) : json(route, 200, ['A3', 'A4', 'D1'])
    if (url.pathname === '/ticket/book') return opts.book ? opts.book(route) : json(route, 200, { ok: true }, CRED_CORS)
    if (['/movie/show', '/schedule/now-showing', '/schedule/coming-soon'].includes(url.pathname)) return json(route, 200, [])
    return json(route, 404, { message: 'unmocked' })
  })
  return log
}

async function seed(page: Page, extra: Record<string, string> = {}) {
  await page.addInitScript(
    (data) => {
      for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v)
    },
    { token: 't', userId: '1', username: 'mj.cortas', selectedScheduleId: '7', ...extra },
  )
}

const shot = (page: Page, project: string, name: string) =>
  page.screenshot({ path: `e2e-output/bookseat/${project}/${name}.png` })
const seat = (page: Page, id: string) => page.getByRole('button', { name: new RegExp(`^Seat ${id},`) })
const confirmBtn = (page: Page) => page.getByRole('button', { name: 'Confirm booking' })
const bookCalls = (log: Call[]) => log.filter((c) => c.path === '/ticket/book')

test.beforeEach(async ({ page }) => {
  await seed(page)
})

test.describe('seat booking: entry and loading', () => {
  test('no selectedScheduleId: logs the legacy error and goes to /', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('selectedScheduleId')) // runs after the seed
    const log = await mockApi(page)
    const logs: string[] = []
    page.on('console', (m) => logs.push(m.text()))
    await page.goto('/bookseat')
    await expect(page).toHaveURL(/\/$/)
    expect(logs.some((l) => l.includes('No Schedule ID found! Redirecting to home...'))).toBe(true)
    expect(log.filter((c) => c.path.startsWith('/schedule/') || c.path.startsWith('/seat/'))).toEqual([])
  })

  test('load calls: schedule + prices without headers, occupied with Bearer + JSON', async ({ page }) => {
    const log = await mockApi(page)
    await page.goto('/bookseat')
    await expect(seat(page, 'D6')).toBeVisible()
    const sched = log.find((c) => c.path === '/schedule/7')!
    const price = log.find((c) => c.path === '/schedule/schedPrice/7')!
    const occ = log.find((c) => c.path === '/seat/occupied/7')!
    for (const c of [sched, price]) {
      expect(c.method).toBe('GET')
      expect(c.headers['authorization']).toBeUndefined()
      expect(c.headers['content-type']).toBeUndefined()
    }
    expect(occ.method).toBe('GET')
    expect(occ.headers['authorization']).toBe('Bearer t')
    expect(occ.headers['content-type']).toContain('application/json')
  })

  test('loading skeleton, then the screen', async ({ page }, info) => {
    await mockApi(page, {
      occupied: async (route) => {
        await new Promise((r) => setTimeout(r, 1800))
        return json(route, 200, [])
      },
    })
    await page.goto('/bookseat')
    await expect(page.getByLabel('Loading seats')).toBeVisible()
    await shot(page, info.project.name, 'loading')
    await expect(seat(page, 'A1')).toBeVisible({ timeout: 6000 })
    await expect(page.getByLabel('Loading seats')).toHaveCount(0)
  })

  test('error: any failing call shows "Can\'t load seats" and Try again refetches all three', async ({ page }, info) => {
    let failing = true
    const log = await mockApi(page, {
      prices: (route) => (failing ? json(route, 500, { message: 'boom' }) : json(route, 200, prices)),
    })
    await page.goto('/bookseat')
    await expect(page.getByRole('heading', { name: "Can't load seats" })).toBeVisible()
    await expect(page.getByText('Failed to load movies.')).toBeVisible()
    await shot(page, info.project.name, 'error')
    const before = log.length
    failing = false
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(seat(page, 'A1')).toBeVisible()
    expect(log.length - before).toBe(3)
  })

  test('error when the server is unreachable', async ({ page }) => {
    await mockApi(page, { occupied: (route) => route.abort('failed') })
    await page.goto('/bookseat')
    await expect(page.getByText('The server is offline. Check your connection and try again.')).toBeVisible()
  })

  test('Back goes back in history', async ({ page }) => {
    await mockApi(page)
    await page.goto('/dashboard')
    await page.goto('/bookseat')
    await expect(seat(page, 'A1')).toBeVisible()
    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})

test.describe('seat booking: header', () => {
  test('title and subtitle from the response; no "Seats held" timer', async ({ page }, info) => {
    await mockApi(page)
    await page.goto('/bookseat')
    await expect(page.getByRole('heading', { name: 'Alpha Run' })).toBeVisible()
    await expect(page.getByText('SM City North · Cinema 3 · Sat 31 Oct, 4:15 PM')).toBeVisible()
    await expect(page.getByText(/Seats held/)).toHaveCount(0)
    await page.waitForLoadState('networkidle')
    await shot(page, info.project.name, 'default')
  })

  test('no movie: "Title Unavailable"; missing fields are left out of the subtitle', async ({ page }) => {
    await mockApi(page, {
      schedule: {
        cinema: { totalRows: 3, totalColumns: 4, seatLayout: 'SSSS', cinemaName: 'Cinema 3' },
      },
    })
    await page.goto('/bookseat')
    await expect(page.getByRole('heading', { name: 'Title Unavailable' })).toBeVisible()
    await expect(page.getByText('Cinema 3', { exact: true })).toBeVisible() // only the part that exists
    await expect(page.locator('header').getByText(/ · /)).toHaveCount(0)
  })

  test('no subtitle fields at all: no subtitle line', async ({ page }) => {
    await mockApi(page, { schedule: { movie: { title: 'Alpha Run' }, cinema: { totalRows: 2, totalColumns: 4, seatLayout: 'SSSS' } } })
    await page.goto('/bookseat')
    await expect(page.getByRole('heading', { name: 'Alpha Run' })).toBeVisible()
    await expect(page.locator('header p')).toHaveCount(0)
  })
})

test.describe('seat booking: seat map', () => {
  test('rows come from totalRows; seats numbered per row, aisles take no number', async ({ page }) => {
    await mockApi(page)
    await page.goto('/bookseat')
    await expect(seat(page, 'A1')).toBeVisible()
    // 10 rows (A..J) x 14 seats, layout SSSS_SSSSSS_SSSS
    await expect(page.getByRole('group', { name: 'Seat map' }).getByRole('button')).toHaveCount(10 * 14)
    await expect(seat(page, 'A14')).toBeVisible()
    await expect(seat(page, 'A15')).toHaveCount(0)
    await expect(seat(page, 'J1')).toBeVisible()
    await expect(seat(page, 'K1')).toHaveCount(0)
    await expect(page.locator('[aria-hidden="true"]').getByText('J', { exact: true })).toHaveCount(2) // row label both sides
  })

  test('custom layout: "SS_S" gives A1, A2, A3 (aisle does not consume a number)', async ({ page }) => {
    await mockApi(page, { schedule: { ...schedule, cinema: { ...schedule.cinema, totalRows: 2, seatLayout: 'SS_S' } } })
    await page.goto('/bookseat')
    await expect(seat(page, 'A3')).toBeVisible()
    await expect(page.getByRole('group', { name: 'Seat map' }).getByRole('button')).toHaveCount(2 * 3)
    await expect(seat(page, 'A4')).toHaveCount(0)
  })

  test('occupied seats are disabled; others toggle selected', async ({ page }) => {
    await mockApi(page)
    await page.goto('/bookseat')
    const occupied = page.getByRole('button', { name: 'Seat A3, occupied' })
    await expect(occupied).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Seat D1, occupied' })).toBeDisabled()
    await seat(page, 'D6').click()
    await expect(seat(page, 'D6')).toHaveAttribute('aria-pressed', 'true')
    await seat(page, 'D6').click()
    await expect(seat(page, 'D6')).toHaveAttribute('aria-pressed', 'false')
  })

  test('category borders by the legacy rule: A-B gold, G-H blue, others default', async ({ page }) => {
    await mockApi(page)
    await page.goto('/bookseat')
    for (const [id, cls] of [
      ['A1', /border-gd/],
      ['B7', /border-gd/],
      ['C1', /border-ln2/],
      ['F1', /border-ln2/],
      ['G1', /border-bl/],
      ['H14', /border-bl/],
      ['I1', /border-ln2/],
      ['J1', /border-ln2/],
    ] as const) {
      await expect(seat(page, id)).toHaveClass(cls)
    }
  })

  test('the real 12-seat layout (SSSS_SSSS_SSSS) fits the screen width without scrolling the seat map', async ({ page }) => {
    await mockApi(page, { schedule: { ...schedule, cinema: { ...schedule.cinema, totalRows: 10, seatLayout: 'SSSS_SSSS_SSSS' } } })
    await page.goto('/bookseat')
    await expect(seat(page, 'A12')).toBeVisible()
    const map = page.getByRole('group', { name: 'Seat map' })
    const [scrollWidth, clientWidth] = await map.evaluate((el) => [el.scrollWidth, el.clientWidth])
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
  })

  test('seat sizes follow tokens.md: 32x30 desktop, 20x22 mobile', async ({ page }, info) => {
    await mockApi(page)
    await page.goto('/bookseat')
    const box = await seat(page, 'D6').boundingBox()
    if (info.project.name === 'mobile') {
      expect([Math.round(box!.width), Math.round(box!.height)]).toEqual([20, 22])
    } else {
      expect([Math.round(box!.width), Math.round(box!.height)]).toEqual([32, 30])
    }
  })
})

test.describe('seat booking: price legend and total', () => {
  test('legend is generated from the rule, the row count and schedPrice', async ({ page }) => {
    await mockApi(page)
    await page.goto('/bookseat')
    const legend = page.getByRole('list', { name: 'Seat prices' })
    await expect(legend.getByRole('listitem')).toHaveCount(3)
    await expect(legend.getByRole('listitem').nth(0)).toHaveText(/VIP · rows A–B\s*₱450/)
    await expect(legend.getByRole('listitem').nth(1)).toHaveText(/Regular · rows C–F, I–J\s*₱320/)
    await expect(legend.getByRole('listitem').nth(2)).toHaveText(/Balcony · rows G–H\s*₱260/)
  })

  test('4 rows: no Balcony card; 1 row: "row A"', async ({ page }) => {
    await mockApi(page, { schedule: { ...schedule, cinema: { ...schedule.cinema, totalRows: 4 } } })
    await page.goto('/bookseat')
    const legend = page.getByRole('list', { name: 'Seat prices' })
    await expect(legend.getByRole('listitem')).toHaveCount(2)
    await expect(legend).toContainText('Regular · rows C–D')
    await expect(legend).not.toContainText('Balcony')
  })

  test('1 row: a single "row A" VIP card', async ({ page }) => {
    await mockApi(page, { schedule: { ...schedule, cinema: { ...schedule.cinema, totalRows: 1 } } })
    await page.goto('/bookseat')
    await expect(page.getByRole('list', { name: 'Seat prices' })).toHaveText(/VIP · row A\s*₱450/)
  })

  test('a category without a price shows a dash and counts as 0 in the total', async ({ page }) => {
    await mockApi(page, { prices: (route) => json(route, 200, [{ seatCategory: 'VIP', price: 450 }]) })
    await page.goto('/bookseat')
    await expect(page.getByRole('list', { name: 'Seat prices' }).getByRole('listitem').nth(1)).toContainText('—')
    await seat(page, 'D6').click()
    await seat(page, 'A1').click()
    await expect(page.getByText('₱450', { exact: true }).last()).toBeVisible()
  })

  test('chips in click order, "Total · N seats", thousands separator', async ({ page }, info) => {
    await mockApi(page)
    await page.goto('/bookseat')
    await expect(page.getByText('None', { exact: true })).toBeVisible()
    await seat(page, 'D6').click() // Regular 320
    await seat(page, 'A1').click() // VIP 450
    await seat(page, 'G1').click() // Balcony 260
    const chips = page.getByRole('list', { name: 'Selected seats' }).getByRole('listitem')
    await expect(chips).toHaveCount(3)
    await expect(chips.nth(0)).toContainText('D6')
    await expect(chips.nth(1)).toContainText('A1')
    await expect(chips.nth(2)).toContainText('G1')
    if (info.project.name !== 'mobile') {
      await expect(chips.nth(0)).toContainText('Regular')
      await expect(chips.nth(1)).toContainText('VIP')
      await expect(chips.nth(2)).toContainText('Balcony')
    }
    await expect(page.getByText('Total · 3 seats')).toBeVisible()
    await expect(page.getByText('₱1,030')).toBeVisible()
    await seat(page, 'G1').click()
    await expect(page.getByText('Total · 2 seats')).toBeVisible()
    await expect(page.getByText('₱770')).toBeVisible()
    await page.waitForLoadState('networkidle')
    await shot(page, info.project.name, 'selected')
  })

  test('the bottom bar stays visible while the page scrolls', async ({ page }) => {
    await mockApi(page)
    await page.goto('/bookseat')
    await expect(seat(page, 'A1')).toBeVisible()
    await page.mouse.wheel(0, 2000)
    await expect(confirmBtn(page)).toBeInViewport()
    const box = await confirmBtn(page).boundingBox()
    const vh = page.viewportSize()!.height
    expect(box!.y + box!.height).toBeLessThanOrEqual(vh)
  })
})

test.describe('seat booking: confirm and book', () => {
  test('confirm with no seats: in-page message, no dialog; message clears when a seat is picked', async ({ page }, info) => {
    await mockApi(page)
    await page.goto('/bookseat')
    await expect(confirmBtn(page)).toHaveAttribute('aria-disabled', 'true')
    await confirmBtn(page).click({ force: true }) // aria-disabled must still be clickable
    await expect(page.getByRole('alert')).toHaveText('Please select atleast one seat.')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await shot(page, info.project.name, 'no-seats-message')
    await seat(page, 'D6').click()
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('confirm dialog: exact message, summary, Go Back closes without booking', async ({ page }, info) => {
    const log = await mockApi(page)
    await page.goto('/bookseat')
    await seat(page, 'D6').click()
    await seat(page, 'D7').click()
    await confirmBtn(page).click()
    const dialog = page.getByRole('dialog', { name: 'Do you want to proceed with booking these seats?' })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Alpha Run')
    await expect(dialog).toContainText('Sat 31 Oct, 4:15 PM')
    await expect(dialog).toContainText('D6, D7')
    await expect(dialog).toContainText('₱640')
    await shot(page, info.project.name, 'confirm-dialog')
    await dialog.getByRole('button', { name: 'Go Back' }).click()
    await expect(dialog).toHaveCount(0)
    expect(bookCalls(log)).toHaveLength(0)
    await expect(seat(page, 'D6')).toHaveAttribute('aria-pressed', 'true') // selection kept
  })

  test('Yes, Book Now: POST /ticket/book with Bearer + JSON, typed body in click order, credentials included; then success dialog and Okay -> /dashboard', async ({ page, context }, info) => {
    await context.addCookies([
      { name: 'probe', value: '1', domain: new URL(API_URL).hostname, path: '/', secure: true, sameSite: 'None' },
    ])
    const log = await mockApi(page)
    await page.goto('/bookseat')
    await seat(page, 'D6').click()
    await seat(page, 'A1').click()
    await confirmBtn(page).click()
    await page.getByRole('button', { name: 'Yes, Book Now' }).click()

    const status = page.getByRole('dialog', { name: 'Booking Confirmed!' })
    await expect(status).toBeVisible()
    await expect(status).toContainText('Your seats are secured. Enjoy the show!')
    await shot(page, info.project.name, 'status-success')

    const call = bookCalls(log)[0]
    expect(bookCalls(log)).toHaveLength(1)
    expect(call.method).toBe('POST')
    expect(call.headers['authorization']).toBe('Bearer t')
    expect(call.headers['content-type']).toContain('application/json')
    expect(call.body).toEqual({ userId: 1, scheduleId: 7, selectedSeat: ['D6', 'A1'] })
    expect(typeof (call.body as { userId: unknown }).userId).toBe('number')
    expect(typeof (call.body as { scheduleId: unknown }).scheduleId).toBe('number')
    expect(call.headers['cookie'] ?? '').toContain('probe=1') // credentials: "include"

    await status.getByRole('button', { name: 'Okay' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('the success dialog can only be left with Okay (no Esc, no scrim click)', async ({ page }) => {
    await mockApi(page)
    await page.goto('/bookseat')
    await seat(page, 'D6').click()
    await confirmBtn(page).click()
    await page.getByRole('button', { name: 'Yes, Book Now' }).click()
    const status = page.getByRole('dialog', { name: 'Booking Confirmed!' })
    await expect(status).toBeVisible()
    await page.keyboard.press('Escape')
    await page.mouse.click(4, 4)
    await expect(status).toBeVisible()
  })

  test('failure: "Booking Failed" with the server message; Okay only closes and keeps the selection', async ({ page }, info) => {
    const log = await mockApi(page, { book: (route) => json(route, 409, { message: 'Seat D7 was taken' }, CRED_CORS) })
    await page.goto('/bookseat')
    await seat(page, 'D7').click()
    await confirmBtn(page).click()
    await page.getByRole('button', { name: 'Yes, Book Now' }).click()
    const status = page.getByRole('dialog', { name: 'Booking Failed' })
    await expect(status).toContainText('Seat D7 was taken')
    await shot(page, info.project.name, 'status-failed')
    await status.getByRole('button', { name: 'Okay' }).click()
    await expect(status).toHaveCount(0)
    expect(new URL(page.url()).pathname).toBe('/bookseat')
    await expect(seat(page, 'D7')).toHaveAttribute('aria-pressed', 'true')
    expect(bookCalls(log)).toHaveLength(1)
  })

  test('failure without a message: "An unexpected error occurred."', async ({ page }) => {
    await mockApi(page, { book: (route) => json(route, 500, {}, CRED_CORS) })
    await page.goto('/bookseat')
    await seat(page, 'D7').click()
    await confirmBtn(page).click()
    await page.getByRole('button', { name: 'Yes, Book Now' }).click()
    await expect(page.getByRole('dialog', { name: 'Booking Failed' })).toContainText('An unexpected error occurred.')
  })

  test('network error: still logged, and now shows "Booking Failed" / "Server is offline. Try again later."; Okay closes and keeps the selection', async ({ page }, info) => {
    const logs: string[] = []
    page.on('console', (m) => logs.push(m.text()))
    const log = await mockApi(page, { book: (route) => route.abort('failed') })
    await page.goto('/bookseat')
    await seat(page, 'D7').click()
    await confirmBtn(page).click()
    await page.getByRole('button', { name: 'Yes, Book Now' }).click()
    const status = page.getByRole('dialog', { name: 'Booking Failed' })
    await expect(status).toContainText('Server is offline. Try again later.')
    await shot(page, info.project.name, 'status-offline')
    expect(logs.some((l) => l.startsWith('Error : '))).toBe(true)
    await status.getByRole('button', { name: 'Okay' }).click()
    await expect(status).toHaveCount(0)
    expect(new URL(page.url()).pathname).toBe('/bookseat')
    await expect(seat(page, 'D7')).toHaveAttribute('aria-pressed', 'true')
    await expect(confirmBtn(page)).toBeEnabled()
    expect(bookCalls(log).length).toBeGreaterThanOrEqual(1) // the attempt was made once per click
  })

  test('while booking the button shows busy and a second request is not sent', async ({ page }) => {
    const log = await mockApi(page, {
      book: async (route) => {
        await new Promise((r) => setTimeout(r, 1500))
        return json(route, 200, { ok: true }, CRED_CORS)
      },
    })
    await page.goto('/bookseat')
    await seat(page, 'D7').click()
    await confirmBtn(page).click()
    await page.getByRole('button', { name: 'Yes, Book Now' }).click()
    await expect(confirmBtn(page)).toBeDisabled()
    await expect(confirmBtn(page)).toHaveAttribute('aria-busy', 'true')
    await expect(page.getByRole('dialog', { name: 'Booking Confirmed!' })).toBeVisible({ timeout: 5000 })
    expect(bookCalls(log)).toHaveLength(1)
  })
})

test.describe('seat booking: layout', () => {
  test('no horizontal overflow; the screen indicator and legends render', async ({ page }) => {
    await mockApi(page)
    await page.goto('/bookseat')
    await expect(seat(page, 'A1')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
    await expect(page.getByText('Screen', { exact: true })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Seat legend' })).toContainText('Available')
    await expect(page.getByRole('list', { name: 'Seat legend' })).toContainText('Selected')
    await expect(page.getByRole('list', { name: 'Seat legend' })).toContainText('Occupied')
  })
})

test.describe('seat booking (real backend, read-only: never books)', () => {
  test('loads a real schedule; seat map matches totalRows; confirm dialog opens and Go Back leaves nothing booked', async ({ page, request }, info) => {
    const creds = getCredentials('admin')
    test.skip(!creds, 'Needs admin credentials in web/.env.local (only to read /seat/occupied)')
    const now = await (await request.get(`${API_URL}/schedule/now-showing`, { timeout: 120_000 })).json()
    let scheduleId: number | null = null
    for (const m of now as { movieId: number }[]) {
      const list = await (await request.get(`${API_URL}/schedule/movieSchedules/${m.movieId}`)).json()
      if (Array.isArray(list) && list.length > 0) {
        scheduleId = list[0].scheduleId
        break
      }
    }
    test.skip(scheduleId === null, 'No real schedule available')
    const real = await (await request.get(`${API_URL}/schedule/${scheduleId}`)).json()
    const session = await fetchSession(request, 'admin')
    await page.addInitScript(
      (d) => {
        for (const [k, v] of Object.entries(d)) localStorage.setItem(k, v)
      },
      { token: session.jwtToken, userId: String(session.userId), username: session.username, selectedScheduleId: String(scheduleId) },
    )
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    const bookRequests: string[] = []
    page.on('request', (r) => { if (r.url().includes('/ticket/book')) bookRequests.push(r.url()) })

    await page.goto('/bookseat')
    await expect(page.getByRole('heading', { name: real.movie.title })).toBeVisible({ timeout: 120_000 })
    const seatButtons = page.getByRole('group', { name: 'Seat map' }).getByRole('button')
    const perRow = [...real.cinema.seatLayout].filter((c: string) => c !== '_').length
    await expect(seatButtons).toHaveCount(real.cinema.totalRows * perRow)
    await expect(page.getByRole('list', { name: 'Seat prices' }).getByRole('listitem').first()).toContainText('₱')
    const firstFree = page.getByRole('group', { name: 'Seat map' }).locator('button:not([disabled])').first()
    await firstFree.click()
    await confirmBtn(page).click()
    await expect(page.getByRole('dialog', { name: 'Do you want to proceed with booking these seats?' })).toBeVisible()
    await shot(page, info.project.name, 'real-confirm')
    await page.getByRole('button', { name: 'Go Back' }).click()
    expect(bookRequests).toEqual([])
    expect(errors.filter((e) => /CORS|Access-Control|Failed to fetch|TypeError/i.test(e))).toEqual([])
  })
})
