// 보호자 대시보드 서비스 워커(2026-11-01). 하는 일은 둘이다.
// 1) 웹 푸시: 로봇 텔레메트리 에이전트(mobile-robot mr_care_telemetry push.py)가 FCM data 메시지로 보낸
//    외출 시작·SOS를 대시보드를 띄워 두지 않아도 알림으로 띄운다. 문구·링크는 data에 있다(title, body, url, tag, urgent).
// 2) 설치(바탕화면에 추가) 조건. 캐시는 하지 않는다(늘 최신 상태를 RTDB에서 받는다).
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})

self.addEventListener('push', (event) => {
  let msg = {}
  try { msg = event.data ? event.data.json() : {} } catch { msg = {} }
  const d = msg.data || {}
  const n = msg.notification || {}
  const urgent = d.urgent === '1'
  event.waitUntil(self.registration.showNotification(d.title || n.title || '돌봄 로봇', {
    body: d.body || n.body || '',
    tag: d.tag || n.tag || undefined,
    renotify: Boolean(d.tag || n.tag),
    requireInteraction: urgent,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    lang: 'ko',
    vibrate: urgent ? [400, 150, 400, 150, 800] : [200],
    data: { url: d.url || '/' },
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const w of windows) {
      if (new URL(w.url).origin !== self.location.origin) continue
      await w.focus()
      w.postMessage({ type: 'open', url })
      return
    }
    await self.clients.openWindow(url)
  })())
})
