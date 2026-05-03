import { api } from './api'

export interface AdminUser {
  _id: string
  id?: string
  name?: string
  email: string
  role: string
  industry_id?: string
  is_active: boolean
  fields: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export interface CreateUserInput {
  email: string
  password: string
  name?: string
  role: string
  industry_id?: string
  is_active?: boolean
  fields?: Record<string, unknown>
}

export interface UpdateUserInput {
  name?: string
  role?: string
  industry_id?: string
  is_active?: boolean
  password?: string
  fields?: Record<string, unknown>
}

async function safeList(path: string): Promise<AdminUser[]> {
  const res = await api.get(path)
  // Tolerant of both the new `{items:[]}` envelope and the legacy bare array.
  if (Array.isArray(res.data)) return res.data as AdminUser[]
  return (res.data?.items ?? []) as AdminUser[]
}

export async function listUsers(industryId?: string): Promise<AdminUser[]> {
  const qs = industryId ? `?industry_id=${encodeURIComponent(industryId)}` : ''
  return safeList(`users${qs}`)
}

export async function createUser(data: CreateUserInput): Promise<AdminUser> {
  const res = await api.post('users', data)
  return res.data as AdminUser
}

export async function updateUser(id: string, data: UpdateUserInput): Promise<AdminUser> {
  const res = await api.put(`users/${id}`, data)
  return res.data as AdminUser
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`users/${id}`)
}
