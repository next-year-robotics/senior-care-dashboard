import type { RobotStatus } from '../lib/contract'
import { bridgeLabel, formatAge, isOnline, missionLabel, trackingLabel } from '../lib/status'

export function StatusCard({ status, now }: { status: RobotStatus | null; now: number }) {
  const online = isOnline(status, now)
  return (
    <section className="rounded-2xl bg-warm-white p-5 shadow-sm" aria-label="로봇 상태">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">로봇 상태</h2>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${online ? 'bg-brand-success/15 text-brand-success' : 'bg-beige text-slate'}`}>
          {online ? '온라인' : '오프라인'}
        </span>
      </div>
      {status ? (
        <div className="mt-4">
        {!online && <p className="mb-3 text-sm text-slate" role="status">마지막 갱신 {formatAge(status.updated_at_ms, now)} · 마지막으로 받은 상태입니다.</p>}
        <dl data-stale={!online} className={`grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2 ${online ? '' : 'opacity-60'}`}>
          <Row k="이동" v={missionLabel(status.mission_state)} />
          <Row k="추적" v={trackingLabel(status.tracking_state)} />
          <Row k="어르신 폰" v={status.phone_link?.connected ? '연결됨' : '연결 안 됨'} />
          <Row k="배터리" v={status.battery_percent == null ? '확인 불가' : `${status.battery_percent}%`} />
          <Row k="브리지" v={bridgeLabel(status.bridge_state)} />
          <Row k="갱신" v={formatAge(status.updated_at_ms, now)} />
          {status.last_error && <div className="sm:col-span-2 rounded-lg bg-brand-error/10 p-3 text-brand-error">{status.last_error}</div>}
        </dl>
        </div>
      ) : (
        <p className="mt-4 text-slate">아직 로봇에서 상태를 받지 못했어요.</p>
      )}
    </section>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-slate">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  )
}
