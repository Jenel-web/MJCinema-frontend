import { expect, test, type Page, type Route } from '@playwright/test'
import { API_URL } from './env.ts'
import { posterPng } from './png.ts'

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
}
const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) })
const text = (route: Route, status: number, body: string) =>
  route.fulfill({ status, contentType: 'text/plain', headers: CORS, body })

const leaderboard = [
  { title: 'Night Harbor', revenue: 96400 },
  { title: 'Deep Quiet', revenue: 81200 },
  { title: 'Ember Road', revenue: 72950 },
  { title: 'The Last Signal', revenue: 58300 },
  { title: 'Kite Season', revenue: 44880 },
]
const table = [
  { title: 'Night Harbor', rating: 8.2, releaseDate: '2026-10-10', status: 'NOW_SHOWING', revenue: 96400 },
  { title: 'Deep Quiet', rating: 8.4, releaseDate: '2026-09-26', status: 'NOW_SHOWING', revenue: 81200 },
  { title: 'Low Tide', rating: 7.2, releaseDate: '2026-11-14', status: 'COMING_SOON', revenue: 0 },
  { title: 'Hollow Crown', rating: 7.1, releaseDate: '2026-08-22', status: 'INACTIVE', revenue: 37600 },
  { title: 'Fresh One', rating: 6, releaseDate: '2026-11-01', status: 'NEW', revenue: 0 },
]
const tmdb = [
  { id: 11, title: 'Night Harbor', release_date: '2026-03-02', vote_average: 8.24, poster_path: '/p1.jpg' },
  { id: 12, title: 'Night Orchard', release_date: '2024-05-01', vote_average: 6.8, poster_path: null },
]

interface Seen {
  reqs: { method: string; path: string; search: string; headers: Record<string, string>; body: string | null }[]
}

async function mock(page: Page, over: Record<string, (r: Route) => unknown> = {}): Promise<Seen> {
  const seen: Seen = { reqs: [] }
  await page.addInitScript(() => localStorage.setItem('token', 'tok123'))
  await page.route('https://image.tmdb.org/**', (r) =>
    r.fulfill({ contentType: 'image/png', body: posterPng(212) }),
  )
  await page.route(`${API_URL}/**`, (route) => {
    const req = route.request()
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    const url = new URL(req.url())
    seen.reqs.push({
      method: req.method(),
      path: url.pathname,
      search: url.search,
      headers: req.headers(),
      body: req.postData(),
    })
    if (over[url.pathname]) return over[url.pathname](route)
    const ok: Record<string, unknown> = {
      '/movie/leaderboard': leaderboard,
      '/movie/showActiveCount': { activeCount: 12, totalCount: 18 },
      '/movie/showMovieTable': table,
      '/movie/tmdb/search': tmdb,
    }
    if (url.pathname === '/movie/add') return text(route, 200, 'Movie added successfully')
    return url.pathname in ok ? json(route, 200, ok[url.pathname]) : json(route, 404, {})
  })
  return seen
}
const count = (seen: Seen, path: string) => seen.reqs.filter((r) => r.path === path).length

test('movies: loads three calls, leaderboard, count, table, filter', async ({ page }, testInfo) => {
  const seen = await mock(page)
  await page.goto('/admin/movies')
  await expect(page.getByText('Night Harbor').first()).toBeVisible()
  expect(new Set(seen.reqs.map((r) => r.path))).toEqual(
    new Set(['/movie/leaderboard', '/movie/showActiveCount', '/movie/showMovieTable']),
  )
  for (const r of seen.reqs) {
    expect(r.method).toBe('GET')
    expect(r.headers['authorization']).toBe('Bearer tok123')
    expect(r.headers['content-type']).toBe('application/json')
  }
  await expect(page.getByText('Active movies')).toBeVisible()
  await expect(page.getByText('12', { exact: true })).toBeVisible()
  await expect(page.getByText('₱96,400.00').first()).toBeVisible()
  await expect(page.locator('ol li')).toHaveCount(5)
  const tableEl = page.getByRole('table')
  await expect(tableEl.getByText('Now showing')).toHaveCount(2)
  await expect(tableEl.getByText('Coming soon')).toHaveCount(1)
  await expect(tableEl.getByText('Inactive')).toHaveCount(1)
  await expect(tableEl.getByText('New', { exact: true })).toHaveCount(1)
  await expect(tableEl.getByText('Oct 10, 2026')).toBeVisible()
  await expect(tableEl.getByText('8.2')).toBeVisible()
  // bar width relative to top revenue
  const w = await page.locator('ol li').nth(1).locator('span.bg-rd').evaluate((el) => (el as HTMLElement).style.width)
  expect(parseFloat(w)).toBeCloseTo((81200 / 96400) * 100, 1)
  await page.screenshot({ path: `e2e-output/screens/${testInfo.project.name}/admin-movies.png`, fullPage: true })

  const search = page.getByRole('textbox', { name: 'Search movies' })
  await search.fill('QUIET')
  await expect(tableEl.getByRole('row')).toHaveCount(2) // header + 1
  await search.fill('zzz')
  await expect(page.getByText('No movies found.')).toBeVisible()
})

test('movies: failure and empty states', async ({ page }) => {
  await mock(page, {
    '/movie/leaderboard': (r) => json(r, 500, {}),
    '/movie/showActiveCount': (r) => r.abort(),
    '/movie/showMovieTable': (r) => json(r, 200, []),
  })
  await page.goto('/admin/movies')
  await expect(page.getByText("Can't load the leaderboard")).toBeVisible()
  await expect(page.getByText('N/A')).toBeVisible()
  await expect(page.getByText('No movies found.')).toBeVisible()
})

test('movies: table failure shows Failed to load with retry', async ({ page }) => {
  let fail = true
  await mock(page, { '/movie/showMovieTable': (r) => (fail ? json(r, 500, {}) : json(r, 200, table)) })
  await page.goto('/admin/movies')
  await expect(page.getByText("Can't load movies")).toBeVisible()
  fail = false
  await page.getByRole('button', { name: 'Try again' }).last().click()
  await expect(page.getByRole('table').getByText('Low Tide')).toBeVisible()
})

test('add movie: modal states, request, close paths', async ({ page }, testInfo) => {
  const seen = await mock(page)
  await page.goto('/admin/movies')
  await expect(page.getByRole('table').getByText('Low Tide')).toBeVisible()
  const dialog = page.getByRole('dialog', { name: 'Add movie' })
  const open = () => page.getByRole('button', { name: 'Add movie' }).click()

  await open()
  await expect(dialog.getByRole('textbox', { name: 'Title' })).toBeFocused()
  await expect(dialog.getByText('Search for a movie to get started.')).toBeVisible()
  await page.screenshot({ path: `e2e-output/screens/${testInfo.project.name}/admin-add-movie-empty.png` })

  // empty query does nothing
  await dialog.getByRole('textbox', { name: 'Title' }).press('Enter')
  expect(count(seen, '/movie/tmdb/search')).toBe(0)

  await dialog.getByRole('textbox', { name: 'Title' }).fill('  night & day ')
  await dialog.getByRole('textbox', { name: 'Title' }).press('Enter')
  await expect(dialog.getByText('Night Orchard')).toBeVisible()
  const s = seen.reqs.find((r) => r.path === '/movie/tmdb/search')!
  expect(s.method).toBe('GET')
  expect(s.search).toBe('?name=night%20%26%20day')
  expect(s.headers['authorization']).toBe('Bearer tok123')
  expect(s.headers['content-type']).toBe('application/json')
  await expect(dialog.getByText('2026')).toBeVisible()
  await expect(dialog.getByText('8.2')).toBeVisible()
  await page.screenshot({ path: `e2e-output/screens/${testInfo.project.name}/admin-add-movie.png` })

  // Esc, X, overlay all close; reopening resets
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await open()
  await expect(dialog.getByText('Search for a movie to get started.')).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).click()
  await expect(dialog).toHaveCount(0)
  await open()
  await page.mouse.click(5, 5)
  await expect(dialog).toHaveCount(0)
})

test('add movie: no results and search failure', async ({ page }) => {
  let mode: 'empty' | 'fail' = 'empty'
  await mock(page, { '/movie/tmdb/search': (r) => (mode === 'empty' ? json(r, 200, []) : json(r, 500, {})) })
  await page.goto('/admin/movies')
  await page.getByRole('button', { name: 'Add movie' }).click()
  const box = page.getByRole('textbox', { name: 'Title' })
  await box.fill('x')
  await box.press('Enter')
  await expect(page.getByText('No results found.')).toBeVisible()
  mode = 'fail'
  await box.press('Enter')
  await expect(page.getByText('Search failed. Please try again.')).toBeVisible()
})

test('add movie: success posts { id }, toasts text, reloads three calls', async ({ page }, testInfo) => {
  const seen = await mock(page)
  await page.goto('/admin/movies')
  await expect(page.getByRole('table').getByText('Low Tide')).toBeVisible()
  await page.getByRole('button', { name: 'Add movie' }).click()
  const box = page.getByRole('textbox', { name: 'Title' })
  await box.fill('night')
  await box.press('Enter')
  const before = ['/movie/leaderboard', '/movie/showActiveCount', '/movie/showMovieTable'].map((p) => count(seen, p))
  await page.getByRole('button', { name: /Night Harbor/ }).last().click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText('Movie added successfully')).toBeVisible()
  await page.screenshot({ path: `e2e-output/screens/${testInfo.project.name}/admin-movies-toast.png` })
  const add = seen.reqs.find((r) => r.path === '/movie/add')!
  expect(add.method).toBe('POST')
  expect(JSON.parse(add.body!)).toEqual({ id: 11 })
  expect(add.headers['authorization']).toBe('Bearer tok123')
  expect(add.headers['content-type']).toBe('application/json')
  await expect
    .poll(() => ['/movie/leaderboard', '/movie/showActiveCount', '/movie/showMovieTable'].map((p) => count(seen, p)))
    .toEqual(before.map((n) => n + 1))
})

test('add movie: server error text and network error toast, no reload', async ({ page }) => {
  let net = false
  const seen = await mock(page, {
    '/movie/add': (r) => (net ? r.abort() : text(r, 409, 'Movie already exists')),
  })
  await page.goto('/admin/movies')
  await expect(page.getByRole('table').getByText('Low Tide')).toBeVisible()
  const before = count(seen, '/movie/showMovieTable')
  const pick = async () => {
    await page.getByRole('button', { name: 'Add movie' }).click()
    const box = page.getByRole('textbox', { name: 'Title' })
    await box.fill('night')
    await box.press('Enter')
    await page.getByRole('button', { name: /Night Orchard/ }).click()
  }
  await pick()
  await expect(page.getByRole('alert').getByText('Movie already exists')).toBeVisible()
  net = true
  await pick()
  await expect(page.getByRole('alert').getByText('Something went wrong. Please try again.')).toBeVisible()
  expect(count(seen, '/movie/showMovieTable')).toBe(before)
})
