import type { EventRow } from './rtdb'

export type SeverityFilter = 'all' | 'info' | 'warning' | 'critical'
export const severityLabels: Record<SeverityFilter, string> = { all: '전체', info: '안내', warning: '주의', critical: '긴급' }
export const severityLabel = (severity: string) => severityLabels[severity as SeverityFilter] ?? '분류 확인 중'
export type EventSymbol = 'connection' | 'trip' | 'stop' | 'sos' | 'check' | 'warning' | 'info'
const kinds: Record<string, { label: string; symbol: EventSymbol }> = {
  'agent.online': { label: '로봇 연결', symbol: 'connection' },
  'agent.offline': { label: '로봇 연결 종료', symbol: 'connection' },
  'link.connected': { label: '휴대폰 연결', symbol: 'connection' },
  'link.disconnected': { label: '휴대폰 연결 끊김', symbol: 'warning' },
  'trip.start': { label: '주행 시작', symbol: 'trip' },
  'trip.arrived': { label: '목적지 도착', symbol: 'check' },
  'trip.cancelled': { label: '주행 정지', symbol: 'stop' },
  'trip.error': { label: '주행 문제', symbol: 'warning' },
  'sos.request': { label: 'SOS 요청', symbol: 'sos' },
  'sos.ack': { label: 'SOS 수신 확인', symbol: 'check' },
  'sos.clear': { label: 'SOS 종료', symbol: 'check' },
  error: { label: '오류', symbol: 'warning' },
}
export const eventKind = (kind: string) => kinds[kind] ?? { label: '새 이벤트', symbol: 'info' as const }
export function eventDate(timestamp: number): string {
  if (!Number.isFinite(timestamp)) return '날짜 확인 불가'
  return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(timestamp)
}
export function groupEvents(events: EventRow[], severity: SeverityFilter): { date: string; events: EventRow[] }[] {
  const groups = new Map<string, EventRow[]>()
  for (const event of [...events].sort((a, b) => b.ts_ms - a.ts_ms || b.id.localeCompare(a.id))) {
    if (severity !== 'all' && event.severity !== severity) continue
    const date = eventDate(event.ts_ms)
    if (!groups.has(date)) groups.set(date, [])
    groups.get(date)!.push(event)
  }
  return [...groups].map(([date, rows]) => ({ date, events: rows }))
}
