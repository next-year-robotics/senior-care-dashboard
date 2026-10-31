import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from 'firebase/auth'
import { connectDatabaseEmulator, getDatabase } from 'firebase/database'

export const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FB_DATABASE_URL,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  // 웹 푸시(FCM)에 필요하다. 프로젝트 번호이며 appId("1:<번호>:web:…")에 들어 있다.
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID || String(import.meta.env.VITE_FB_APP_ID ?? '').split(':')[1],
})

export const auth = getAuth(firebaseApp)
export const db = getDatabase(firebaseApp)
export const googleProvider = new GoogleAuthProvider()
export const usingEmulators = import.meta.env.VITE_USE_EMULATORS === '1'
export const DEFAULT_ROBOT_ID = import.meta.env.VITE_DEFAULT_ROBOT_ID || 'mr-001'

if (usingEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectDatabaseEmulator(db, '127.0.0.1', 9000)
}
