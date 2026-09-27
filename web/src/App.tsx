import { useUser } from './lib/auth'
import { LoginPage } from './pages/LoginPage'
import { RobotPage } from './pages/RobotPage'

export default function App() {
  const { user, loading } = useUser()
  if (loading) return <main className="flex min-h-screen items-center justify-center text-slate">불러오는 중…</main>
  return user ? <RobotPage user={user} /> : <LoginPage />
}
