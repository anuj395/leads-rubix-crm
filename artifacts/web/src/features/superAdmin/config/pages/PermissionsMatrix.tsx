import { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import { Save as SaveIcon } from '@mui/icons-material'
import { AppCard } from '@/components/ui/AppCard'
import {
  getIndustries,
  getRoles,
  getMenus,
  getPermissions,
  bulkSetPermissions,
  type Industry,
  type AdminRole,
  type SidebarMenuRecord,
} from '@/services/sidebarAdminService'

export default function PermissionsMatrixPage() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [menus, setMenus] = useState<SidebarMenuRecord[]>([])
  const [industryId, setIndustryId] = useState('')
  const [roleId, setRoleId] = useState('')
  const [enabled, setEnabled] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  })

  // Load industries + master menu catalog once.
  useEffect(() => {
    void (async () => {
      try {
        const [inds, allMenus] = await Promise.all([getIndustries(), getMenus()])
        setIndustries(inds)
        setMenus(allMenus)
        if (inds[0]) setIndustryId(inds[0]._id)
      } catch (e: any) {
        setToast({ open: true, msg: e?.response?.data?.message ?? 'Failed to load', sev: 'error' })
      }
    })()
  }, [])

  // Reload roles whenever industry changes. Use a `cancelled` flag so a fast
  // industry change doesn't apply stale role lists / clobber the new selection.
  useEffect(() => {
    if (!industryId) return
    let cancelled = false
    setRoleId('') // clear immediately so the perms effect below also pauses
    void (async () => {
      try {
        const list = await getRoles(industryId)
        if (cancelled) return
        setRoles(list)
        setRoleId(list[0]?._id ?? '')
      } catch (e: any) {
        if (cancelled) return
        setToast({ open: true, msg: e?.response?.data?.message ?? 'Failed to load roles', sev: 'error' })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [industryId])

  // Reload current selections whenever (industry, role) changes — also race-safe.
  useEffect(() => {
    if (!industryId || !roleId) {
      setEnabled(new Set())
      return
    }
    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const perms = await getPermissions({
          industry_id: industryId,
          role_id: roleId,
          visibleOnly: true,
        })
        if (cancelled) return
        setEnabled(new Set(perms.map((p) => p.menu_id)))
      } catch (e: any) {
        if (cancelled) return
        setToast({ open: true, msg: e?.response?.data?.message ?? 'Failed to load permissions', sev: 'error' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [industryId, roleId])

  // Group menus by parent for an organised matrix.
  const groupedMenus = useMemo(() => {
    const byId = new Map(menus.map((m) => [m._id, m]))
    const roots = menus.filter((m) => !m.parent_id).sort((a, b) => a.order - b.order)
    return roots.map((root) => ({
      root,
      children: menus
        .filter((m) => m.parent_id === root._id)
        .sort((a, b) => a.order - b.order),
    }))
    // include reference to map for orphan handling — currently unused
    void byId
  }, [menus])

  const orphanMenus = useMemo(() => {
    const byId = new Map(menus.map((m) => [m._id, m]))
    return menus.filter((m) => m.parent_id && !byId.has(m.parent_id))
  }, [menus])

  const toggle = (id: string) => {
    setEnabled((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleGroup = (rootId: string, childIds: string[], allOn: boolean) => {
    setEnabled((prev) => {
      const next = new Set(prev)
      if (allOn) {
        next.delete(rootId)
        childIds.forEach((c) => next.delete(c))
      } else {
        next.add(rootId)
        childIds.forEach((c) => next.add(c))
      }
      return next
    })
  }

  const save = async () => {
    if (!industryId || !roleId) return
    setSaving(true)
    try {
      await bulkSetPermissions({
        industry_id: industryId,
        role_id: roleId,
        menu_ids: [...enabled],
      })
      setToast({ open: true, msg: 'Permissions updated', sev: 'success' })
    } catch (e: any) {
      setToast({ open: true, msg: e?.response?.data?.message ?? 'Save failed', sev: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <AppCard
        title="Sidebar Permissions"
        subtitle="Pick which menus each (industry, role) sees. Saving overwrites the current set."
        action={
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={save}
            disabled={!industryId || !roleId || saving || loading}
          >
            {saving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Save'}
          </Button>
        }
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            select
            size="small"
            label="Industry"
            value={industryId}
            onChange={(e) => setIndustryId(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            {industries.map((i) => (
              <MenuItem key={i._id} value={i._id}>
                {i.name} ({i.code})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Role"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            sx={{ minWidth: 220 }}
            disabled={!roles.length}
          >
            {roles.map((r) => (
              <MenuItem key={r._id} value={r._id}>
                {r.name} ({r.key})
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : !roleId ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            Select an industry and role to manage permissions.
          </Typography>
        ) : menus.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No menus exist yet — create some on the Menus page first.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {groupedMenus.map(({ root, children }) => {
              const allChildIds = children.map((c) => c._id)
              const allOn =
                enabled.has(root._id) && allChildIds.every((id) => enabled.has(id))
              const someOn =
                enabled.has(root._id) || allChildIds.some((id) => enabled.has(id))
              return (
                <Paper key={root._id} variant="outlined" sx={{ p: 2 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: children.length ? 1 : 0 }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={enabled.has(root._id)}
                          indeterminate={!enabled.has(root._id) && someOn}
                          onChange={() => toggle(root._id)}
                        />
                      }
                      label={
                        <Typography sx={{ fontWeight: 600 }}>
                          {root.name}{' '}
                          <Typography component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                            ({root.key})
                          </Typography>
                        </Typography>
                      }
                    />
                    {children.length > 0 && (
                      <Button
                        size="small"
                        onClick={() => toggleGroup(root._id, allChildIds, allOn)}
                      >
                        {allOn ? 'Clear group' : 'Select group'}
                      </Button>
                    )}
                  </Stack>
                  {children.length > 0 && (
                    <>
                      <Divider sx={{ mb: 1 }} />
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                          rowGap: 0.5,
                          columnGap: 2,
                          pl: 4,
                        }}
                      >
                        {children.map((child) => (
                          <FormControlLabel
                            key={child._id}
                            control={
                              <Checkbox
                                checked={enabled.has(child._id)}
                                onChange={() => toggle(child._id)}
                              />
                            }
                            label={
                              <Typography variant="body2">
                                {child.name}{' '}
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{ color: 'text.secondary' }}
                                >
                                  ({child.key})
                                </Typography>
                              </Typography>
                            }
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </Paper>
              )
            })}

            {orphanMenus.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Orphans</Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    rowGap: 0.5,
                    columnGap: 2,
                  }}
                >
                  {orphanMenus.map((m) => (
                    <FormControlLabel
                      key={m._id}
                      control={
                        <Checkbox checked={enabled.has(m._id)} onChange={() => toggle(m._id)} />
                      }
                      label={`${m.name} (${m.key})`}
                    />
                  ))}
                </Box>
              </Paper>
            )}
          </Stack>
        )}
      </AppCard>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.sev} variant="filled" onClose={() => setToast({ ...toast, open: false })}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
