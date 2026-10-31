import { expect, test, type Page, type Route } from '@playwright/test'
import { API_URL } from './env.ts'
import { posterPng } from './png.ts'

// Generates the images used in the root README.md into ../docs/ (run: npx playwright test readme-shots).
// The backend is mocked with sample data, so the shots are repeatable and show no real user data.

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
}
const json = (route: Route, body: unknown) =>
  route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) })

const HOUR = 3_600_000
const DAY = 24 * HOUR
const p2 = (n: number) => String(n).padStart(2, '0')
const day = (offsetMs: number) => {
  const d = new Date(Date.now() + offsetMs)
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
}
/** A fixed clock time on a day `days` from today (always upcoming for days >= 1), e.g. at(1, '19:30'). */
const at = (days: number, time: string) => ({ showDate: day(days * DAY), startTime: time })

const hues = [2, 212, 275, 160, 32, 340, 190, 48]
const titles = ['Night Harbor', 'Deep Quiet', 'Ember Road', 'The Last Signal', 'Kite Season', 'Hollow Crown', 'Low Tide', 'Copper Sky']
const overview =
  'A harbor pilot takes one last job and learns the cargo is the crew. With the port closing at dawn, every hour on the water costs her something she can’t get back.'
const nowShowing = titles.map((title, i) => ({
  movieId: i + 1, title, poster: `/p${i + 1}.jpg`, rating: 8.4 - i * 0.2, overview, status: 'NOW_SHOWING',
}))
const comingSoon = ['Paper Lanterns', 'Salt Line', 'Afterglow'].map((title, i) => ({
  movieId: 20 + i, title, poster: `/p${i + 4}.jpg`, rating: 7.2 - i * 0.2, overview, status: 'COMING_SOON', showDate: day((10 + i * 7) * DAY),
}))
const schedulesFor = (id: number) => {
  const [north, ayala, galleria] = ['SM City North', 'Ayala Harbor Point', 'Robinsons Galleria']
  return [
    { scheduleId: 100 + id, ...at(1, '13:30'), cinema: { location: north } },
    { scheduleId: 200 + id, ...at(1, '16:15'), cinema: { location: north } },
    { scheduleId: 300 + id, ...at(1, '19:00'), cinema: { location: north } },
    { scheduleId: 400 + id, ...at(1, '14:00'), cinema: { location: ayala } },
    { scheduleId: 500 + id, ...at(1, '17:30'), cinema: { location: ayala } },
    { scheduleId: 600 + id, ...at(1, '21:15'), cinema: { location: ayala } },
    { scheduleId: 700 + id, ...at(2, '18:45'), cinema: { location: galleria } },
  ]
}

const tickets = [
  ['Night Harbor', 2, 'D6', 'REGULAR', 'ACTIVE'], ['Night Harbor', 2, 'D7', 'REGULAR', 'ACTIVE'],
  ['Night Harbor', 2, 'A3', 'VIP', 'ACTIVE'], ['Ember Road', 3, 'H5', 'BALCONY', 'ACTIVE'],
  ['Deep Quiet', -2, 'C4', 'REGULAR', 'COMPLETED'],
].map(([title, d, seatNumber, seatCategory, ticketStatus], i) => ({
  title, ...at(d as number, '19:30'), location: i === 3 ? 'Ayala Harbor Point' : 'SM City North',
  seatNumber, seatCategory, ticketCode: `MJC-${String(title).slice(0, 2).toUpperCase()}${i}K${i + 3}Q`, ticketStatus,
}))

const trend: Record<string, number> = {}
;[88, 140, 120, 210, 190, 260, 240, 330, 300, 360, 340, 410].forEach((v, i) => {
  const d = new Date()
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - (11 - i) * 7)
  trend[`${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`] = v
})

const responses: Record<string, unknown> = {
  '/movie/show': [...nowShowing, ...comingSoon],
  '/schedule/now-showing': nowShowing,
  '/schedule/coming-soon': comingSoon,
  '/schedule/7': {
    scheduleId: 7, movie: { title: 'Night Harbor' }, ...at(1, '19:00'),
    cinema: { cinemaName: 'Cinema 3', location: 'SM City North', totalRows: 10, totalColumns: 14, seatLayout: 'SSSS_SSSSSS_SSSS' },
  },
  '/schedule/schedPrice/7': [
    { seatCategory: 'VIP', price: 450 }, { seatCategory: 'REGULAR', price: 320 }, { seatCategory: 'BALCONY', price: 260 },
  ],
  '/seat/occupied/7': ['A3', 'A4', 'B7', 'B8', 'C5', 'D1', 'D2', 'E9', 'E10', 'F6', 'G3', 'G4', 'G11', 'H8', 'J5'],
  '/ticket/mytickets': tickets,
  '/user/getUser': { username: 'mj.cortas', balance: 1240 },
  '/ticket/totalSales': 482300,
  '/ticket/showTotalBookings': 3284,
  '/user/showTotalUsers': 1126,
  '/ticket/showRevenueToday': 18940.5,
  '/ticket/getSalesTrend': trend,
  '/movie/leaderboard': [96400, 81200, 72950, 58300, 44880].map((revenue, i) => ({ title: titles[i], revenue })),
  '/movie/showActiveCount': { activeCount: 12, totalCount: 18 },
  '/movie/showMovieTable': [
    ...titles.slice(0, 6).map((title, i) => ({
      title, rating: 8.4 - i * 0.2, releaseDate: day(-(40 + i * 9) * DAY), status: 'NOW_SHOWING',
      revenue: [96400, 81200, 72950, 58300, 44880, 37600][i],
    })),
    ...comingSoon.slice(0, 2).map((m) => ({ title: m.title, rating: m.rating, releaseDate: m.showDate, status: 'COMING_SOON', revenue: 0 })),
  ],
  '/schedule/bestShowtime': [
    { slot: 'EVENING', averageRevenue: 8420 }, { slot: 'NIGHT', averageRevenue: 7150 }, { slot: 'AFTERNOON', averageRevenue: 5380 },
  ],
  '/schedule/showScheduleCount': 64,
  '/schedule/showAverageRevenue': 5920.5,
  '/schedule/seatStats': [
    ['Night Harbor', 'Cinema 3', 'EVENING', 118, 22], ['Deep Quiet', 'Cinema 1', 'NIGHT', 96, 44],
    ['Ember Road', 'Cinema 5', 'AFTERNOON', 71, 69], ['The Last Signal', 'Cinema 2', 'MORNING', 38, 102],
    ['Kite Season', 'Cinema 4', 'EVENING', 105, 35],
  ].map(([title, cinemaName, slot, occupiedSeats, availableSeats], i) => ({
    title, cinemaName, showDate: day(i * DAY), slot, occupiedSeats, availableSeats,
    percentage: Math.round(((occupiedSeats as number) / ((occupiedSeats as number) + (availableSeats as number))) * 100),
  })),
}

async function setup(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 't')
    localStorage.setItem('userId', '1')
    localStorage.setItem('username', 'mj.cortas')
    localStorage.setItem('selectedScheduleId', '7')
  })
  await page.route('https://image.tmdb.org/**', (route) => {
    const id = Number(/p(\d+)\.jpg/.exec(route.request().url())?.[1] ?? 1)
    return route.fulfill({ contentType: 'image/png', body: posterPng(hues[(id - 1) % hues.length], 400, 600) })
  })
  await page.route(`${API_URL}/**`, (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    const path = new URL(route.request().url()).pathname
    const movieSchedules = /^\/schedule\/movieSchedules\/(\d+)$/.exec(path)
    if (movieSchedules) return json(route, schedulesFor(Number(movieSchedules[1])))
    return path in responses ? json(route, responses[path]) : route.fulfill({ status: 404, headers: CORS, body: '{}' })
  })
}

const settle = async (page: Page) => {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)
}
const out = (name: string) => `../docs/screenshots/${name}.png`

test.describe('desktop', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1000, 'desktop project only')
  test.beforeEach(({ page }) => setup(page))

  test('logo', async ({ page }) => {
    await page.goto('/dashboard')
    await settle(page)
    // Lift the real Logo component out of the navbar onto an empty, transparent page.
    await page.evaluate(() => {
      const logo = document.querySelector('[role="img"][aria-label="MJCinema"]')!.cloneNode(true) as HTMLElement
      document.documentElement.style.background = 'transparent'
      document.body.style.background = 'transparent'
      document.body.innerHTML = ''
      const box = document.createElement('div')
      box.id = 'logo-box'
      box.style.cssText = 'display:inline-block;padding:6px 10px;zoom:6'
      box.appendChild(logo)
      document.body.appendChild(box)
    })
    await page.locator('#logo-box').screenshot({ path: '../docs/logo.png', omitBackground: true })
  })

  test('login', async ({ page }) => {
    await page.goto('/')
    await settle(page)
    await page.getByLabel('Username').fill('mj.cortas')
    await page.screenshot({ path: out('login') })
  })

  test('dashboard + movie modal', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1300 })
    await page.goto('/dashboard')
    await expect(page.locator('main button:has(img)').first()).toBeVisible()
    await settle(page)
    await page.screenshot({ path: out('dashboard') })
    await page.locator('main button:has(img)').nth(1).click()
    const modal = page.getByRole('dialog')
    await expect(modal.getByRole('heading', { name: 'Pick a showtime' })).toBeVisible()
    await modal.getByRole('button', { name: /^\d{1,2}:\d{2} [AP]M$/ }).first().click()
    await settle(page)
    await page.screenshot({ path: out('movie-showtimes') })
  })

  test('seat booking', async ({ page }) => {
    await page.goto('/bookseat')
    await expect(page.getByRole('button', { name: /^Seat E5,/ })).toBeVisible()
    for (const id of ['E5', 'E6', 'E7']) await page.getByRole('button', { name: new RegExp(`^Seat ${id},`) }).click()
    await settle(page)
    await page.screenshot({ path: out('seat-booking') })
  })

  test('my bookings', async ({ page }) => {
    await page.goto('/tickets')
    await expect(page.getByText('mj.cortas')).toBeVisible()
    await settle(page)
    await page.screenshot({ path: out('my-bookings') })
  })

  test('admin', async ({ page }) => {
    for (const [path, name, ready] of [
      ['/admin', 'admin-home', 'Wk of'],
      ['/admin/movies', 'admin-movies', 'Hollow Crown'],
      ['/admin/schedules', 'admin-schedules', 'Kite Season'],
    ]) {
      await page.goto(path)
      await expect(page.getByText(ready).first()).toBeVisible()
      await settle(page)
      await page.screenshot({ path: out(name) })
    }
  })
})

test.describe('mobile', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 1000, 'mobile project only')
  test.use({ deviceScaleFactor: 2 })
  test.beforeEach(({ page }) => setup(page))

  test('mobile screens', async ({ page }) => {
    await page.goto('/')
    await settle(page)
    await page.screenshot({ path: out('mobile-login') })

    await page.goto('/dashboard')
    await expect(page.locator('main button:has(img)').first()).toBeVisible()
    await settle(page)
    await page.screenshot({ path: out('mobile-dashboard') })

    await page.goto('/bookseat')
    await expect(page.getByRole('button', { name: /^Seat E5,/ })).toBeVisible()
    for (const id of ['E5', 'E6']) await page.getByRole('button', { name: new RegExp(`^Seat ${id},`) }).click()
    await settle(page)
    await page.screenshot({ path: out('mobile-seat-booking') })

    await page.goto('/tickets')
    await expect(page.getByText('mj.cortas')).toBeVisible()
    await settle(page)
    await page.screenshot({ path: out('mobile-my-bookings') })
  })
})
