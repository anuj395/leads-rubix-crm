import { api } from './api'

export async function getResources(resourceKey: string, organizationId?: string): Promise<any[]> {
  const qs = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : ''
  const res = await api.get(`resources/${resourceKey}${qs}`)
  return (res.data ?? []) as any[]
}

export async function createResource(resourceKey: string, data: any, organizationId?: string): Promise<any> {
  const payload = {
    ...data,
    ...(organizationId ? { organization_id: organizationId } : {}),
  }
  const res = await api.post(`resources/${resourceKey}`, payload)
  return res.data
}

export async function updateResource(resourceKey: string, id: string, data: any): Promise<any> {
  const res = await api.put(`resources/${resourceKey}/${id}`, data)
  return res.data
}

export async function deleteResource(resourceKey: string, id: string): Promise<void> {
  await api.delete(`resources/${resourceKey}/${id}`)
}
