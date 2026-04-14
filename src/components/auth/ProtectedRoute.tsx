import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { FullPageSpinner } from '../ui/Spinner'
import type { UserRole } from '../../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
