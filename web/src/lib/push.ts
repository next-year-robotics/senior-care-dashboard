import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { ref, serverTimestamp, set } from 'firebase/database'
import { db, firebaseApp, usingEmulators } from './firebase'

/**
 * 보호자 웹 푸시(2026-11-01). 이 기기의 FCM 토큰을 `/users/{uid}/push/{key}`에 둔다(본인만 쓰기, 기존 규칙 그대로).
 * 로봇의 텔레메트리 에이전트가 `/access/{robot}`의 보호자마다 이 토큰으로 외출 시작·SOS를 보낸다.
 * 알림을 띄우는 것은 서비스 워커(public/sw.js)다. 대시보드를 닫아 두어도 뜬다.
 */
export type PushState = 'checking' | 'unsupported' | 'ios-install' | 'off' | 'denied' | 'on' | 'error'

export const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

export async function pushState(): Promise<PushState> {
  if (usingEmulators) return 'unsupported'
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return isIos() && !isStandalone() ? 'ios-install' : 'unsupported'
  if (!(await isSupported().catch(() => false))) return isIos() && !isStandalone() ? 'ios-install' : 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.permission === 'granted' ? 'on' : 'off'
}

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return Promise.resolve(null)
  return navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
    console.warn('service worker registration failed:', error instanceof Error ? error.name : error)
    return null
  })
}

async function tokenKey(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(digest).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('')
}

/** 권한을 묻고(필요하면) 토큰을 저장한다. 버튼을 누를 때와, 이미 허용된 기기가 다시 열 때(토큰 갱신) 부른다. */
export async function enablePush(uid: string, ask: boolean): Promise<PushState> {
  const before = await pushState()
  if (before === 'unsupported' || before === 'ios-install' || before === 'denied') return before
  if (Notification.permission !== 'granted') {
    if (!ask) return 'off'
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'
  }
  const registration = await registerServiceWorker()
  if (!registration) return 'error'
  await navigator.serviceWorker.ready
  const token = await getToken(getMessaging(firebaseApp), { serviceWorkerRegistration: registration })
  if (!token) return 'error'
  await set(ref(db, `users/${uid}/push/${await tokenKey(token)}`), {
    token,
    platform: isIos() ? 'ios' : /Android/.test(navigator.userAgent) ? 'android' : 'desktop',
    standalone: isStandalone(),
    updated_at_ms: serverTimestamp(),
  })
  return 'on'
}
