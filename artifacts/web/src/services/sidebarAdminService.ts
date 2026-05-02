import { api } from './api'

// ── Industry ─────────────────────────────────────────────────────────────────
export interface Industry {
  _id: string
  code: string
  name: string
  description?: string
  is_active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface IndustryInput {
  code: string
  name: string
  description?: string
  is_active?: boolean
}

// Helper for endpoints that wrap responses as `{ items: [...] }`.
async function safeList<T>(path: string): Promise<T[]> {
  const res = await api.get(path)
  return (res.data?.items ?? []) as T[]
}

export async function getIndustries(): Promise<Industry[]> {
  return safeList<Industry>('industries')
}

export async function createIndustryRecord(data: IndustryInput): Promise<Industry> {
  const res = await api.post('industries', data)
  return res.data as Industry
}

export async function updateIndustryRecord(id: string, data: Partial<IndustryInput>): Promise<Industry> {
  const res = await api.put(`industries/${id}`, data)
  return res.data as Industry
}

export async function deleteIndustryRecord(id: string): Promise<void> {
  await api.delete(`industries/${id}`)
}

// ── Role ─────────────────────────────────────────────────────────────────────
export interface AdminRole {
  _id: string
  industry_id: string
  key: string
  name: string
  description?: string
  is_active: boolean
}

export interface RoleInput {
  industry_id: string
  key: string
  name: string
  description?: string
  is_active?: boolean
}

export async function getRoles(industryId?: string): Promise<AdminRole[]> {
  const path = industryId ? `roles?industry_id=${industryId}` : 'roles'
  return safeList<AdminRole>(path)
}

export async function createRoleRecord(data: RoleInput): Promise<AdminRole> {
  const res = await api.post('roles', data)
  return res.data as AdminRole
}

export async function updateRoleRecord(id: string, data: Partial<RoleInput>): Promise<AdminRole> {
  const res = await api.put(`roles/${id}`, data)
  return res.data as AdminRole
}

export async function deleteRoleRecord(id: string): Promise<void> {
  await api.delete(`roles/${id}`)
}

// ── Sidebar Menu (master catalog) ────────────────────────────────────────────
export interface SidebarMenuRecord {
  _id: string
  key: string
  name: string
  icon?: string
  route?: string
  parent_id: string | null
  order: number
  module?: string
  is_active: boolean
}

export interface SidebarMenuInput {
  key: string
  name: string
  icon?: string
  route?: string
  parent_id?: string | null
  order?: number
  module?: string
  is_active?: boolean
}

export async function getMenus(): Promise<SidebarMenuRecord[]> {
  return safeList<SidebarMenuRecord>('sidebar-menus')
}

export async function createMenuRecord(data: SidebarMenuInput): Promise<SidebarMenuRecord> {
  const res = await api.post('sidebar-menus', data)
  return res.data as SidebarMenuRecord
}

export async function updateMenuRecord(id: string, data: Partial<SidebarMenuInput>): Promise<SidebarMenuRecord> {
  const res = await api.put(`sidebar-menus/${id}`, data)
  return res.data as SidebarMenuRecord
}

export async function deleteMenuRecord(id: string): Promise<void> {
  await api.delete(`sidebar-menus/${id}`)
}

// ── Sidebar Permission ───────────────────────────────────────────────────────
export interface SidebarPermissionRecord {
  _id: string
  role_id: string
  industry_id: string
  menu_id: string
  is_visible: boolean
  order_override: number | null
}

export async function getPermissions(params: {
  role_id?: string
  industry_id?: string
  menu_id?: string
  visibleOnly?: boolean
} = {}): Promise<SidebarPermissionRecord[]> {
  const search = new URLSearchParams()
  if (params.role_id) search.set('role_id', params.role_id)
  if (params.industry_id) search.set('industry_id', params.industry_id)
  if (params.menu_id) search.set('menu_id', params.menu_id)
  if (params.visibleOnly) search.set('visible', 'true')
  const qs = search.toString()
  return safeList<SidebarPermissionRecord>(qs ? `sidebar-permissions?${qs}` : 'sidebar-permissions')
}

export async function bulkSetPermissions(input: {
  role_id: string
  industry_id: string
  menu_ids: string[]
}): Promise<SidebarPermissionRecord[]> {
  const res = await api.post('sidebar-permissions/bulk', input)
  return (res.data?.items ?? []) as SidebarPermissionRecord[]
}
