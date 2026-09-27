import { test, expect } from '@playwright/test'
import { emulatorWrite, expectNoHorizontalOverflow, grant, login, simulator } from './helpers'

test('D-12: dev diagnostic data, partial/offline states, and guardian revocation', async ({ page }) => {
  const uid = await login(page)
  await emulatorWrite('robots/mr-001/sos', null)
  const sim = simulator()
  try {
    await grant(page, uid, 'dev')
    await page.getByRole('tab', { name: '진단', exact: true }).click()
    const panel = page.getByRole('region', { name: '개발자 진단', exact: true })
    await expect(panel.getByRole('rowheader', { name: '/base/status', exact: true })).toBeVisible()
    sim.kill()
    await expect(panel.getByText('0건', { exact: true })).toBeVisible()
    await expect(panel.getByText('연결됨', { exact: true })).toBeVisible()
    await expect(panel.getByRole('row', { name: /\/marker_track/ })).toContainText('미수신')
    const now = Date.now()
    await emulatorWrite('robots/mr-001/diag', {
      updated_at_ms: now - 20_000,
      topics: { base: { status: { last_seen_ms: now - 20_000, hz: 0 } }, missing: { last_seen_ms: 0 }, partial: { hz: 1 } },
      recent_errors: { second: { ts_ms: now, source: 'telemetry', error: '시험용 전송 지연' }, first: { ts_ms: now - 1000, source: 'bridge', error: '시험용 연결 복원' } },
    })
    await emulatorWrite('robots/mr-001/status', { agent: { queue_len: 7 }, base: { agent_state: 'future', cmd_watchdog_ok: false } }, 'PATCH')
    await expect(panel.getByText('7건', { exact: true })).toBeVisible()
    await expect(panel.getByRole('row', { name: /\/base\/status/ })).toContainText('오래됨')
    await expect(panel.getByText('확인이 필요해요', { exact: true })).toBeVisible()
    await expect(panel.locator('ol li').first()).toContainText('시험용 전송 지연')
    await page.setViewportSize({ width: 360, height: 800 })
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    await expectNoHorizontalOverflow(page)
    const scroller = panel.getByRole('region', { name: '토픽 표 가로 스크롤' })
    await scroller.focus()
    expect(await scroller.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
    await page.screenshot({ path: '../docs/test-artifacts/diagnostics-mobile-200.png', fullPage: true })
    await page.getByRole('tab', { name: '진단', exact: true }).focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByRole('tab', { name: '돌봄 현황', exact: true })).toBeFocused()
    await expect(page.getByRole('region', { name: '로봇 상태' })).toBeVisible()
    await page.keyboard.press('ArrowRight')
    await expect(panel).toBeVisible()
    await emulatorWrite('robots/mr-001/diag', null)
    await expect(panel).toContainText('아직 진단 정보를 받지 못했어요.')
    await emulatorWrite(`access/mr-001/${uid}`, 'guardian')
    await expect(page.getByRole('tab', { name: '진단', exact: true })).toHaveCount(0)
    await expect(panel).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('region', { name: '로봇 상태' })).toBeVisible()
    await expect(page.getByRole('tab', { name: '진단', exact: true })).toHaveCount(0)
  } finally { sim.kill() }
})
