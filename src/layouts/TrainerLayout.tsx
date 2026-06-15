import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Navbar } from '@/components/Navbar'

export function TrainerLayout() {
  const { isLoading, isTrainer, isAdmin, session } = useAuth()

  if (isLoading) return null
  if (!session) return <Navigate to="/login" replace />
  if (!isTrainer && !isAdmin) return <Navigate to="/" replace />

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Navbar />
      <main className="container-yoga flex-1 py-8">
        <Outlet />
      </main>
    </div>
  )
}
