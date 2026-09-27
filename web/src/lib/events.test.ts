import { describe, expect, it } from 'vitest'
import { eventKind, groupEvents, severityLabel } from './events'
import type { EventRow } from './rtdb'
const events: EventRow[] = [
  { id: 'a', ts_ms: Date.parse('2026-09-26T14:59:00Z'), severity: 'info', kind: 'trip.start', message: '출발' },
  { id: 'b', ts_ms: Date.parse('2026-09-26T15:01:00Z'), severity: 'critical', kind: 'sos.request', message: 'SOS' },
  { id: 'c', ts_ms: Date.parse('2026-09-26T15:02:00Z'), severity: 'warning', kind: 'error', message: '주의' },
]
describe('event presentation', () => {
  it('groups newest-first by Korea date across midnight without mutating input', () => {
    const groups = groupEvents(events, 'all')
    expect(groups.map((g) => g.date)).toEqual(['2026년 9월 27일', '2026년 9월 26일'])
    expect(groups[0].events.map((e) => e.id)).toEqual(['c', 'b'])
    expect(events[0].id).toBe('a')
  })
  it('filters severity before grouping', () => expect(groupEvents(events, 'critical').flatMap((g) => g.events).map((e) => e.id)).toEqual(['b']))
  it('handles empty lists and future kinds/severities', () => {
    expect(groupEvents([], 'warning')).toEqual([])
    expect(eventKind('future')).toEqual({ label: '새 이벤트', symbol: 'info' })
    expect(severityLabel('future')).toBe('분류 확인 중')
  })
})
