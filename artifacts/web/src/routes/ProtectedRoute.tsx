import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { selectAuth } from '@/features/auth'
import { useAppSelector } from '@/store/hooks'

import { paths } from './paths'

export function ProtectedRoute() {
  const { isAuthenticated, user } = useAppSelector(selectAuth)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={paths.login} />
  }

  if (user?.needs_password_change && location.pathname !== '/change-password') {
    return <Navigate replace to="/change-password" />
  }

  if (!user?.needs_password_change && location.pathname === '/change-password') {
    return <Navigate replace to="/analytics" />
  }

  return <Outlet />
}