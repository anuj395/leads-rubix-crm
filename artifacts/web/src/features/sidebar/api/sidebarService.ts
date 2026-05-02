import axiosInstance from '@/services/axiosInstance'

export interface SidebarItem {
  id: string
  name: string
  icon?: string
  route?: string
  children?: SidebarItem[]
}

export async function fetchSidebar(role?: string, industry_id?: string): Promise<any> {
  // cache responses for identical requests to avoid duplicate network calls
  // key: `${role ?? ''}:${industry_id ?? ''}`
  // short TTL so UI updates still propagate when changes occur
  const CACHE_TTL = 5000
  type CacheEntry = { ts: number; promise: Promise<any> }
  // store cache on module scope
  ;(fetchSidebar as any)._cache = (fetchSidebar as any)._cache || new Map<string, CacheEntry>()
  const cache: Map<string, CacheEntry> = (fetchSidebar as any)._cache

  const key = `${role ?? ''}:${industry_id ?? ''}`
  const now = Date.now()
  const existing = cache.get(key)
  if (existing && now - existing.ts < CACHE_TTL) {
    return existing.promise
  }

  const requestPromise = (async () => {
    // If both role and industry are provided, backend exposes POST /sidebar/user
    if (role && industry_id) {
      const resp = await axiosInstance.post('/sidebar/user', { industry_id, role })
      return resp.data
    }

    // If only industry_id provided, fetch full sidebar config for that industry
    if (industry_id) {
      const resp = await axiosInstance.get<SidebarItem[]>(`/sidebar/${industry_id}`)
      return resp.data ?? []
    }

    // Fallback: return empty
    return []
  })()

  cache.set(key, { ts: now, promise: requestPromise })
  try {
    const data = await requestPromise
    return data
  } catch (err) {
    // remove failed requests so future attempts can retry
    cache.delete(key)
    throw err
  }
}

export async function assignSidebar(payload: {
  industry_id: string
  role?: string
  menus?: { key: string; name: string; route?: string; icon?: string; module?: string }[]
  is_ready_to_launch?: boolean
}) {
  const resp = await axiosInstance.post('/sidebar', payload)
  return resp.data
}
