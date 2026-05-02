import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { clearAuthError, register, selectAuth } from '@/features/auth'
import { paths } from '@/routes/paths'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

import { SignupForm } from '../components/SignupForm'

export function SignupPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { error, status } = useAppSelector(selectAuth)

  useEffect(() => {
    dispatch(clearAuthError())
  }, [dispatch])

  const handleSubmit = async ({ confirmPassword: _confirmPassword, ...credentials }: {
    confirmPassword: string
    email: string
    name: string
    password: string
  }) => {
    await dispatch(register(credentials)).unwrap()
    navigate(paths.leads, { replace: true })
  }

  return (
    <SignupForm error={error} isSubmitting={status === 'loading'} onSubmit={handleSubmit} />
  )
}