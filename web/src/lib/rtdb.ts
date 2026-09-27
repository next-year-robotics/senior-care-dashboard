import { limitToLast, onValue, query, ref, type DatabaseReference, type Query } from 'firebase/database'
import { useEffect, useState } from 'react'
import type { AccessRole, ActiveSos, RobotEvent, RobotMeta, RobotStatus, RobotDiagnostics } from './contract'
import { db } from './firebase'

interface Sub<T> { data: T | null; error: string | null; loading: boolean }
interface Held<T> { key: string; data: T | null; error: string | null }

/** onValue 구독을 React 상태로. target 식별은 문자열 key로 하며, key가 바뀌기 전까지는 이전 값을 보여 주지 않는다. */
function useValue<T>(target: DatabaseReference | Query | null, transform?: (raw: unknown) => T): Sub<T> {
  const key = target ? target.toString() : ''
  const [held, setHeld] = useState<Held<T>>({ key: '', data: null, error: null })
  useEffect(() => {
    if (!target) return
    return onValue(
      target,
      (snap) => {
        const raw: unknown = snap.val()
        setHeld({ key, data: raw == null ? null : (transform ? transform(raw) : (raw as T)), error: null })
      },
      (err) => { console.warn('RTDB subscription failed:', err.name); setHeld({ key, data: null, error: ('code' in err ? String(err.code) : err.message) }) },
    )
    // target/transform은 key로 대표된다(같은 경로면 같은 구독). 함수 참조가 바뀌어도 재구독하지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  if (!target) return { data: null, error: null, loading: false }
  const current = held.key === key
  return { data: current ? held.data : null, error: current ? held.error : null, loading: !current }
}

export const useRobotStatus = (robotId: string) => useValue<RobotStatus>(ref(db, `robots/${robotId}/status`))
export const useRobotMeta = (robotId: string) => useValue<RobotMeta>(ref(db, `robots/${robotId}/meta`))
export const useAccessRole = (robotId: string, uid: string | undefined) =>
  useValue<AccessRole>(uid ? ref(db, `access/${robotId}/${uid}`) : null)

export interface EventRow extends RobotEvent { id: string }
export const useRobotEvents = (robotId: string, limit = 200) =>
  useValue<EventRow[]>(query(ref(db, `robots/${robotId}/events`), limitToLast(limit)), (raw) =>
    Object.entries(raw as Record<string, RobotEvent>)
      .map(([id, e]) => ({ id, ...e }))
      .sort((a, b) => b.ts_ms - a.ts_ms),
  )

export interface SosRow extends ActiveSos { id: string }
export const useActiveSos = (robotId: string) =>
  useValue<SosRow[]>(ref(db, `robots/${robotId}/sos`), (raw) =>
    Object.entries(raw as Record<string, ActiveSos>).map(([id, s]) => ({ id, ...s })).sort((a, b) => b.started_at_ms - a.started_at_ms),
  )

export const useDatabaseConnection = () => useValue<boolean>(ref(db, '.info/connected'))

export const useRobotDiagnostics = (robotId: string) => useValue<RobotDiagnostics>(ref(db, `robots/${robotId}/diag`))
