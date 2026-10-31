import { expect, test } from '@playwright/test'
import { API_URL } from './env.ts'

for (const [name, path] of [['Bookings', '/admin/bookings'], ['Users', '/admin/users']]) {
  test(`${name}: coming soon, no API calls`, async ({ page }, testInfo) => {
    const calls: string[] = []
    await page.route(`${API_URL}/**`, (r) => {
      calls.push(r.request().url())
      return r.abort()
    })
    await page.goto(path)
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Not available yet' })).toBeVisible()
    await expect(page.getByRole('table')).toHaveCount(0)
    await expect(page.getByRole('textbox')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /export/i })).toHaveCount(0)
    await page.screenshot({ path: `e2e-output/screens/${testInfo.project.name}/admin-${name.toLowerCase()}.png` })
    expect(calls).toEqual([])
  })
}
