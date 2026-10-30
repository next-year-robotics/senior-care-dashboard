import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { RobotStatus } from './contract'
import { formatAge, isOnline, missionLabel, trackingLabel } from './status'

const fixture = <T,>(name: string): T =>
  JSON.parse(readFileSync(fileURLToPath(new URL(`../../../contracts/care-telemetry/v1/fixtures/${name}.json`, import.meta.url)), 'utf8')) as T

describe('isOnline', () => {
  const st = fixture<RobotStatus>('status-active')
  it('fresh status is online', () => expect(isOnline(st, st.updated_at_ms + 5_000)).toBe(true))
  it('stale status is offline', () => expect(isOnline(st, st.updated_at_ms + 15_000)).toBe(false))
  it('missing status is offline', () => expect(isOnline(null, 0)).toBe(false))
})

describe('labels', () => {
  it('maps known enums to Korean', () => {
    expect(missionLabel('active')).toBe('이동 중')
    expect(trackingLabel('lost')).toBe('어르신을 놓쳤어요')
  })
  it('never throws on unknown enums', () => {
    expect(missionLabel('something_new')).toBe(missionLabel('unknown'))
    expect(trackingLabel(undefined)).toBe(trackingLabel('unknown'))
  })
  it('shows the idle tracking state from the robot contract', () => {
    const status = fixture<RobotStatus>('status-idle-tracking-idle')
    expect(trackingLabel(status.tracking_state)).toBe('대기 중')
  })
})

describe('fixtures follow the contract shape', () => {
  it('status fixtures have required fields', () => {
    for (const n of ['status-active', 'status-idle-offline-phone']) {
      const s = fixture<RobotStatus>(n)
      expect(typeof s.updated_at_ms).toBe('number')
      expect(s.phone_link).toBeDefined()
    }
  })
  it('formatAge', () => expect(formatAge(0, 30_000)).toBe('30초 전'))
})


describe('missing and aged values', () => {
  it('never treats a missing or invalid timestamp as online', () => {
    expect(isOnline({ updated_at_ms: NaN }, Date.now())).toBe(false)
    expect(isOnline({ updated_at_ms: 0 }, 0)).toBe(false)
  })
  it('uses minute text for old values and a safe missing-time label', () => {
    expect(formatAge(0, 120_000)).toBe('2분 전')
    expect(formatAge(undefined, 120_000)).toBe('시각 확인 불가')
  })
})
