import { useState } from 'react'
import type { EventRow } from '../lib/rtdb'
import { eventKind, groupEvents, severityLabel, severityLabels, type EventSymbol, type SeverityFilter } from '../lib/events'
import { formatAge } from '../lib/status'

const SEV: Record<string, string> = { info: 'bg-powder-blue text-deep-ocean', warning: 'bg-amber-100 text-amber-950', critical: 'bg-brand-error text-white' }
const paths: Record<EventSymbol, string> = {
  connection: 'M8 8a4 4 0 0 1 8 0v3M6 11h12v4a6 6 0 0 1-12 0z',
  trip: 'm9 5 10 7-10 7z', stop: 'M6 6h12v12H6z',
  sos: 'M12 3 2 21h20zM12 9v5m0 3v1', warning: 'M12 3 2 21h20zM12 9v5m0 3v1',
  check: 'm5 12 5 5L20 7', info: 'M12 11v7m0-12v1M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0',
}
export function EventList({ events, now }: { events: EventRow[] | null; now: number }) {
  const [filter, setFilter] = useState<SeverityFilter>('all')
  const groups = groupEvents(events ?? [], filter)
  return (
    <section className="rounded-2xl bg-warm-white p-5 shadow-sm" aria-label="돌봄 이벤트">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">최근 이벤트</h2>
        <label className="flex flex-wrap items-center gap-2 text-sm">중요도
          <select value={filter} onChange={(e) => setFilter(e.target.value as SeverityFilter)} className="min-h-12 rounded-lg border border-beige bg-warm-white px-3">
            {Object.entries(severityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      {groups.length === 0 ? <p className="mt-4 text-slate">{events?.length ? '선택한 중요도의 이벤트가 없어요.' : '아직 이벤트가 없어요.'}</p> :
        groups.map((group) => <div key={group.date} className="mt-5">
          <h3 className="border-b border-beige pb-2 text-sm font-semibold text-slate">{group.date}</h3>
          <ol className="divide-y divide-beige/60">
            {group.events.map((event) => {
              const kind = eventKind(event.kind)
              return <li key={event.id} className="flex items-start gap-3 py-4">
                <span className={`mt-1 shrink-0 rounded-lg p-2 ${SEV[event.severity] ?? 'bg-beige'}`} aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind.symbol]} /></svg>
                </span>
                <div className="min-w-0 flex-1 break-words">
                  <p className="font-medium">{event.message || '새 이벤트가 도착했어요.'}</p>
                  <p className="mt-1 text-xs text-slate">{severityLabel(event.severity)} · {kind.label} · {formatAge(event.ts_ms, now)}</p>
                  <p className="text-xs text-slate">{Number.isFinite(event.ts_ms) ? new Date(event.ts_ms).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '시각 확인 불가'}</p>
                </div>
              </li>
            })}
          </ol>
        </div>)}
    </section>
  )
}
