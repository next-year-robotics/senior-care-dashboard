import { useEffect, useRef, useState } from 'react'
import type { User } from 'firebase/auth'
import { AppActions } from '../components/AppActions'
import { DiagnosticsPanel } from '../components/DiagnosticsPanel'
import { EventList } from '../components/EventList'
import { ErrorBanner } from '../components/ErrorBanner'
import { SosBanner } from '../components/SosBanner'
import { StatusCard } from '../components/StatusCard'
import { signOutUser } from '../lib/auth'
import { errorKind, type ErrorKind } from '../lib/errors'
import type { AccessRole } from '../lib/contract'
import { DEFAULT_ROBOT_ID, usingEmulators } from '../lib/firebase'
import { useAccessRole, useActiveSos, useDatabaseConnection, useRobotEvents, useRobotMeta, useRobotStatus } from '../lib/rtdb'
import { useNow } from '../lib/useNow'

export function RobotPage({ user }: { user: User }) {
  const role = useAccessRole(DEFAULT_ROBOT_ID, user.uid)
  const [logoutError, setLogoutError] = useState<ErrorKind>()
  const logout = () => { void signOutUser().catch((error: unknown) => setLogoutError(errorKind(error))) }
  if (role.loading) return <main className="mx-auto max-w-3xl p-6">접근 권한을 확인하고 있어요.</main>
  if (role.data !== 'guardian' && role.data !== 'dev') {
    return <main className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">접근 권한이 없어요</h1>
      <ErrorBanner errors={[role.error]} kind={logoutError ?? 'permission'} />
      <p className="mt-3 text-slate">관리자에게 아래 사용자 ID를 알려 주세요.</p>
      <code className="mt-2 block break-all rounded-lg bg-warm-white p-3 text-sm">{user.uid}</code>
      {usingEmulators && <p className="mt-3 text-xs text-slate">개발 모드: <code>node tools/robot-sim/sim.mjs --grant {user.uid}</code> 로 권한을 넣을 수 있어요.</p>}
      <button onClick={logout} className="mt-6 min-h-12 text-deep-ocean underline">로그아웃</button>
    </main>
  }
  // Mount subscriptions only after access is confirmed. Revocation/logout removes all held data.
  return <AuthorizedRobotPage key={`${user.uid}:${role.data}`} user={user} role={role.data} logout={logout} logoutError={logoutError} />
}

function AuthorizedRobotPage({ user, role, logout, logoutError }: { user: User; role: AccessRole; logout: () => void; logoutError?: ErrorKind }) {
  const [tab, setTab] = useState<'overview' | 'diagnostics'>('overview')
  const robotId = DEFAULT_ROBOT_ID
  const now = useNow()
  const [mountedAt] = useState(Date.now)
  const meta = useRobotMeta(robotId)
  const status = useRobotStatus(robotId)
  const events = useRobotEvents(robotId)
  const sos = useActiveSos(robotId)
  const connection = useDatabaseConnection()
  const disconnected = connection.data === false && now - mountedAt >= 5000
  // 알림을 눌러 들어오면 ?sos=<id>(새 창) 또는 서비스 워커 메시지(이미 열린 창)로 그 SOS 카드에 간다
  const [focusSos, setFocusSos] = useState<string | null>(() => new URLSearchParams(window.location.search).get('sos'))
  useEffect(() => {
    const sw = navigator.serviceWorker
    if (!sw) return
    const onMessage = (event: MessageEvent<{ type?: string; url?: string }>) => {
      if (event.data?.type !== 'open' || !event.data.url) return
      setFocusSos(new URL(event.data.url).searchParams.get('sos'))
    }
    sw.addEventListener('message', onMessage)
    return () => sw.removeEventListener('message', onMessage)
  }, [])
  const seenSos = useRef<Set<string> | null>(null)
  useEffect(() => {
    if (!sos.data) return
    const ids = sos.data.map((s) => s.id)
    // 화면을 띄워 둔 채 새 SOS가 오면 맨 위(SOS 카드)로 올린다
    if (seenSos.current && ids.some((id) => !seenSos.current!.has(id))) window.scrollTo({ top: 0, behavior: 'smooth' })
    seenSos.current = new Set(ids)
  }, [sos.data])
  useEffect(() => {
    if (focusSos && sos.data?.some((s) => s.id === focusSos)) document.getElementById(`sos-${focusSos}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [focusSos, sos.data])
  return <main className="mx-auto max-w-3xl px-4 py-6">
    <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row">
      <div className="w-full min-w-0 flex-1 break-words">
        <h1 className="text-2xl font-bold">{meta.data?.display_name ?? robotId}</h1>
        <p className="text-sm text-slate">{robotId} · {user.email}{role === 'dev' ? ' · 개발자' : ''}</p>
      </div>
      <button onClick={logout} className="min-h-12 shrink-0 text-sm text-deep-ocean underline">로그아웃</button>
    </header>
    <ErrorBanner errors={[meta.error, status.error, events.error, sos.error]} kind={logoutError ?? (disconnected ? 'network' : undefined)} />
    <div className="space-y-4">
      <SosBanner sos={sos.data} now={now} focusId={focusSos} />
      {role === 'dev' && <div role="tablist" aria-label="화면 선택" className="flex flex-wrap gap-2" onKeyDown={(event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const next = event.key === 'Home' ? 'overview' : event.key === 'End' ? 'diagnostics' : tab === 'overview' ? 'diagnostics' : 'overview'
        setTab(next)
        document.getElementById(`tab-${next}`)?.focus()
      }}>
        {(['overview', 'diagnostics'] as const).map((key) => <button key={key} role="tab" id={`tab-${key}`} aria-selected={tab === key} aria-controls={`panel-${key}`} tabIndex={tab === key ? 0 : -1} onClick={() => setTab(key)}
          className={`min-h-12 rounded-xl px-4 py-2 ${tab === key ? 'bg-deep-ocean text-warm-white' : 'bg-warm-white'}`}>{key === 'overview' ? '돌봄 현황' : '진단'}</button>)}
      </div>}
      {tab === 'overview' ? <div role={role === 'dev' ? 'tabpanel' : undefined} id="panel-overview" aria-labelledby={role === 'dev' ? 'tab-overview' : undefined} className="space-y-4">
        <StatusCard status={status.data} now={now} />
        <AppActions uid={user.uid} />
        <EventList events={events.data} now={now} />
      </div> : role === 'dev' && <div role="tabpanel" id="panel-diagnostics" aria-labelledby="tab-diagnostics"><DiagnosticsPanel robotId={robotId} status={status.data} now={now} /></div>}
    </div>
  </main>
}
