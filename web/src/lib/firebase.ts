import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, GoogleAuthProvider } from 'firebase/auth'
import { connectDatabaseEmulator, getDatabase } from 'firebase/database'

export const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FB_DATABASE_URL,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
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
