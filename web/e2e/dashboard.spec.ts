import { expect, test, type Page, type Route } from '@playwright/test'
import { API_URL } from './env.ts'
import { posterPng } from './png.ts'

const CORS = { 'access-control-allow-origin': '*' }
const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) })

const titles = ['Alpha Run', 'Bravo Tide', 'Charlie Peak', 'Delta Force', 'Echo Lake', 'Foxtrot Hill', 'Golf Rain', 'Hotel Dawn']
const hues = [2, 212, 48, 32, 275, 190, 160, 340]
const nowShowing = titles.map((title, i) => ({
  movieId: i + 1,
  title,
  poster: `/p${i + 1}.jpg`,
  rating: 8.2 - i * 0.1,
  overview: `Overview for ${title}. A short synopsis used for layout testing.`,
  status: 'NOW_SHOWING',
}))
const comingSoon = [
  { movieId: 21, title: 'Zulu Morning', poster: '/p21.jpg', rating: 7.04, overview: 'Soon one.', status: 'COMING_SOON', showDate: '2026-11-14' },
  { movieId: 22, title: 'Yankee Night', poster: '/p22.jpg', rating: 6.5, overview: 'Soon two.', status: 'COMING_SOON', showDate: null },
]
const allMovies = [...nowShowing, ...comingSoon]
const schedules = [
  { scheduleId: 101, showDate: '2026-10-31', startTime: '18:30:00', cinema: { location: 'SM City North' } },
  { scheduleId: 102, showDate: '2026-10-31', startTime: '13:30:00', cinema: { location: 'SM City North' } },
  { scheduleId: 103, showDate: '2026-10-31', startTime: '14:00', cinema: { location: 'Ayala Harbor Point' } },
  { scheduleId: 104, showDate: '2026-11-01', startTime: '16:15', cinema: { location: 'SM City North' } },
  { scheduleId: 105, showDate: '2026-11-02', startTime: '21:45', cinema: { location: 'Robinsons Galleria' } },
]

interface MockOptions {
  movieShow?: (route: Route) => unknown
  now?: (route: Route) => unknown
  soon?: (route: Route) => unknown
  movieSchedules?: (route: Route) => unknown
  /** Per-movie schedules (the hero pick asks for every Now Showing movie). Ignored if `movieSchedules` is set. */
  schedulesFor?: (movieId: number) => unknown[] | 'fail'
}

/** Local "YYYY-MM-DD" / "HH:mm" for a moment `offsetMs` from now, as the backend would send it. */
function at(offsetMs: number) {
  const d = new Date(Date.now() + offsetMs)
  const p = (n: number) => String(n).padStart(2, '0')
  return {
    showDate: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    startTime: `${p(d.getHours())}:${p(d.getMinutes())}`,
  }
}
const slot = (scheduleId: number, offsetMs: number) => ({ scheduleId, ...at(offsetMs), cinema: { location: 'SM City North' } })
const HOUR = 3_600_000
const DAY = 24 * HOUR

/** Mocks the dashboard endpoints (and TMDB posters). Calls are recorded in order in `log`. */
async function mockApi(page: Page, opts: MockOptions = {}) {
  const log: { path: string; headers: Record<string, string> }[] = []
  await page.route('**/image.tmdb.org/**', (route) => {
    const id = Number(/p(\d+)\.jpg/.exec(route.request().url())?.[1] ?? 1)
    return route.fulfill({ status: 200, contentType: 'image/png', body: posterPng(hues[(id - 1) % hues.length]) })
  })
  await page.route(`${API_URL}/**`, (route) => {
    const url = new URL(route.request().url())
    log.push({ path: url.pathname, headers: route.request().headers() })
    if (url.pathname === '/movie/show') return opts.movieShow ? opts.movieShow(route) : json(route, 200, allMovies)
    if (url.pathname === '/schedule/now-showing') return opts.now ? opts.now(route) : json(route, 200, nowShowing)
    if (url.pathname === '/schedule/coming-soon') return opts.soon ? opts.soon(route) : json(route, 200, comingSoon)
    if (url.pathname.startsWith('/schedule/movieSchedules/')) {
      if (opts.movieSchedules) return opts.movieSchedules(route)
      const result = opts.schedulesFor?.(Number(url.pathname.split('/').pop()))
      if (result === 'fail') return json(route, 500, { message: 'boom' })
      return json(route, 200, result ?? schedules)
    }
    return json(route, 404, { message: 'unmocked' })
  })
  return log
}

async function seedSession(page: Page, extra: Record<string, string> = {}) {
  await page.addInitScript((data) => {
    for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v)
  }, { token: 't', userId: '1', username: 'mj.cortas', ...extra })
}

const shot = (page: Page, project: string, name: string) =>
  page.screenshot({ path: `e2e-output/dashboard/${project}/${name}.png` })
const mainNav = (page: Page) => page.getByRole('navigation', { name: 'Main' })
const pill = (page: Page) => page.getByRole('tablist', { name: 'Movies' })
const cards = (page: Page) => page.locator('main button:has(img)')
const dialog = (page: Page, name: string | RegExp) => page.getByRole('dialog', { name })

test.beforeEach(async ({ page }) => {
  await seedSession(page)
})

test.describe('dashboard: navbar, Now Showing, Coming Soon', () => {
  test('navbar: logo, three links, profile with initial + username; no search button', async ({ page }, info) => {
    await mockApi(page)
    await page.goto('/dashboard')
    await expect(page.getByRole('img', { name: 'MJCinema' }).first()).toBeVisible()
    for (const name of ['Now Showing', 'Coming Soon', 'Cinema'])
      await expect(mainNav(page).getByRole('button', { name })).toBeVisible()
    await expect(mainNav(page).getByRole('button', { name: 'Now Showing' })).toHaveAttribute('aria-current', 'page')
    const profile = page.getByRole('button', { name: /Account menu, mj\.cortas/ })
    await expect(profile).toBeVisible()
    await expect(profile).toContainText(info.project.name === 'mobile' ? '' : 'mj.cortas')
    await expect(profile.locator('span[aria-hidden="true"]').first()).toHaveText('M')
    await expect(page.getByRole('button', { name: /search/i })).toHaveCount(0)
  })

  test('load order: GET /movie/show then GET /schedule/now-showing, both without headers', async ({ page }) => {
    const log = await mockApi(page)
    await page.goto('/dashboard')
    await expect(cards(page).first()).toBeVisible()
    const paths = log.map((l) => l.path)
    expect(paths.indexOf('/movie/show')).toBeGreaterThanOrEqual(0)
    expect(paths.indexOf('/schedule/now-showing')).toBeGreaterThan(paths.indexOf('/movie/show'))
    for (const l of log) {
      expect(l.headers['authorization']).toBeUndefined()
      expect(l.headers['content-type']).toBeUndefined()
    }
  })

  test('Now Showing: cards (TMDB poster, title, rating x.x), hero = first movie, no genre', async ({ page }, info) => {
    await mockApi(page)
    await page.goto('/dashboard')
    await expect(cards(page)).toHaveCount(nowShowing.length)
    await expect(cards(page).first().locator('img')).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w500/p1.jpg')
    await expect(cards(page).first()).toContainText('Alpha Run')
    await expect(cards(page).first()).toContainText('8.2')
    await expect(cards(page).nth(2)).toContainText('8.0')
    const hero = page.getByRole('region', { name: 'Featured movie' })
    await expect(hero).toContainText('Alpha Run')
    await expect(hero).toContainText('8.2')
    await expect(hero).toContainText('Now showing')
    for (const omitted of ['Thriller', '2h 04m', 'Eight cinemas', 'Watch trailer'])
      await expect(page.getByText(omitted)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'All genres' })).toHaveCount(0)
    await page.waitForLoadState('networkidle')
    await shot(page, info.project.name, 'now-showing')
  })

  for (const via of ['navbar link', 'pill toggle'] as const) {
    test(`Coming Soon via ${via}: GET /schedule/coming-soon, date tag, "Coming soon" badge, no hero`, async ({ page }, info) => {
      const log = await mockApi(page)
      await page.goto('/dashboard')
      await expect(cards(page).first()).toBeVisible()
      if (via === 'navbar link') await mainNav(page).getByRole('button', { name: 'Coming Soon' }).click()
      else await pill(page).getByRole('tab', { name: 'Coming soon' }).click()
      await expect(cards(page)).toHaveCount(comingSoon.length)
      expect(log.map((l) => l.path)).toContain('/schedule/coming-soon')
      await expect(cards(page).first()).toContainText('Zulu Morning')
      await expect(cards(page).first()).toContainText('Nov 14')
      await expect(cards(page).first()).toContainText('Coming soon')
      await expect(cards(page).nth(1)).toContainText('TBA')
      await expect(cards(page).first()).toContainText('7.0') // 7.04 -> 7.0
      await expect(page.getByRole('region', { name: 'Featured movie' })).toHaveCount(0)
      await expect(mainNav(page).getByRole('button', { name: 'Coming Soon' })).toHaveAttribute('aria-current', 'page')
      await page.waitForLoadState('networkidle')
      await shot(page, info.project.name, `coming-soon-${via === 'navbar link' ? 'nav' : 'pill'}`)
      // the Coming Soon design has no pill toggle: back to Now Showing goes through the navbar
      await expect(pill(page)).toHaveCount(0)
      await mainNav(page).getByRole('button', { name: 'Now Showing' }).click()
      await expect(cards(page)).toHaveCount(nowShowing.length)
      await expect(pill(page)).toBeVisible()
    })
  }

  test('Cinema link opens the Cinema view (covered in detail by cinema.spec.ts)', async ({ page }) => {
    await mockApi(page)
    await page.goto('/dashboard')
    await mainNav(page).getByRole('button', { name: 'Cinema' }).click()
    await expect(page.getByRole('heading', { name: 'Cinemas', exact: true })).toBeVisible()
    await expect(mainNav(page).getByRole('button', { name: 'Cinema' })).toHaveAttribute('aria-current', 'page')
    await expect(cards(page)).toHaveCount(0)
  })
})

test.describe('dashboard: grid states', () => {
  test('loading skeleton while the list is pending', async ({ page }, info) => {
    await mockApi(page, {
      now: async (route) => {
        await new Promise((r) => setTimeout(r, 2500))
        return json(route, 200, nowShowing)
      },
    })
    await page.goto('/dashboard')
    await expect(page.getByLabel('Loading movies')).toBeVisible()
    await shot(page, info.project.name, 'state-loading')
    await expect(cards(page).first()).toBeVisible({ timeout: 6000 })
    await expect(page.getByLabel('Loading movies')).toHaveCount(0)
  })

  test('empty: design copy, no "Clear filter" button, hero hidden', async ({ page }, info) => {
    await mockApi(page, { now: (route) => json(route, 200, []) })
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Nothing showing yet' })).toBeVisible()
    await expect(page.getByText('No movies match this filter. Clear it to see everything.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Clear filter' })).toHaveCount(0)
    await expect(page.getByRole('region', { name: 'Featured movie' })).toHaveCount(0)
    await shot(page, info.project.name, 'state-empty')
  })

  test('error (HTTP): "Failed to load movies." and Try again refetches the list', async ({ page }, info) => {
    let failing = true
    let nowCalls = 0
    await mockApi(page, {
      now: (route) => {
        nowCalls += 1
        return failing ? json(route, 500, { message: 'boom' }) : json(route, 200, nowShowing)
      },
    })
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: "Can't load movies" })).toBeVisible()
    await expect(page.getByText('Failed to load movies.')).toBeVisible()
    await shot(page, info.project.name, 'state-error')
    const callsBefore = nowCalls
    failing = false
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(cards(page)).toHaveCount(nowShowing.length)
    expect(nowCalls).toBe(callsBefore + 1) // exactly one refetch
  })

  test('error (offline): design copy', async ({ page }) => {
    await mockApi(page, { now: (route) => route.abort('failed') })
    await page.goto('/dashboard')
    await expect(page.getByText('The server is offline. Check your connection and try again.')).toBeVisible()
  })

  test('error (not a list): "Unexpected data format from server."', async ({ page }) => {
    await mockApi(page, { now: (route) => json(route, 200, { oops: true }) })
    await page.goto('/dashboard')
    await expect(page.getByText('Unexpected data format from server.')).toBeVisible()
  })

  test('GET /movie/show failure: Try again refetches /movie/show and then the list', async ({ page }) => {
    let failing = true
    let showCalls = 0
    const log = await mockApi(page, {
      movieShow: (route) => {
        showCalls += 1
        return failing ? json(route, 500, { message: 'boom' }) : json(route, 200, allMovies)
      },
    })
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: "Can't load movies" })).toBeVisible()
    expect(log.map((l) => l.path)).not.toContain('/schedule/now-showing') // legacy: no list without the store
    const callsBefore = showCalls
    failing = false
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(cards(page)).toHaveCount(nowShowing.length)
    expect(showCalls).toBe(callsBefore + 1)
    expect(log.map((l) => l.path)).toContain('/schedule/now-showing') // list loads after the store
  })

  test('Coming Soon empty state', async ({ page }) => {
    await mockApi(page, { soon: (route) => json(route, 200, []) })
    await page.goto('/dashboard')
    await pill(page).getByRole('tab', { name: 'Coming soon' }).click()
    await expect(page.getByRole('heading', { name: 'Nothing coming soon yet' })).toBeVisible()
  })
})

test.describe('dashboard: movie modal', () => {
  test('card click saves movieId, opens modal with poster/title/rating/overview, locks scroll; X and Esc close; scrim does not', async ({ page }) => {
    const log = await mockApi(page)
    await page.goto('/dashboard')
    await cards(page).nth(2).click() // Charlie Peak, id 3
    const modal = dialog(page, 'Charlie Peak')
    await expect(modal).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('movieId'))).toBe('3')
    await expect(modal.getByRole('heading', { name: 'Charlie Peak' })).toBeVisible()
    await expect(modal.locator('img')).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w500/p3.jpg')
    await expect(modal).toContainText('8.0')
    await expect(modal).toContainText('/ 10')
    await expect(modal).toContainText('Overview for Charlie Peak.')
    for (const omitted of ['Watch trailer', 'Thriller', 'Rated PG', 'A. Reyes'])
      await expect(modal.getByText(omitted)).toHaveCount(0)
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')
    expect(log.map((l) => l.path)).toContain('/schedule/movieSchedules/3')

    await page.mouse.click(4, 4) // scrim
    await expect(modal).toBeVisible()
    await modal.getByRole('button', { name: 'Close' }).click()
    await expect(modal).toHaveCount(0)
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('')

    await cards(page).nth(0).click()
    await expect(dialog(page, 'Alpha Run')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog(page, 'Alpha Run')).toHaveCount(0)
  })

  test('showtime picker: groups by date, then cinema, then time; one chip = one scheduleId', async ({ page }, info) => {
    await mockApi(page)
    await page.goto('/dashboard')
    await cards(page).first().click()
    const modal = dialog(page, 'Alpha Run')
    await expect(modal.getByRole('heading', { name: 'Pick a showtime' })).toBeVisible()
    const dates = modal.getByRole('group', { name: 'Date' }).getByRole('button')
    await expect(dates).toHaveText(['Sat 31 Oct', 'Sun 1 Nov', 'Mon 2 Nov'])
    await expect(dates.first()).toHaveAttribute('aria-pressed', 'true')
    // 31 Oct: two cinemas (alphabetical), times sorted ascending
    const north = modal.getByRole('group', { name: 'SM City North' })
    await expect(north.getByRole('button')).toHaveText(['1:30 PM', '6:30 PM'])
    await expect(modal.getByRole('group', { name: 'Ayala Harbor Point' }).getByRole('button')).toHaveText(['2:00 PM'])
    await expect(modal.getByRole('group', { name: 'Robinsons Galleria' })).toHaveCount(0)
    await dates.nth(2).click()
    await expect(modal.getByRole('group', { name: 'Robinsons Galleria' }).getByRole('button')).toHaveText(['9:45 PM'])
    await expect(modal.getByRole('group', { name: 'SM City North' })).toHaveCount(0)
    await shot(page, info.project.name, 'modal-picker')
  })

  test('Select seats: soft-disabled until a time is chosen; message in-page; then saves selectedScheduleId and goes to /bookseat', async ({ page }, info) => {
    await mockApi(page)
    await page.goto('/dashboard')
    await cards(page).first().click()
    const modal = dialog(page, 'Alpha Run')
    const select = modal.getByRole('button', { name: 'Select seats' })
    await expect(select).toHaveAttribute('aria-disabled', 'true')
    await expect(modal.getByText('Pick a showtime to continue.')).toBeVisible()
    await select.click({ force: true }) // aria-disabled is not a real disabled: it must stay clickable
    await expect(modal.getByRole('alert')).toHaveText('Please select a time slot first!')
    expect(await page.evaluate(() => localStorage.getItem('selectedScheduleId'))).toBeNull()
    await shot(page, info.project.name, 'modal-no-slot-message')

    await modal.getByRole('group', { name: 'SM City North' }).getByRole('button', { name: '6:30 PM' }).click()
    await expect(modal.getByRole('alert')).toHaveCount(0)
    await expect(select).not.toHaveAttribute('aria-disabled', 'true')
    await expect(modal).toContainText('Selected: SM City North, Sat 31 Oct, 6:30 PM')
    await shot(page, info.project.name, 'modal-slot-selected')

    // changing the date clears the choice
    await modal.getByRole('group', { name: 'Date' }).getByRole('button', { name: 'Sun 1 Nov' }).click()
    await expect(select).toHaveAttribute('aria-disabled', 'true')
    await modal.getByRole('group', { name: 'SM City North' }).getByRole('button', { name: '4:15 PM' }).click()
    await select.click()
    await expect(page).toHaveURL(/\/bookseat$/)
    expect(await page.evaluate(() => localStorage.getItem('selectedScheduleId'))).toBe('104')
  })

  test('hero: "Book seats" opens the modal at the showtime section; "View details" opens it from the top', async ({ page }, info) => {
    await mockApi(page)
    await page.goto('/dashboard')
    const hero = page.getByRole('region', { name: 'Featured movie' })
    await hero.getByRole('button', { name: 'Book seats' }).click()
    const modal = dialog(page, 'Alpha Run')
    await expect(modal).toBeVisible()
    await expect(modal.getByRole('heading', { name: 'Pick a showtime' })).toBeInViewport()
    expect(await modal.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
    await shot(page, info.project.name, 'modal-from-book-seats')
    await modal.getByRole('button', { name: 'Close' }).click()

    await hero.getByRole('button', { name: 'View details' }).first().click()
    await expect(dialog(page, 'Alpha Run')).toBeVisible()
    expect(await dialog(page, 'Alpha Run').evaluate((el) => el.scrollTop)).toBe(0)
  })

  test('Coming Soon modal: details only, no showtimes, no booking, no schedule request', async ({ page }, info) => {
    const log = await mockApi(page)
    await page.goto('/dashboard')
    await pill(page).getByRole('tab', { name: 'Coming soon' }).click()
    await expect(cards(page)).toHaveCount(comingSoon.length)
    await page.waitForLoadState('networkidle') // the Now Showing hero pick has finished by now
    const callsBefore = log.length
    await cards(page).first().click()
    const modal = dialog(page, 'Zulu Morning')
    await expect(modal).toBeVisible()
    await expect(modal).toContainText('Soon one.')
    await expect(modal.getByRole('heading', { name: 'Pick a showtime' })).toHaveCount(0)
    await expect(modal.getByRole('button', { name: 'Select seats' })).toHaveCount(0)
    await page.waitForTimeout(300)
    expect(log.length).toBe(callsBefore) // opening a Coming Soon movie makes no request at all
    await shot(page, info.project.name, 'modal-coming-soon')
  })

  test('picker states: loading, empty, error + retry', async ({ page }, info) => {
    let mode: 'slow-empty' | 'error' | 'ok' = 'slow-empty'
    let calls = 0
    await mockApi(page, {
      movieSchedules: async (route) => {
        // Only Alpha Run (id 1) is under test; the hero pick's calls for other movies are answered normally.
        if (!route.request().url().endsWith('/movieSchedules/1')) return json(route, 200, schedules)
        calls += 1
        if (mode === 'slow-empty') {
          await new Promise((r) => setTimeout(r, 1500))
          return json(route, 200, [])
        }
        if (mode === 'error') return json(route, 500, { message: 'boom' })
        return json(route, 200, schedules)
      },
    })
    await page.goto('/dashboard')
    await cards(page).first().click()
    const modal = dialog(page, 'Alpha Run')
    await expect(modal.getByLabel('Loading showtimes')).toBeVisible()
    await shot(page, info.project.name, 'picker-loading')
    await expect(modal.getByRole('heading', { name: 'No showtimes yet' })).toBeVisible()
    await shot(page, info.project.name, 'picker-empty')
    await modal.getByRole('button', { name: 'Close' }).click()

    mode = 'error'
    await cards(page).first().click()
    await expect(modal.getByRole('heading', { name: "Can't load showtimes" })).toBeVisible()
    await shot(page, info.project.name, 'picker-error')
    const callsBefore = calls
    mode = 'ok'
    await modal.getByRole('button', { name: 'Try again' }).click()
    await expect(modal.getByRole('group', { name: 'Date' })).toBeVisible()
    expect(calls).toBe(callsBefore + 1) // retry refetches exactly once
  })
})

test.describe('dashboard: featured hero = earliest upcoming schedule', () => {
  const hero = (page: Page) => page.getByRole('region', { name: 'Featured movie' })

  test('picks the movie with the earliest upcoming schedule; past schedules are ignored; asks once per movie without headers', async ({ page }, info) => {
    const log = await mockApi(page, {
      schedulesFor: (id) => {
        if (id === 3) return [slot(30, 6 * HOUR), slot(31, 3 * DAY)] // Charlie Peak: soonest upcoming (+6h)
        if (id === 5) return [slot(50, -4 * HOUR)] // Echo Lake: earlier, but already started -> ignored
        if (id === 7) return [slot(70, 12 * HOUR)] // Golf Rain: later than Charlie Peak
        return [slot(id * 10, 2 * DAY)]
      },
    })
    await page.goto('/dashboard')
    await expect(hero(page)).toContainText('Charlie Peak')
    await expect(hero(page)).toContainText('Featured')
    await page.waitForLoadState('networkidle')
    const asked = log.filter((l) => l.path.startsWith('/schedule/movieSchedules/'))
    expect(asked.map((l) => Number(l.path.split('/').pop())).sort((a, b) => a - b)).toEqual(nowShowing.map((m) => m.movieId))
    for (const l of asked) {
      expect(l.headers['authorization']).toBeUndefined()
      expect(l.headers['content-type']).toBeUndefined()
    }
    await shot(page, info.project.name, 'hero-earliest')
    // the grid still lists every movie in API order (only the hero is re-picked)
    await expect(cards(page).first()).toContainText('Alpha Run')
  })

  test('"Book seats" on the picked hero opens that movie', async ({ page }) => {
    await mockApi(page, { schedulesFor: (id) => (id === 4 ? [slot(40, HOUR)] : [slot(id * 10, 2 * DAY)]) })
    await page.goto('/dashboard')
    await expect(hero(page)).toContainText('Delta Force')
    await hero(page).getByRole('button', { name: 'Book seats' }).click()
    await expect(dialog(page, 'Delta Force')).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('movieId'))).toBe('4')
  })

  test('tie on the same start time goes to the earlier movie in the list', async ({ page }) => {
    const same = at(5 * HOUR)
    await mockApi(page, {
      schedulesFor: (id) => (id === 2 || id === 6 ? [{ scheduleId: id, ...same, cinema: { location: 'X' } }] : [slot(id * 10, 2 * DAY)]),
    })
    await page.goto('/dashboard')
    await expect(hero(page)).toContainText('Bravo Tide') // id 2 comes before id 6
  })

  test('no upcoming schedule anywhere: falls back to the first movie of the list', async ({ page }) => {
    await mockApi(page, { schedulesFor: (id) => [slot(id, -2 * DAY)] })
    await page.goto('/dashboard')
    await expect(hero(page)).toContainText('Alpha Run')
  })

  test('schedule calls failing: falls back to the first movie; grid and hero both still work', async ({ page }) => {
    await mockApi(page, { schedulesFor: () => 'fail' })
    await page.goto('/dashboard')
    await expect(hero(page)).toContainText('Alpha Run')
    await expect(cards(page)).toHaveCount(nowShowing.length)
  })

  test('hero shows a placeholder until the pick is ready, without blocking the grid', async ({ page }) => {
    await mockApi(page, {
      movieSchedules: async (route) => {
        await new Promise((r) => setTimeout(r, 1800))
        return json(route, 200, [slot(1, HOUR)])
      },
    })
    await page.goto('/dashboard')
    await expect(cards(page)).toHaveCount(nowShowing.length) // grid is not waiting for the hero
    await expect(hero(page)).toHaveCount(0)
    await expect(hero(page)).toContainText('Alpha Run', { timeout: 6000 })
  })
})

test.describe('dashboard: profile dropdown', () => {
  test('toggle, outside click and re-click close; Profile does nothing; My bookings -> /tickets', async ({ page }, info) => {
    await mockApi(page)
    await page.goto('/dashboard')
    const button = page.getByRole('button', { name: /Account menu/ })
    const menu = page.getByRole('menu', { name: 'Account' })
    await button.click()
    await expect(menu).toBeVisible()
    await shot(page, info.project.name, 'profile-open')
    await button.click()
    await expect(menu).toHaveCount(0)
    await button.click()
    await page.getByRole('heading', { name: 'Now Showing' }).click() // outside
    await expect(menu).toHaveCount(0)

    await button.click()
    await menu.getByRole('menuitem', { name: 'Profile' }).click()
    await expect(menu).toBeVisible() // no behaviour: stays as it is
    expect(new URL(page.url()).pathname).toBe('/dashboard')

    await menu.getByRole('menuitem', { name: 'My bookings' }).click()
    await expect(page).toHaveURL(/\/tickets$/)
  })

  test('Logout clears localStorage and goes to /', async ({ page }) => {
    await mockApi(page)
    await page.goto('/dashboard')
    await page.getByRole('button', { name: /Account menu/ }).click()
    await page.getByRole('menuitem', { name: 'Logout' }).click()
    await expect(page).toHaveURL(/\/$/)
    expect(await page.evaluate(() => localStorage.length)).toBe(0)
  })
})

test.describe('dashboard: layout', () => {
  test('no horizontal overflow; mobile modal is a full-screen sheet closed by Back or X', async ({ page }, info) => {
    await mockApi(page)
    await page.goto('/dashboard')
    await expect(cards(page).first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
    await cards(page).first().click()
    const modal = dialog(page, 'Alpha Run')
    await expect(modal).toBeVisible()
    await page.waitForTimeout(250)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
    if (info.project.name === 'mobile') {
      const box = await modal.boundingBox()
      expect(Math.round(box!.width)).toBe(390)
      expect(Math.round(box!.height)).toBe(844)
      await shot(page, info.project.name, 'modal-sheet')
      await modal.getByRole('button', { name: 'Back' }).click()
      await expect(modal).toHaveCount(0)
      await cards(page).first().click()
      await dialog(page, 'Alpha Run').getByRole('button', { name: 'Close' }).click()
      await expect(dialog(page, 'Alpha Run')).toHaveCount(0)
    } else {
      await expect(modal.getByRole('button', { name: 'Back' })).toBeHidden()
      const box = await modal.boundingBox()
      expect(box!.width).toBeLessThanOrEqual(1040)
      await shot(page, info.project.name, 'modal-desktop')
    }
  })
})

test.describe('dashboard (real backend, read-only)', () => {
  test('loads real movies without CORS or console errors; picker loads for the first movie', async ({ page }, info) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    const responses: Record<string, number> = {}
    page.on('response', (r) => {
      const p = new URL(r.url()).pathname
      if (r.url().startsWith(API_URL)) responses[p] = r.status()
    })
    await page.goto('/dashboard')
    // either real cards or the empty state, never the error state
    await expect(cards(page).first().or(page.getByRole('heading', { name: 'Nothing showing yet' }))).toBeVisible({ timeout: 120_000 })
    await expect(page.getByRole('heading', { name: "Can't load movies" })).toHaveCount(0)
    expect(responses['/movie/show']).toBe(200)
    expect(responses['/schedule/now-showing']).toBe(200)
    await page.waitForLoadState('networkidle')
    await shot(page, info.project.name, 'real-now-showing')
    if ((await cards(page).count()) > 0) {
      await cards(page).first().click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Pick a showtime' })).toBeVisible()
      await expect(page.getByRole('group', { name: 'Date' }).or(page.getByRole('heading', { name: 'No showtimes yet' }))).toBeVisible({ timeout: 60_000 })
      await shot(page, info.project.name, 'real-modal')
    }
    expect(errors.filter((e) => /CORS|Access-Control|TypeError|Failed to fetch/i.test(e))).toEqual([])
  })
})
