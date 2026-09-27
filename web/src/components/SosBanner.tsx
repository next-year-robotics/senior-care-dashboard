import type { SosRow } from '../lib/rtdb'
import { formatAge } from '../lib/status'
import { sosLocationText } from '../lib/sos'

const REASON_KO: Record<string, string> = {
  tracking_lost: '로봇이 어르신을 놓쳤어요', stuck: '로봇이 움직일 수 없어요', low_battery: '배터리가 부족해요', manual: '수동 SOS', unknown: 'SOS',
}

/** P1: 배너와 위치 텍스트. P2(TASKS D-2): 지도 핀. */
export function SosBanner({ sos, now }: { sos: SosRow[] | null; now: number }) {
  if (!sos || sos.length === 0) return null
  return (
    <div role="alert" className="space-y-3">
      {sos.map((s) => (
        <section key={s.id} className={`rounded-2xl p-5 ${s.severity === 'critical' ? 'bg-brand-error text-white' : 'bg-amber-200 text-deep-ocean'}`}>
          <h2 className="text-xl font-bold">SOS · {REASON_KO[s.reason] ?? REASON_KO.unknown}</h2>
          <p className="mt-1 text-sm opacity-90">{formatAge(s.started_at_ms, now)} 시작 · 어르신 폰 {s.app_received ? '응답함' : '응답 대기'}</p>
          <p className="mt-2 text-sm">
            {sosLocationText(s.location)}
          </p>
        </section>
      ))}
    </div>
  )
}
