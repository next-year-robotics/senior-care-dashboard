import type { DiagnosticError, RobotDiagnostics, TopicFreshness } from './contract'
import { formatAge, ONLINE_WINDOW_MS } from './status'

export interface TopicRow extends TopicFreshness { name: string }
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
/** Accept both documentation-shaped names and RTDB-safe nested topic paths. */
export function topicRows(topics: RobotDiagnostics['topics']): TopicRow[] {
  const rows: TopicRow[] = []
  function walk(node: unknown, path: string[], depth: number) {
    if (!record(node) || depth > 16) return
    if ('last_seen_ms' in node || 'hz' in node) {
      rows.push({ name: '/' + path.join('/').replace(/^\/+/, ''), last_seen_ms: finite(node.last_seen_ms) ? node.last_seen_ms : null, hz: finite(node.hz) && node.hz >= 0 ? node.hz : null })
      return
    }
    for (const [name, value] of Object.entries(node)) walk(value, [...path, name], depth + 1)
  }
  walk(topics, [], 0)
  return rows.sort((a, b) => a.name.localeCompare(b.name))
}
export function topicFreshness(lastSeen: number | null | undefined, now: number) {
  if (!finite(lastSeen) || lastSeen <= 0) return { label: '미수신', stale: true, age: '수신 기록 없음' }
  if (lastSeen > now + 60_000) return { label: '시각 확인 필요', stale: true, age: '로봇 시계를 확인해 주세요' }
  const stale = now - lastSeen >= ONLINE_WINDOW_MS
  return { label: stale ? '오래됨' : '최신', stale, age: formatAge(lastSeen, now) }
}
export function diagnosticErrors(raw: RobotDiagnostics['recent_errors']): DiagnosticError[] {
  if (!raw || typeof raw !== 'object') return []
  return Object.values(raw).filter((item): item is DiagnosticError => record(item))
    .map((item) => ({ ts_ms: finite(item.ts_ms) ? item.ts_ms : undefined, source: typeof item.source === 'string' ? item.source : '확인 불가', error: typeof item.error === 'string' ? item.error : '오류 내용을 확인하지 못했어요.' }))
    .sort((a, b) => (b.ts_ms ?? 0) - (a.ts_ms ?? 0))
}
export const baseStateLabel = (state?: string) => ({ waiting: '연결 대기', available: '연결 가능', connected: '연결됨', disconnected: '연결 끊김' }[state ?? ''] ?? '확인 불가')
export function queueLabel(value?: number): string { return finite(value) && Number.isInteger(value) && value >= 0 ? `${value}건` : '확인 불가' }
