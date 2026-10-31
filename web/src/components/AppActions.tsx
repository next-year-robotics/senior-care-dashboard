import { useEffect, useState } from 'react'
import { useInstall } from '../lib/install'
import { enablePush, pushState, type PushState } from '../lib/push'

const PUSH_TEXT: Record<PushState, string> = {
  checking: '알림 확인 중',
  unsupported: '이 브라우저는 알림을 받을 수 없어요',
  'ios-install': '아이패드·아이폰은 먼저 홈 화면에 추가해야 알림을 받을 수 있어요',
  off: '',
  denied: '알림이 차단되어 있어요. 브라우저 사이트 설정에서 알림을 허용해 주세요',
  on: '외출 시작·SOS 알림을 받고 있어요',
  error: '알림을 켜지 못했어요. 잠시 뒤 다시 눌러 주세요',
}

/** 바탕화면에 추가(PWA 설치)와 알림 받기. 둘 다 이 기기에만 적용된다. */
export function AppActions({ uid }: { uid: string }) {
  const { mode, install } = useInstall()
  const [push, setPush] = useState<PushState>('checking')
  const [busy, setBusy] = useState(false)
  const [iosHelp, setIosHelp] = useState(false)
  useEffect(() => {
    let alive = true
    // 이미 허용한 기기는 열 때마다 토큰을 다시 저장한다(토큰은 바뀔 수 있다)
    void enablePush(uid, false).catch(() => pushState()).then((s) => { if (alive) setPush(s) })
    return () => { alive = false }
  }, [uid])
  const turnOn = async () => {
    setBusy(true)
    try { setPush(await enablePush(uid, true)) } catch (error) {
      console.warn('push enable failed:', error instanceof Error ? error.message : error)
      setPush('error')
    } finally { setBusy(false) }
  }
  return <section aria-label="이 기기 설정" className="rounded-2xl bg-warm-white p-4 shadow-sm">
    <div className="flex flex-wrap items-center gap-3">
      {mode !== 'installed' && <button onClick={() => mode === 'prompt' ? void install() : setIosHelp((v) => !v)}
        className="min-h-12 rounded-xl bg-deep-ocean px-4 py-2 font-medium text-warm-white">
        📲 바탕화면에 추가
      </button>}
      {(push === 'off' || push === 'error') && <button onClick={() => void turnOn()} disabled={busy}
        className="min-h-12 rounded-xl bg-brand-error px-4 py-2 font-medium text-white disabled:opacity-60">
        🔔 {busy ? '알림 켜는 중…' : '알림 받기'}
      </button>}
      {push === 'on' && <span className="rounded-full bg-brand-success/15 px-3 py-1 text-sm font-medium text-brand-success">🔔 알림 켜짐</span>}
      {mode === 'installed' && <span className="rounded-full bg-powder-blue px-3 py-1 text-sm font-medium">📲 앱으로 실행 중</span>}
    </div>
    {PUSH_TEXT[push] && push !== 'on' && <p className="mt-2 text-sm text-slate" role="status">{PUSH_TEXT[push]}</p>}
    {push === 'on' && <p className="mt-2 text-sm text-slate">{PUSH_TEXT.on}. 이 화면을 닫아 두어도 알림이 와요.</p>}
    {iosHelp && mode !== 'prompt' && <p className="mt-2 rounded-lg bg-powder-blue p-3 text-sm">
      {mode === 'ios'
        ? '사파리 아래(아이패드는 위) 공유 버튼 → "홈 화면에 추가"를 누르세요. 추가한 아이콘으로 열어야 알림을 받을 수 있어요.'
        : '브라우저 메뉴(⋮) → "앱 설치" 또는 "홈 화면에 추가"를 누르세요.'}
    </p>}
  </section>
}
