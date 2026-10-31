import { expect, test, type Page, type Route } from '@playwright/test'
import { API_URL, getCredentials } from './env.ts'

const LOGIN_URL = `${API_URL}/user/login`
const CORS = { 'access-control-allow-origin': '*' }

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) })

async function fill(page: Page, username = 'mj.cortas', password = 'secret-pass') {
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Password', { exact: true }).fill(password)
}

const shot = (page: Page, project: string, name: string) =>
  page.screenshot({ path: `e2e-output/login/${project}/${name}.png` })

test.describe('login (mocked API)', () => {
  test('renders the screen', async ({ page }, info) => {
    await page.goto('/')
    await expect(page.getByLabel('Username')).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/register')
    await expect(page.getByText('Remember me')).toBeVisible()
    await expect(page.getByText('Forgot password?')).toBeVisible()
    await shot(page, info.project.name, 'default')
  })

  test('sends exactly POST /user/login { username, password } with JSON content-type and no auth', async ({ page }) => {
    let seen: { method: string; body: unknown; headers: Record<string, string> } | null = null
    await page.route(LOGIN_URL, async (route) => {
      const req = route.request()
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...CORS, 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
      seen = { method: req.method(), body: req.postDataJSON(), headers: req.headers() }
      return json(route, 400, { message: 'Bad credentials' })
    })
    await page.goto('/')
    await fill(page)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    expect(seen).not.toBeNull()
    expect(seen!.method).toBe('POST')
    expect(seen!.body).toEqual({ username: 'mj.cortas', password: 'secret-pass' })
    expect(seen!.headers['content-type']).toContain('application/json')
    expect(seen!.headers['authorization']).toBeUndefined()
  })

  test('wrong credentials: banner, shake, auto-hide after 3s, nothing saved', async ({ page }, info) => {
    await page.route(LOGIN_URL, (route) =>
      route.request().method() === 'OPTIONS'
        ? route.fulfill({ status: 204, headers: { ...CORS, 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
        : json(route, 400, { message: 'Bad credentials' }),
    )
    await page.goto('/')
    await fill(page)
    await page.getByRole('button', { name: 'Log in' }).click()
    const banner = page.getByRole('alert')
    await expect(banner).toHaveText('Invalid Username or Password.')
    await expect(page.locator('.animate-shake')).toHaveCount(1)
    await expect(page.getByLabel('Password', { exact: true })).toBeFocused()
    await shot(page, info.project.name, 'error-invalid')
    await expect(page.locator('.animate-shake')).toHaveCount(0, { timeout: 2000 }) // shake is 400ms
    await expect(banner).toBeHidden({ timeout: 5000 }) // auto-hides at ~3s
    expect(await page.evaluate(() => localStorage.getItem('token'))).toBeNull()
    expect(page.url()).toMatch(/\/$/)
  })

  test('any non-OK response (e.g. 500) still reads "Invalid Username or Password." (legacy quirk)', async ({ page }) => {
    await page.route(LOGIN_URL, (route) =>
      route.request().method() === 'OPTIONS'
        ? route.fulfill({ status: 204, headers: { ...CORS, 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
        : json(route, 500, { message: 'boom' }),
    )
    await page.goto('/')
    await fill(page)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByRole('alert')).toHaveText('Invalid Username or Password.')
  })

  test('server unreachable: "Server is offline. Try again later."', async ({ page }, info) => {
    await page.route(LOGIN_URL, (route) => route.abort('failed'))
    await page.goto('/')
    await fill(page)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByRole('alert')).toHaveText('Server is offline. Try again later.')
    await shot(page, info.project.name, 'error-offline')
  })

  for (const [role, target] of [
    ['USER', '/dashboard'],
    ['ADMIN', '/admin'],
  ] as const) {
    test(`success as ${role}: saves userId/username/token, toast, goes to ${target}`, async ({ page }) => {
      await page.route(LOGIN_URL, (route) =>
        route.request().method() === 'OPTIONS'
          ? route.fulfill({ status: 204, headers: { ...CORS, 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
          : json(route, 200, { userId: 7, username: 'mj.cortas', jwtToken: 'jwt-abc', role }),
      )
      await page.goto('/')
      await fill(page)
      await page.getByRole('button', { name: 'Log in' }).click()
      await expect(page).toHaveURL(new RegExp(`${target}$`))
      const stored = await page.evaluate(() => ({
        token: localStorage.getItem('token'),
        userId: localStorage.getItem('userId'),
        username: localStorage.getItem('username'),
      }))
      expect(stored).toEqual({ token: 'jwt-abc', userId: '7', username: 'mj.cortas' })
      await expect(page.getByText('Login successful!')).toBeVisible() // green popup survives the redirect
    })
  }

  test('loading state: button busy, double submit blocked, slow-server hint', async ({ page }, info) => {
    let calls = 0
    await page.route(LOGIN_URL, async (route) => {
      if (route.request().method() === 'OPTIONS')
        return route.fulfill({ status: 204, headers: { ...CORS, 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
      calls += 1
      await new Promise((r) => setTimeout(r, 5000))
      return json(route, 400, { message: 'Bad credentials' })
    })
    await page.goto('/')
    await fill(page)
    const button = page.getByRole('button', { name: 'Log in' })
    await button.click()
    await expect(button).toBeDisabled()
    await expect(button).toHaveAttribute('aria-busy', 'true')
    await page.getByLabel('Password', { exact: true }).press('Enter') // second submit while loading
    await expect(page.getByText(/Waking up the server/)).toBeVisible({ timeout: 6000 })
    await shot(page, info.project.name, 'loading-slow')
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8000 })
    expect(calls).toBe(1)
    await expect(page.getByText(/Waking up the server/)).toBeHidden()
    await expect(button).toBeEnabled()
  })

  test('Enter key submits the form', async ({ page }) => {
    await page.route(LOGIN_URL, (route) =>
      route.request().method() === 'OPTIONS'
        ? route.fulfill({ status: 204, headers: { ...CORS, 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } })
        : json(route, 400, { message: 'Bad credentials' }),
    )
    await page.goto('/')
    await fill(page)
    await page.getByLabel('Password', { exact: true }).press('Enter')
    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('inert legacy controls: Remember me and Forgot password do nothing', async ({ page }) => {
    const requests: string[] = []
    page.on('request', (r) => { if (r.url().startsWith(API_URL)) requests.push(r.url()) })
    await page.goto('/')
    const remember = page.getByLabel('Remember me')
    const before = await remember.isChecked()
    await page.getByText('Remember me').click()
    expect(await remember.isChecked()).toBe(!before)
    await page.getByText('Forgot password?').click()
    expect(new URL(page.url()).pathname).toBe('/')
    expect(new URL(page.url()).hash).toBe('')
    expect(requests).toEqual([])
    expect(await page.evaluate(() => localStorage.length)).toBe(0)
  })

  test('hero art is decorative: no movie titles and no API call on load', async ({ page }) => {
    const calls: string[] = []
    page.on('request', (r) => { if (r.url().startsWith(API_URL)) calls.push(r.url()) })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(calls).toEqual([])
    for (const title of ['Night Harbor', 'Velvet Hour', 'Ember Road']) {
      await expect(page.getByText(title)).toHaveCount(0)
    }
  })

  test('Create an account goes to /register', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Create an account' }).click()
    await expect(page).toHaveURL(/\/register$/)
  })

  test('show/hide password toggle', async ({ page }) => {
    await page.goto('/')
    const input = page.getByLabel('Password', { exact: true })
    await expect(input).toHaveAttribute('type', 'password')
    await page.getByRole('button', { name: 'Show password' }).click()
    await expect(input).toHaveAttribute('type', 'text')
    await page.getByRole('button', { name: 'Hide password' }).click()
    await expect(input).toHaveAttribute('type', 'password')
  })

  test('layout: no horizontal overflow; mobile hides the desktop "Sign in" heading', async ({ page }, info) => {
    await page.goto('/')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBe(0)
    const signIn = page.getByRole('heading', { name: 'Sign in' })
    if (info.project.name === 'mobile') await expect(signIn).toBeHidden()
    else await expect(signIn).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Your seat')
  })
})

test.describe('login (real backend)', () => {
  test('wrong credentials from the allowed origin: readable error, not a CORS failure', async ({ page }, info) => {
    await page.goto('/')
    await fill(page, `no-such-user-${Date.now()}`, 'definitely-wrong-1')
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page.getByRole('alert')).toHaveText('Invalid Username or Password.', { timeout: 120_000 })
    await shot(page, info.project.name, 'real-invalid')
  })

  for (const role of ['user', 'admin'] as const) {
    test(`valid ${role} account logs in and lands on the right page`, async ({ page }) => {
      const creds = getCredentials(role)
      test.skip(!creds, `No ${role} credentials in web/.env.local`)
      await page.goto('/')
      await fill(page, creds!.username, creds!.password)
      await page.getByRole('button', { name: 'Log in' }).click()
      await expect(page).toHaveURL(role === 'user' ? /\/dashboard$/ : /\/admin$/, { timeout: 120_000 })
      expect(await page.evaluate(() => localStorage.getItem('token'))).toBeTruthy()
    })
  }
})
