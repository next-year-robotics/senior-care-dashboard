import { useEffect, useState } from 'react'

/** 1초마다 갱신되는 현재 시각. 온라인 판정·경과 시간 표시용. */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}
