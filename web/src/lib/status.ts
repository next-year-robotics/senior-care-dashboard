import type { RobotStatus } from './contract'

/** 온라인 판정은 웹이 한다(care-telemetry/1 README 3.1). */
export const ONLINE_WINDOW_MS = 15_000

export function isOnline(status: Pick<RobotStatus, 'updated_at_ms'> | null | undefined, nowMs: number): boolean {
  if (!status || !Number.isFinite(status.updated_at_ms) || status.updated_at_ms <= 0) return false
  return nowMs - status.updated_at_ms < ONLINE_WINDOW_MS
}

const MISSION_KO: Record<string, string> = {
  idle: '대기 중', starting: '출발 준비 중', active: '이동 중', arrived: '도착했어요',
  cancelling: '멈추는 중', cancelled: '멈췄어요', error: '문제가 생겼어요', unknown: '상태 확인 중',
}
const TRACKING_KO: Record<string, string> = {
  unavailable: '추적 기능 없음', searching: '어르신을 찾는 중', following: '어르신을 따라가는 중',
  lost: '어르신을 놓쳤어요', error: '추적 오류', unknown: '추적 상태 확인 중',
}
const BRIDGE_KO: Record<string, string> = { ready: '정상', degraded: '일부 기능 제한', error: '오류', unknown: '확인 중' }

/** 모르는 enum은 crash 없이 unknown 문구로. */
export const missionLabel = (s: string | undefined) => MISSION_KO[s ?? 'unknown'] ?? MISSION_KO.unknown
export const trackingLabel = (s: string | undefined) => TRACKING_KO[s ?? 'unknown'] ?? TRACKING_KO.unknown
export const bridgeLabel = (s: string | undefined) => BRIDGE_KO[s ?? 'unknown'] ?? BRIDGE_KO.unknown

export function formatAge(fromMs: number | null | undefined, nowMs: number): string {
  if (fromMs == null || !Number.isFinite(fromMs)) return '시각 확인 불가'
  const s = Math.max(0, Math.round((nowMs - fromMs) / 1000))
  if (s < 60) return `${s}초 전`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}분 전`
  const h = Math.round(m / 60)
  if (h < 48) return `${h}시간 전`
  return `${Math.round(h / 24)}일 전`
}
