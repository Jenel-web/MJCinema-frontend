import { test } from '@playwright/test'
import { loginAs } from './auth.ts'
import type { Role } from './env.ts'

// Screenshots of every route, logged in as the right role, at desktop (1440) and mobile (390).
// Output: web/e2e-output/screens/<project>/<name>.png (gitignored).
// Add a row here when a new route or screen state is built.
const screens: { name: string; path: string; as?: Role }[] = [
  { name: 'login', path: '/' },
  { name: 'register', path: '/register' },
  { name: 'dashboard', path: '/dashboard', as: 'user' },
  { name: 'bookseat', path: '/bookseat', as: 'user' },
  { name: 'tickets', path: '/tickets', as: 'user' },
  { name: 'admin', path: '/admin', as: 'admin' },
  { name: 'styleguide', path: '/styleguide' },
]

for (const screen of screens) {
  test(`screenshot: ${screen.name}`, async ({ page, request }, testInfo) => {
    if (screen.as) await loginAs(page, request, screen.as)
    await page.goto(screen.path)
    await page.waitForLoadState('networkidle')
    await page.screenshot({
      path: `e2e-output/screens/${testInfo.project.name}/${screen.name}.png`,
      fullPage: screen.name === 'styleguide',
    })
  })
}
