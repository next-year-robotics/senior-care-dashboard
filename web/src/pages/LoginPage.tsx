import { useState } from 'react'
import { ErrorBanner } from '../components/ErrorBanner'
import { errorKind, type ErrorKind } from '../lib/errors'
import { signInWithGoogle } from '../lib/auth'
import { usingEmulators } from '../lib/firebase'

export function LoginPage() {
  const [err, setErr] = useState<ErrorKind | undefined>(undefined)
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="text-3xl font-bold">돌봄 로봇 대시보드</h1>
      <p className="mt-2 text-slate">보호자 계정으로 로그인하면 로봇 상태와 돌봄 이벤트를 볼 수 있어요.</p>
      <button
        onClick={() => signInWithGoogle().catch((e: Error) => setErr(errorKind(e)))}
        className="mt-8 min-h-14 p-3 rounded-xl bg-deep-ocean text-lg font-semibold text-warm-white"
      >
        Google로 로그인
      </button>
      {err && <ErrorBanner kind={err} />}
      {usingEmulators && <p className="mt-6 text-xs text-slate">개발 모드: Firebase 에뮬레이터에 연결됨</p>}
    </main>
  )
}
