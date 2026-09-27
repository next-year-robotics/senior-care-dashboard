import type { RobotStatus } from '../lib/contract'
import { useRobotDiagnostics } from '../lib/rtdb'
import { baseStateLabel, diagnosticErrors, queueLabel, topicFreshness, topicRows } from '../lib/diagnostics'
import { formatAge, isOnline } from '../lib/status'
import { ErrorBanner } from './ErrorBanner'

/** Mounted only for a dev role while its tab is selected. No robot writes. */
export function DiagnosticsPanel({ robotId, status, now }: { robotId: string; status: RobotStatus | null; now: number }) {
  const diag = useRobotDiagnostics(robotId)
  const topics = topicRows(diag.data?.topics)
  const errors = diagnosticErrors(diag.data?.recent_errors)
  const updated = topicFreshness(diag.data?.updated_at_ms, now)
  return <section aria-label="개발자 진단" className="space-y-5 rounded-2xl bg-warm-white p-5 shadow-sm">
    <h2 className="text-lg font-semibold">개발자 진단</h2>
    <ErrorBanner errors={[diag.error]} />
    <p className="text-sm text-slate">{diag.loading ? '진단 정보를 불러오고 있어요.' : diag.data ? `진단 ${updated.label} · ${updated.age}` : '아직 진단 정보를 받지 못했어요.'}</p>
    <div>
      <h3 className="font-semibold">전송 및 구동부 요약</h3>
      {!isOnline(status, now) && <p className="mt-2 text-sm text-slate">마지막으로 받은 상태입니다. 갱신 {formatAge(status?.updated_at_ms, now)}</p>}
      <dl className={`mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 ${isOnline(status, now) ? '' : 'opacity-60'}`}>
        <Summary label="전송 대기" value={queueLabel(status?.agent?.queue_len)} />
        <Summary label="에이전트 버전" value={status?.agent?.version || '확인 불가'} />
        <Summary label="구동부 연결" value={baseStateLabel(status?.base?.agent_state)} />
        <Summary label="명령 감시" value={status?.base?.cmd_watchdog_ok === true ? '정상' : status?.base?.cmd_watchdog_ok === false ? '확인이 필요해요' : '확인 불가'} />
        <Summary label="구동부 수신" value={topicFreshness(status?.base?.last_seen_ms, now).age} />
      </dl>
    </div>
    <div>
      <h3 className="font-semibold">토픽 신선도</h3>
      <p className="mt-1 text-sm text-slate">15초 이상 새 수신이 없으면 오래됨으로 표시합니다.</p>
      {topics.length === 0 ? <p className="mt-3 text-sm text-slate">수신된 토픽 정보가 없어요.</p> :
        <div tabIndex={0} role="region" aria-label="토픽 표 가로 스크롤" className="mt-3 max-w-full overflow-x-auto rounded-lg border border-beige focus-visible:outline-2">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">토픽별 마지막 수신과 주기 및 신선도</caption>
            <thead className="bg-powder-blue"><tr><th scope="col" className="p-3">토픽</th><th scope="col" className="p-3">상태</th><th scope="col" className="p-3">마지막 수신</th><th scope="col" className="p-3">주기(Hz)</th></tr></thead>
            <tbody>{topics.map((topic) => {
              const fresh = topicFreshness(topic.last_seen_ms, now)
              return <tr key={topic.name} className="border-t border-beige"><th scope="row" className="break-all p-3 font-mono font-normal">{topic.name}</th>
                <td className={`p-3 ${fresh.stale ? 'text-brand-error' : 'text-brand-success'}`}>{fresh.label}</td><td className="p-3">{fresh.age}</td><td className="p-3">{topic.hz == null ? '확인 불가' : topic.hz.toFixed(1)}</td></tr>
            })}</tbody>
          </table>
        </div>}
    </div>
    <div>
      <h3 className="font-semibold">최근 진단 오류</h3>
      {errors.length === 0 ? <p className="mt-3 text-sm text-slate">보고된 오류가 없어요.</p> : <ol className="mt-3 divide-y divide-beige">{errors.map((error, index) =>
        <li key={`${error.ts_ms}-${index}`} className="break-words py-3 text-sm"><p className="font-medium">{error.error}</p><p className="mt-1 text-slate">{error.source} · {formatAge(error.ts_ms, now)}</p></li>)}</ol>}
    </div>
  </section>
}
function Summary({ label, value }: { label: string; value: string }) { return <div><dt className="text-slate">{label}</dt><dd className="break-words font-medium">{value}</dd></div> }
