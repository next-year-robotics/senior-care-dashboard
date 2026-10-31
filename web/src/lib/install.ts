import { useEffect, useState } from 'react'
import { isIos, isStandalone } from './push'

/** 크롬·삼성 인터넷의 설치 이벤트. 페이지가 뜨자마자 오므로 main.tsx에서 먼저 받아 둔다. */
interface InstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
let deferred: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
export function captureInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred = event as InstallPromptEvent
    listeners.forEach((l) => l())
  })
  window.addEventListener('appinstalled', () => { deferred = null; listeners.forEach((l) => l()) })
}

export type InstallMode = 'installed' | 'prompt' | 'ios' | 'manual'

export function useInstall(): { mode: InstallMode; install: () => Promise<void> } {
  const [, bump] = useState(0)
  useEffect(() => {
    const l = () => bump((n) => n + 1)
    listeners.add(l)
    return () => { listeners.delete(l) }
  }, [])
  const mode: InstallMode = isStandalone() ? 'installed' : deferred ? 'prompt' : isIos() ? 'ios' : 'manual'
  const install = async () => {
    if (!deferred) return
    const event = deferred
    await event.prompt()
    await event.userChoice.catch(() => null)
    deferred = null
    bump((n) => n + 1)
  }
  return { mode, install }
}
