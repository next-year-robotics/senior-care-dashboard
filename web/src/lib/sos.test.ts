import { expect, it } from 'vitest'
import { sosLocationText } from './sos'
import type { ActiveSos } from './contract'
it('keeps the SOS banner safe when coordinates are missing or invalid', () => {
  expect(sosLocationText(undefined)).toBe('위치를 아직 받지 못했어요')
  expect(sosLocationText({} as ActiveSos['location'])).toBe('위치를 아직 받지 못했어요')
  expect(sosLocationText({ lat: 91, lon: 0 } as ActiveSos['location'])).toBe('위치를 아직 받지 못했어요')
})
it('labels cache/fresh locations in Korean and preserves low-confidence warnings', () => {
  const location = { lat: 36.1234, lon: 128.5678, accuracy_m: null, captured_at_ms: 0, source: 'cache', low_confidence: true }
  expect(sosLocationText(location)).toContain('저장된 위치')
  expect(sosLocationText(location)).toContain('정확도 확인 불가')
  expect(sosLocationText(location)).toContain('신뢰도 낮음')
  expect(sosLocationText({ ...location, source: 'fresh' })).toContain('새로 확인한 위치')
})
