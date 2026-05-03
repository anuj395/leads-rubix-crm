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

export interface PagedUsers {
  items: AdminUser[]
  total: number
}

export interface ListUsersPagedArgs {
  industryId?: string
  page: number
  pageSize: number
  q?: string
  sortField?: string
  sortDir?: 'asc' | 'desc'
}

/**
 * Server-paginated user list. Mirrors `/api/users?page=&pageSize=&q=&sortField=&sortDir=`
 * and feeds the AppDataGrid in `paginationMode="server"`.
 */
export async function listUsersPaged(args: ListUsersPagedArgs): Promise<PagedUsers> {
  const params = new URLSearchParams()
  if (args.industryId) params.set('industry_id', args.industryId)
  params.set('page', String(args.page))
  params.set('pageSize', String(args.pageSize))
  if (args.q) params.set('q', args.q)
  if (args.sortField) params.set('sortField', args.sortField)
  if (args.sortDir) params.set('sortDir', args.sortDir)
  const res = await api.get(`users?${params.toString()}`)
  const data = res.data ?? {}
  return {
    items: (data.items ?? []) as AdminUser[],
    total: typeof data.total === 'number' ? data.total : (data.items?.length ?? 0),
  }
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
