import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { ref, serverTimestamp, update } from 'firebase/database'
import { useEffect, useState } from 'react'
import { auth, db, googleProvider } from './firebase'

export function useUser(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false) }), [])
  return { user, loading }
}

export async function signInWithGoogle(): Promise<void> {
  const cred = await signInWithPopup(auth, googleProvider)
  const u = cred.user
  // 본인 프로필만 쓸 수 있다(규칙 /users/{uid}). 접근 권한(/access)은 관리자가 넣는다.
  await update(ref(db, `users/${u.uid}`), {
    email: u.email ?? '',
    display_name: u.displayName ?? '',
    last_login_ms: serverTimestamp(),
  })
}

export const signOutUser = () => signOut(auth)
