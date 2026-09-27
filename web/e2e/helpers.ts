import { expect, type Page } from '@playwright/test'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'

export const runNode = (...args: string[]) => promisify(execFile)('node', ['../tools/robot-sim/sim.mjs', ...args])
export function simulator() {
  return spawn('node', ['../tools/robot-sim/sim.mjs', '--fast'], { stdio: 'ignore' })
}
export async function emulatorWrite(path: string, value: unknown, method = 'PUT') {
  const response = await fetch(`http://127.0.0.1:9000/${path}.json?ns=senior-care-nyr-default-rtdb`, {
    method, headers: { authorization: 'Bearer owner', 'content-type': 'application/json' }, body: JSON.stringify(value),
  })
  expect(response.ok).toBe(true)
}
export async function login(page: Page) {
  await page.goto('/')
  await expect(page.getByText('개발 모드: Firebase 에뮬레이터에 연결됨')).toBeVisible()
  const next = page.waitForEvent('popup')
  await page.getByRole('button', { name: 'Google로 로그인' }).click()
  const popup = await next
  await popup.waitForLoadState('networkidle')
  await popup.getByText('Add new account').click()
  await popup.locator('#email-input').fill(`care-test-${Date.now()}@example.test`)
  await popup.locator('#display-name-input').fill('돌봄 시험 계정')
  await popup.getByRole('button', { name: 'Sign in with Google.com', exact: true }).click()
  await expect(page.getByRole('heading', { name: '접근 권한이 없어요' })).toBeVisible()
  return (await page.locator('main > code').innerText()).trim()
}
export async function grant(page: Page, uid: string, role: 'guardian' | 'dev' = 'guardian') {
  await runNode('--grant', uid, '--role', role)
  await page.reload()
  await expect(page.getByRole('region', { name: '로봇 상태' })).toBeVisible()
}
export async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: innerWidth }))
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport)
}
