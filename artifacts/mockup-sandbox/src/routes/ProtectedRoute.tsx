import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { selectAuth } from '@/features/auth'
import { useAppSelector } from '@/store/hooks'

import { paths } from './paths'

export function ProtectedRoute() {
  const { isAuthenticated } = useAppSelector(selectAuth)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={paths.login} />
  }

  return <Outlet />
}