export type ErrorKind = 'permission' | 'network' | 'cancelled' | 'unknown'
export const errorMessages: Record<ErrorKind, string> = {
  permission: '이 로봇을 볼 권한이 없어요. 관리자에게 접근 권한을 요청해 주세요.',
  network: '서버에 연결할 수 없어요. 인터넷 연결을 확인해 주세요. 연결되면 자동으로 다시 불러옵니다.',
  cancelled: '로그인이 취소되었어요. 다시 로그인해 주세요.',
  unknown: '정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
}
export function errorKind(error: unknown): ErrorKind {
  const code = typeof error === 'string' ? error : error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
  const value = code.toLowerCase()
  if (value.includes('permission') || value.includes('unauthorized') || value.includes('user-disabled')) return 'permission'
  if (value.includes('network') || value.includes('disconnected') || value.includes('unavailable')) return 'network'
  if (value.includes('popup-closed') || value.includes('cancelled-popup')) return 'cancelled'
  return 'unknown'
}
