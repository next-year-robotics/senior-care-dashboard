import { test, expect } from '@playwright/test'
import { emulatorWrite, grant, login, simulator } from './helpers'

test('D-01 through D-08: emulator authentication, simulator flow, errors and history', async ({ page, context }) => {
  const uid = await login(page)
  // The UI has no robot subscriptions before a valid role. Independently exercise the actual rules.
  const deniedStatus = await page.evaluate(async () => {
    const modulePath = '/src/lib/firebase.ts'
    const { auth } = await import(modulePath)
    const token = await auth.currentUser.getIdToken()
    return (await fetch(`http://127.0.0.1:9000/robots/mr-001.json?ns=senior-care-nyr-default-rtdb&auth=${token}`)).status
  })
  expect(deniedStatus).toBe(401)
  await expect(page.getByRole('alert')).toContainText('이 로봇을 볼 권한이 없어요')
  await emulatorWrite('robots/mr-001/events', null)
  await emulatorWrite('robots/mr-001/sos', null)
  const sim = simulator()
  try {
    await grant(page, uid)
    const status = page.getByRole('region', { name: '로봇 상태' })
    await expect(status.getByText('온라인', { exact: true })).toBeVisible()
    await expect(status.getByText('출발 준비 중', { exact: true })).toBeVisible({ timeout: 8000 })
    await expect(status.getByText('이동 중', { exact: true })).toBeVisible()
    const sos = page.getByRole('alert').filter({ hasText: 'SOS ·' })
    await expect(sos).toBeVisible({ timeout: 8000 })
    await expect(sos).toContainText('응답함')
    await expect(sos).toContainText('저장된 위치')
    await expect(sos).toHaveCount(0, { timeout: 8000 })
    await expect(status.getByText('멈추는 중', { exact: true })).toBeVisible({ timeout: 8000 })
    await expect(status.getByText('멈췄어요', { exact: true })).toBeVisible()
    const timeline = page.getByRole('region', { name: '돌봄 이벤트' })
    await expect(timeline.getByText('집에서 시장으로 출발했어요', { exact: true })).toBeVisible()
    await expect(timeline.getByText('어르신을 다시 찾았어요', { exact: true })).toBeVisible()
    await expect(timeline.getByText('주행을 멈췄어요', { exact: true })).toBeVisible()
    sim.kill()
    // This deliberate elapsed-time wait is the acceptance criterion, not a loading wait.
    await page.waitForTimeout(20_000)
    await expect(status.getByText('오프라인', { exact: true })).toBeVisible({ timeout: 21_000 })
    await expect(status.getByText('멈췄어요', { exact: true })).toBeVisible()
    await expect(status.locator('dl')).toHaveAttribute('data-stale', 'true')
    await expect(status).toContainText('마지막 갱신')
    await context.setOffline(true)
    await expect(page.getByRole('alert')).toContainText('서버에 연결할 수 없어요', { timeout: 10_000 })
    await context.setOffline(false)
    await expect(page.getByRole('alert')).toHaveCount(0, { timeout: 10_000 })
    const now = Date.now()
    await emulatorWrite('robots/mr-001/status', { mission_state: 'warp', updated_at_ms: now }, 'PATCH')
    await expect(status.getByText('상태 확인 중', { exact: true })).toBeVisible()
    const many = Object.fromEntries(Array.from({ length: 220 }, (_, i) => [`event${String(i).padStart(4, '0')}`, {
      ts_ms: now + i, kind: 'trip.start', severity: i % 2 ? 'warning' : 'info', message: `시험 이벤트 ${i}`,
    }]))
    await emulatorWrite('robots/mr-001/events', many)
    await expect(timeline.locator('li')).toHaveCount(200)
    await expect(timeline.locator('li').first()).toContainText('시험 이벤트 219')
    await expect(timeline.getByText('시험 이벤트 0', { exact: true })).toHaveCount(0)
    await page.getByRole('combobox', { name: '중요도' }).selectOption('warning')
    await expect(timeline.locator('li')).toHaveCount(100)
    await page.getByRole('combobox', { name: '중요도' }).selectOption('critical')
    await expect(timeline).toContainText('선택한 중요도의 이벤트가 없어요.')
    await emulatorWrite(`access/mr-001/${uid}`, null)
    await expect(page.getByRole('heading', { name: '접근 권한이 없어요' })).toBeVisible()
    await expect(page.getByRole('region', { name: '로봇 상태' })).toHaveCount(0)
  } finally { sim.kill(); await context.setOffline(false) }
})
