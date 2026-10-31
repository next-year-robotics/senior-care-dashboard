import type { SosRow } from '../lib/rtdb'
import { formatAge } from '../lib/status'
import { sosLocation, sosLocationText } from '../lib/sos'
import { SosMap } from './SosMap'

const REASON_KO: Record<string, string> = {
  tracking_lost: '로봇이 어르신을 놓쳤어요', stuck: '로봇이 움직일 수 없어요', low_battery: '배터리가 부족해요',
  manual: '어르신이 도움을 요청했어요', unknown: 'SOS',
}

/** 열린 SOS마다 큰 카드: 이유·시각·폰 응답, 어르신 폰 위치 지도, 지도 앱 바로가기. 알림을 눌러 들어오면(?sos=id) 이 카드로 간다. */
export function SosBanner({ sos, now, focusId }: { sos: SosRow[] | null; now: number; focusId?: string | null }) {
  if (!sos || sos.length === 0) return null
  return (
    <div role="alert" className="space-y-3">
      {sos.map((s) => {
        const at = sosLocation(s.location)
        return (
          <section key={s.id} id={`sos-${s.id}`} className={`rounded-2xl p-5 ${s.severity === 'critical' ? 'bg-brand-error text-white' : 'bg-amber-200 text-deep-ocean'} ${focusId === s.id ? 'ring-4 ring-deep-ocean' : ''}`}>
            <h2 className="text-2xl font-bold">SOS · {REASON_KO[s.reason] ?? REASON_KO.unknown}</h2>
            <p className="mt-1 opacity-90">{formatAge(s.started_at_ms, now)} 시작 · 어르신 폰 {s.app_received ? '응답함' : '응답 대기'}</p>
            {at ? <div className="mt-3 space-y-2">
              <div className="rounded-xl bg-white p-1"><SosMap lat={at.lat} lon={at.lon} accuracy={at.accuracy} /></div>
              <div className="flex flex-wrap gap-2">
                <a href={`https://map.kakao.com/link/map/${encodeURIComponent('어르신 위치')},${at.lat},${at.lon}`} target="_blank" rel="noreferrer"
                  className="inline-flex min-h-12 items-center rounded-xl bg-white px-4 font-medium text-deep-ocean">카카오맵에서 열기</a>
                <a href={`https://www.google.com/maps/search/?api=1&query=${at.lat},${at.lon}`} target="_blank" rel="noreferrer"
                  className="inline-flex min-h-12 items-center rounded-xl bg-white/80 px-4 font-medium text-deep-ocean">구글 지도</a>
              </div>
            </div> : null}
            <p className="mt-2 text-sm">{sosLocationText(s.location)}</p>
          </section>
        )
      })}
    </div>
  )
}
