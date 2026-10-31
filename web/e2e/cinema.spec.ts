import { expect, test, type Page, type Route } from '@playwright/test'
import { API_URL } from './env.ts'
import { posterPng } from './png.ts'

const CORS = { 'access-control-allow-origin': '*' }
const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) })

const cinemas = [
  { cinemaId: 1, cinemaName: 'SM City North', location: 'Quezon City' },
  { cinemaId: 2, cinemaName: 'Ayala Harbor Point', location: 'Makati' },
  { cinemaId: 3, cinemaName: 'Robinsons Galleria', location: 'Ortigas' },
  { cinemaId: 4, cinemaName: 'Empty Hall', location: 'Pasay' },
]
const movie = (movieId: number, title: string, rating: number, status: string) => ({
  movieId,
  title,
  poster: `/p${movieId}.jpg`,
  rating,
  overview: `Overview for ${title}.`,
  status,
})
const catalogue = [
  movie(1, 'Alpha Run', 8.2, 'NOW_SHOWING'),
  movie(2, 'Bravo Tide', 7.94, 'NOW_SHOWING'),
  movie(3, 'Charlie Peak', 7.2, 'COMING_SOON'),
  movie(4, 'Delta Force', 6.5, 'NEW_RELEASE'),
]
const moviesByCinema: Record<number, unknown[]> = {
  1: [catalogue[0], catalogue[1], catalogue[2], catalogue[3]],
  2: [catalogue[0]],
  3: [catalogue[1], catalogue[2]],
  4: [],
}

interface MockOptions {
  cinemaAll?: (route: Route) => unknown
  cinemaMovies?: (route: Route, cinemaId: number) => unknown
}

async function mockApi(page: Page, opts: MockOptions = {}) {
  const log: { path: string; headers: Record<string, string> }[] = []
  await page.route('**/image.tmdb.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: posterPng(212) }),
  )
  await page.route(`${API_URL}/**`, (route) => {
    const url = new URL(route.request().url())
    log.push({ path: url.pathname, headers: route.request().headers() })
    if (url.pathname === '/movie/show') return json(route, 200, catalogue)
    if (url.pathname === '/schedule/now-showing') return json(route, 200, [catalogue[0], catalogue[1]])
    if (url.pathname === '/schedule/coming-soon') return json(route, 200, [])
    if (url.pathname.startsWith('/schedule/movieSchedules/')) return json(route, 200, [])
    if (url.pathname === '/cinema/all') return opts.cinemaAll ? opts.cinemaAll(route) : json(route, 200, cinemas)
    if (url.pathname.startsWith('/cinema/movies/')) {
      const id = Number(url.pathname.split('/').pop())
      return opts.cinemaMovies ? opts.cinemaMovies(route, id) : json(route, 200, moviesByCinema[id] ?? [])
    }
    return json(route, 404, { message: 'unmocked' })
  })
  return log
}

const nav = (page: Page) => page.getByRole('navigation', { name: 'Main' })
const cinemaCalls = (log: { path: string }[]) => log.filter((l) => l.path === '/cinema/all').length
const shot = (page: Page, project: string, name: string) =>
  page.screenshot({ path: `e2e-output/cinema/${project}/${name}.png` })
const cinemaCard = (page: Page, name: string) => page.getByRole('button', { name: new RegExp(name) })
const backToCinemas = (page: Page) => page.getByRole('button', { name: 'Back to cinemas' })

async function openCinemaTab(page: Page) {
  await page.goto('/dashboard')
  await nav(page).getByRole('button', { name: 'Cinema' }).click()
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 't')
    localStorage.setItem('userId', '1')
    localStorage.setItem('username', 'mj.cortas')
  })
})

test.describe('cinema tab: list', () => {
  test('GET /cinema/all without headers; cards show name and location; Cinema link is active', async ({ page }, info) => {
    const log = await mockApi(page)
    await openCinemaTab(page)
    await expect(page.getByRole('heading', { name: 'Cinemas', exact: true })).toBeVisible()
    await expect(page.getByText("Pick a cinema to see what's playing there.")).toBeVisible()
    await expect(nav(page).getByRole('button', { name: 'Cinema' })).toHaveAttribute('aria-current', 'page')
    for (const c of cinemas) {
      await expect(cinemaCard(page, c.cinemaName)).toContainText(c.location)
    }
    // no per-cinema movie counts on the list: the API does not provide them
    await expect(page.getByText(/movies now playing/)).toHaveCount(0)
    const call = log.find((l) => l.path === '/cinema/all')!
    expect(call.headers['authorization']).toBeUndefined()
    expect(call.headers['content-type']).toBeUndefined()
    await page.waitForLoadState('networkidle')
    await shot(page, info.project.name, 'list')
  })

  test('loading skeleton', async ({ page }, info) => {
    await mockApi(page, {
      cinemaAll: async (route) => {
        await new Promise((r) => setTimeout(r, 1800))
        return json(route, 200, cinemas)
      },
    })
    await openCinemaTab(page)
    await expect(page.getByLabel('Loading cinemas')).toBeVisible()
    await shot(page, info.project.name, 'list-loading')
    await expect(cinemaCard(page, 'SM City North')).toBeVisible({ timeout: 6000 })
    await expect(page.getByLabel('Loading cinemas')).toHaveCount(0)
  })

  test('error: "Error connecting to MJCinema server." and Try again refetches', async ({ page }, info) => {
    let failing = true
    const log = await mockApi(page, {
      cinemaAll: (route) => (failing ? json(route, 500, { message: 'boom' }) : json(route, 200, cinemas)),
    })
    await openCinemaTab(page)
    await expect(page.getByText('Error connecting to MJCinema server.')).toBeVisible()
    await shot(page, info.project.name, 'list-error')
    const before = cinemaCalls(log)
    failing = false
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(cinemaCard(page, 'SM City North')).toBeVisible()
    expect(cinemaCalls(log)).toBe(before + 1)
  })

  test('error when the server is unreachable shows the same message', async ({ page }) => {
    await mockApi(page, { cinemaAll: (route) => route.abort('failed') })
    await openCinemaTab(page)
    await expect(page.getByText('Error connecting to MJCinema server.')).toBeVisible()
  })

  test('no cinemas: empty panel', async ({ page }) => {
    await mockApi(page, { cinemaAll: (route) => json(route, 200, []) })
    await openCinemaTab(page)
    await expect(page.getByRole('heading', { name: 'No cinemas yet' })).toBeVisible()
  })

  test('entering the Cinema tab fetches /cinema/all again each time (legacy)', async ({ page }) => {
    const log = await mockApi(page)
    await openCinemaTab(page)
    await expect(cinemaCard(page, 'SM City North')).toBeVisible()
    const first = cinemaCalls(log) // dev StrictMode may run the mount effect twice, so compare, don't hardcode
    expect(first).toBeGreaterThanOrEqual(1)
    await nav(page).getByRole('button', { name: 'Now Showing' }).click()
    await nav(page).getByRole('button', { name: 'Cinema' }).click()
    await expect(cinemaCard(page, 'SM City North')).toBeVisible()
    expect(cinemaCalls(log)).toBeGreaterThan(first)
  })
})

test.describe('cinema tab: detail', () => {
  test('click a cinema: GET /cinema/movies/{id}, header with count, rows with poster/title/rating/status', async ({ page }, info) => {
    const log = await mockApi(page)
    await openCinemaTab(page)
    await cinemaCard(page, 'SM City North').click()
    await expect(page.getByRole('heading', { name: 'SM City North' })).toBeVisible()
    await expect(page.getByText('Quezon City · 4 movies now playing')).toBeVisible()
    const call = log.find((l) => l.path === '/cinema/movies/1')!
    expect(call).toBeTruthy()
    expect(call.headers['authorization']).toBeUndefined()
    expect(call.headers['content-type']).toBeUndefined()

    const rows = page.locator('main button:has(img)')
    await expect(rows).toHaveCount(4)
    await expect(rows.nth(0)).toContainText('Alpha Run')
    await expect(rows.nth(0)).toContainText('8.2')
    await expect(rows.nth(0).locator('img')).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w500/p1.jpg')
    await expect(rows.nth(1)).toContainText('7.9') // 7.94 -> 7.9
    // status pill: underscores replaced by spaces, design pill colours
    await expect(rows.nth(0).getByText('Now showing')).toHaveClass(/text-ok/)
    await expect(rows.nth(2).getByText('Coming soon')).toHaveClass(/text-wn/)
    await expect(rows.nth(3).getByText('New release')).toHaveClass(/text-mu/)
    await expect(page.getByText('Thriller')).toHaveCount(0) // genre omitted
    await page.waitForLoadState('networkidle')
    await shot(page, info.project.name, 'detail')
  })

  test('singular count: "1 movie now playing"', async ({ page }) => {
    await mockApi(page)
    await openCinemaTab(page)
    await cinemaCard(page, 'Ayala Harbor Point').click()
    await expect(page.getByText('Makati · 1 movie now playing')).toBeVisible()
  })

  test('Back to cinemas returns to the list without calling /cinema/all again', async ({ page }) => {
    const log = await mockApi(page)
    await openCinemaTab(page)
    await cinemaCard(page, 'Robinsons Galleria').click()
    await expect(page.getByRole('heading', { name: 'Robinsons Galleria' })).toBeVisible()
    const before = cinemaCalls(log)
    await backToCinemas(page).click()
    await expect(page.getByRole('heading', { name: 'Cinemas', exact: true })).toBeVisible()
    await expect(cinemaCard(page, 'SM City North')).toBeVisible()
    expect(cinemaCalls(log)).toBe(before)
  })

  test('opening another cinema fetches its own movies', async ({ page }) => {
    const log = await mockApi(page)
    await openCinemaTab(page)
    await cinemaCard(page, 'SM City North').click()
    await expect(page.getByText('4 movies now playing')).toBeVisible()
    await backToCinemas(page).click()
    await cinemaCard(page, 'Robinsons Galleria').click()
    await expect(page.getByText('Ortigas · 2 movies now playing')).toBeVisible()
    expect(log.map((l) => l.path)).toEqual(expect.arrayContaining(['/cinema/movies/1', '/cinema/movies/3']))
  })

  test('empty cinema: design panel, copy, and Back to cinemas', async ({ page }, info) => {
    await mockApi(page)
    await openCinemaTab(page)
    await cinemaCard(page, 'Empty Hall').click()
    await expect(page.getByRole('heading', { name: 'No movies currently playing here' })).toBeVisible()
    await expect(page.getByText('Check another cinema, or come back when new schedules are added.')).toBeVisible()
    await shot(page, info.project.name, 'empty')
    await backToCinemas(page).click()
    await expect(page.getByRole('heading', { name: 'Cinemas', exact: true })).toBeVisible()
  })

  test('loading skeleton and error + retry on the detail view', async ({ page }, info) => {
    let mode: 'slow' | 'fail' | 'ok' = 'slow'
    await mockApi(page, {
      cinemaMovies: async (route, id) => {
        if (mode === 'slow') {
          await new Promise((r) => setTimeout(r, 1500))
          return json(route, 200, moviesByCinema[id])
        }
        return mode === 'fail' ? json(route, 500, { message: 'boom' }) : json(route, 200, moviesByCinema[id])
      },
    })
    await openCinemaTab(page)
    await cinemaCard(page, 'SM City North').click()
    await expect(page.getByLabel('Loading movies')).toBeVisible()
    await shot(page, info.project.name, 'detail-loading')
    await expect(page.locator('main button:has(img)').first()).toBeVisible({ timeout: 6000 })
    await backToCinemas(page).click()

    mode = 'fail'
    await cinemaCard(page, 'SM City North').click()
    await expect(page.getByRole('heading', { name: "Can't load movies" })).toBeVisible()
    await expect(page.getByText('Failed to load movies.')).toBeVisible()
    await shot(page, info.project.name, 'detail-error')
    mode = 'ok'
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.locator('main button:has(img)')).toHaveCount(4)
  })

  test('clicking a movie opens the movie modal in no-booking mode', async ({ page }, info) => {
    const log = await mockApi(page)
    await openCinemaTab(page)
    await cinemaCard(page, 'SM City North').click()
    await expect(page.locator('main button:has(img)')).toHaveCount(4)
    const callsBefore = log.length
    await page.locator('main button:has(img)').nth(1).click() // Bravo Tide, id 2
    const modal = page.getByRole('dialog', { name: 'Bravo Tide' })
    await expect(modal).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('movieId'))).toBe('2')
    await expect(modal).toContainText('Overview for Bravo Tide.') // from the shared movie list
    await expect(modal).toContainText('7.9')
    await expect(modal.getByRole('heading', { name: 'Pick a showtime' })).toHaveCount(0)
    await expect(modal.getByRole('button', { name: 'Select seats' })).toHaveCount(0)
    await page.waitForTimeout(300)
    expect(log.length).toBe(callsBefore) // no-booking mode: opening the modal makes no request
    await shot(page, info.project.name, 'movie-modal')
    await modal.getByRole('button', { name: 'Close' }).click()
    // still on the same cinema detail afterwards
    await expect(page.getByRole('heading', { name: 'SM City North' })).toBeVisible()
  })

  test('no horizontal overflow on list and detail', async ({ page }) => {
    await mockApi(page)
    await openCinemaTab(page)
    await expect(cinemaCard(page, 'SM City North')).toBeVisible()
    const overflow = () =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(await overflow()).toBe(0)
    await cinemaCard(page, 'SM City North').click()
    await expect(page.getByText('4 movies now playing')).toBeVisible()
    expect(await overflow()).toBe(0)
  })
})

test.describe('cinema tab (real backend, read-only)', () => {
  test('loads real cinemas; opens the first one; no CORS errors', async ({ page }, info) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    const statuses: Record<string, number> = {}
    page.on('response', (r) => {
      if (r.url().startsWith(API_URL)) statuses[new URL(r.url()).pathname] = r.status()
    })
    await openCinemaTab(page)
    // On the list view every button inside <main> is a cinema card (or the retry button on error).
    const cinemaButtons = page.locator('main button').filter({ hasNotText: 'Try again' })
    await expect(page.getByRole('heading', { name: 'Cinemas', exact: true })).toBeVisible({ timeout: 120_000 })
    await expect(
      cinemaButtons.first().or(page.getByRole('heading', { name: 'No cinemas yet' })).or(page.getByText('Error connecting to MJCinema server.')),
    ).toBeVisible({ timeout: 120_000 })
    await expect(page.getByText('Error connecting to MJCinema server.')).toHaveCount(0)
    expect(statuses['/cinema/all']).toBe(200)
    await shot(page, info.project.name, 'real-list')
    if ((await cinemaButtons.count()) > 0) {
      await cinemaButtons.first().click()
      await expect(backToCinemas(page)).toBeVisible()
      await expect(page.getByLabel('Loading movies')).toHaveCount(0, { timeout: 60_000 })
      await expect(page.getByRole('heading', { name: "Can't load movies" })).toHaveCount(0)
      await shot(page, info.project.name, 'real-detail')
    }
    expect(errors.filter((e) => /CORS|Access-Control|Failed to fetch/i.test(e))).toEqual([])
  })
})
