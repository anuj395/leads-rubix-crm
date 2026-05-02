/**
 * hooks/useTableConfig.ts  (updated)
 *
 * Fetches the DB-driven table column config for a given screen name.
 *
 * API contract (GET /api/table-configs/:industry_id):
 * {
 *   industry_id: string,
 *   screens: [
 *     {
 *       screen: "contacts",
 *       headers: [
 *         { key: "name", label: "Name", type: "avatar", visible: true, sortable: true, width: 180 },
 *         ...
 *       ]
 *     },
 *     { screen: "bookings", headers: [...] },
 *     ...
 *   ]
 * }
 *
 * Uses the real API only; no local mock fallback.
 */
import { useState, useEffect, useCallback } from 'react'
import type { DbColumnConfig } from '../components/DataTable/types'
import { getTableConfigs } from '../services/headerConfigService'
// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseTableConfigResult {
  columns: DbColumnConfig[]
  loading: boolean
  error: string | null
  reload: () => void
}

export function useTableConfig(
  screen: string,
  industry_id?: string,
): UseTableConfigResult {
  const [columns, setColumns] = useState<DbColumnConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    async function fetchConfig() {
      try {
        // Require industry_id — always use real API. If industry_id missing, return empty columns.
        if (!industry_id) {
          if (!cancelled) {
            setColumns([])
            setError('Missing industry_id — cannot load table configuration')
          }
          return
        }

        // Real API
        const data = await getTableConfigs(industry_id)

        // Navigate: data.screens[] → find matching screen → .headers
        const screenConfig: DbColumnConfig[] = Array.isArray(data?.screens)
          ? (
              data.screens as Array<{
                screen: string
                headers: DbColumnConfig[]
              }>
            ).find((s) => s.screen === screen)?.headers ?? []
          : []

        if (!cancelled) {
          setColumns(screenConfig.filter((c) => c.visible !== false))
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load table config'
          setError(msg)
          setColumns([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchConfig()
    return () => {
      cancelled = true
    }
  }, [screen, industry_id, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  return { columns, loading, error, reload }
}
