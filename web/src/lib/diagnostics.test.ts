import { describe, expect, it } from 'vitest'
import { baseStateLabel, diagnosticErrors, queueLabel, topicFreshness, topicRows } from './diagnostics'

describe('diagnostics', () => {
  it('supports documented topic names and RTDB nested names identically', () => {
    const value = { last_seen_ms: 1000, hz: 9.8 }
    expect(topicRows({ '/base/status': value })).toEqual(topicRows({ base: { status: value } }))
    expect(topicRows({ '/base/status': value })[0].name).toBe('/base/status')
    expect(topicRows(undefined)).toEqual([])
  })
  it('distinguishes fresh, stale, never received and invalid timestamps', () => {
    expect(topicFreshness(1000, 15_999).label).toBe('최신')
    expect(topicFreshness(1000, 16_000).label).toBe('오래됨')
    expect(topicFreshness(0, 1000).label).toBe('미수신')
    expect(topicFreshness(NaN, 1000).label).toBe('미수신')
    expect(topicFreshness(100_000, 1000).label).toBe('시각 확인 필요')
  })
  it('handles missing, false and future base fields safely', () => {
    expect(queueLabel(0)).toBe('0건')
    expect(queueLabel(-1)).toBe('확인 불가')
    expect(queueLabel()).toBe('확인 불가')
    expect(baseStateLabel('future')).toBe('확인 불가')
  })
  it('supports RTDB error arrays/maps, sorts recent first and tolerates missing fields', () => {
    const errors = [{ ts_ms: 1, source: 'test', error: 'earlier' }, { ts_ms: 2, error: 'later' }]
    expect(diagnosticErrors(errors).map((e) => e.error)).toEqual(['later', 'earlier'])
    expect(diagnosticErrors({ a: errors[0], b: errors[1] })).toEqual(diagnosticErrors(errors))
    expect(diagnosticErrors(undefined)).toEqual([])
  })
})
