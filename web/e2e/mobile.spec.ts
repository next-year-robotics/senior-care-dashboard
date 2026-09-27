import { test, expect } from '@playwright/test'
import { emulatorWrite, expectNoHorizontalOverflow, grant, login, simulator } from './helpers'

test('D-09: 360px, 200% font, no clipped core information', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.addInitScript(() => { addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = '200%' }) })
  const uid = await login(page)
  await expectNoHorizontalOverflow(page)
  await emulatorWrite('robots/mr-001/sos', null)
  await emulatorWrite('robots/mr-001/events', null)
  const sim = simulator()
  try {
    await grant(page, uid)
    await expect(page.getByText('온라인', { exact: true })).toBeVisible()
    sim.kill()
    await expectNoHorizontalOverflow(page)
    await page.getByRole('combobox', { name: '중요도' }).scrollIntoViewIfNeeded()
    await expect(page.getByRole('combobox', { name: '중요도' })).toBeVisible()
    await page.screenshot({ path: '../docs/test-artifacts/mobile-200.png', fullPage: true })
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.evaluate(() => { document.documentElement.style.fontSize = '100%' })
    await expectNoHorizontalOverflow(page)
    await page.screenshot({ path: '../docs/test-artifacts/desktop.png', fullPage: true })
  } finally { sim.kill() }
})
