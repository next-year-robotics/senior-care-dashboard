import type { ActiveSos } from './contract'

/** Partially received location data must never take down the SOS banner. */
export function sosLocationText(location: ActiveSos['location'] | undefined): string {
  if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lon) ||
    Math.abs(location.lat) > 90 || Math.abs(location.lon) > 180) return '위치를 아직 받지 못했어요'
  const source = location.source === 'cache' ? '저장된 위치' : location.source === 'fresh' ? '새로 확인한 위치' : '종류 확인 중'
  const accuracy = location.accuracy_m != null && Number.isFinite(location.accuracy_m) && location.accuracy_m >= 0 ? `±${location.accuracy_m} m` : '정확도 확인 불가'
  return `위치 ${location.lat.toFixed(5)}, ${location.lon.toFixed(5)} (${accuracy}, ${source}${location.low_confidence ? ', 신뢰도 낮음' : ''})`
}
