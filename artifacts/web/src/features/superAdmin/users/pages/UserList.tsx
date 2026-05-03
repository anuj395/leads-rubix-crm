import { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'

import { AppCard } from '@/components/ui/AppCard'
import { DynamicForm } from '@/components/DynamicForm/DynamicForm'
import { useAppSelector } from '@/store/hooks'
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  type AdminUser,
} from '@/services/usersAdminService'
import {
  resolveScreen,
  type ResolvedTableHeader,
} from '@/services/screenAdminService'
import {
  getIndustries,
  getRoles,
  type Industry,
  type AdminRole,
} from '@/services/sidebarAdminService'

// Core columns we always want visible regardless of dynamic field config.
const CORE_COLUMNS: ResolvedTableHeader[] = [
  { key: 'name',        label: 'Name',     type: 'text',   sortable: true,  order: -100, options: [], visible: true },
  { key: 'email',       label: 'Email',    type: 'email',  sortable: true,  order: -90,  options: [], visible: true },
  { key: 'role',        label: 'Role',     type: 'badge',  sortable: true,  order: -80,  options: [], visible: true },
  { key: 'industry_id', label: 'Industry', type: 'text',   sortable: true,  order: -70,  options: [], visible: true },
  { key: 'is_active',   label: 'Status',   type: 'badge',  sortable: false, order: -60,  options: [], visible: true },
]

interface CoreFormState {
  name: string
  email: string
  password: string
  role: string
  industry_id: string
  is_active: boolean
}

const emptyCore: CoreFormState = {
  name: '',
  email: '',
  password: '',
  role: 'sales',
  industry_id: '',
  is_active: true,
}

export default function UserListPage() {
  const authedUser = useAppSelector((s) => s.auth.user)
  const isSuperAdmin = authedUser?.role === 'superAdmin'

  const [industries, setIndustries] = useState<Industry[]>([])
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [filterIndustry, setFilterIndustry] = useState<string>('') // industry CODE
  const [items, setItems] = useState<AdminUser[]>([])
  const [dynamicCols, setDynamicCols] = useState<ResolvedTableHeader[]>([])
  const [loading, setLoading] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [core, setCore] = useState<CoreFormState>(emptyCore)
  const [dynamicValues, setDynamicValues] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false, msg: '', sev: 'success',
  })

  const showToast = (msg: string, sev: 'success' | 'error' = 'success') =>
    setToast({ open: true, msg, sev })

  // ── Load industries (superAdmin can pick); pin filter to user's industry otherwise.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        if (isSuperAdmin) {
          const list = await getIndustries()
          if (cancelled) return
          setIndustries(list)
          setFilterIndustry((cur) => cur || list[0]?.code || '')
        } else if (authedUser?.industry_id) {
          setFilterIndustry(authedUser.industry_id)
        }
      } catch (e) {
        const err = e as { response?: { data?: { message?: string } } }
        showToast(err?.response?.data?.message ?? 'Failed to load industries', 'error')
      }
    })()
    return () => { cancelled = true }
  }, [isSuperAdmin, authedUser?.industry_id])

  // ── Load roles for the selected industry (drives Add User Role dropdown).
  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!filterIndustry) { setRoles([]); return }
      try {
        const allIndustries = isSuperAdmin
          ? industries
          : await getIndustries().catch(() => [] as Industry[])
        const ind = allIndustries.find((i) => i.code === filterIndustry)
        if (!ind) { if (!cancelled) setRoles([]); return }
        const list = await getRoles(ind._id)
        if (cancelled) return
        setRoles(list)
      } catch {
        if (!cancelled) setRoles([])
      }
    })()
    return () => { cancelled = true }
  }, [filterIndustry, industries, isSuperAdmin])

  // ── Load users + dynamic table columns whenever the industry filter changes.
  const refresh = async () => {
    setLoading(true)
    try {
      const [list, resolved] = await Promise.all([
        listUsers(isSuperAdmin ? filterIndustry || undefined : undefined),
        resolveScreen({
          screen_key: 'users',
          industry_code: isSuperAdmin ? filterIndustry || undefined : undefined,
          // For SuperAdmin, role_key is undefined → resolver shows ALL active fields.
          role_key: undefined,
        }).catch(() => null),
      ])
      setItems(list)
      // Filter out core keys in case anyone configured them as screen fields too.
      const coreKeys = new Set(CORE_COLUMNS.map((c) => c.key))
      const dyn = (resolved?.table_headers ?? []).filter((c) => !coreKeys.has(c.key))
      setDynamicCols(dyn)
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      showToast(err?.response?.data?.message ?? 'Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterIndustry])

  const allColumns = useMemo(
    () => [...CORE_COLUMNS, ...dynamicCols].sort((a, b) => a.order - b.order),
    [dynamicCols],
  )

  // ── Open dialogs ──────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null)
    setCore({
      ...emptyCore,
      industry_id: filterIndustry || authedUser?.industry_id || '',
      role: roles[0]?.key || 'sales',
    })
    setDynamicValues({})
    setFormError(null)
    setDialogOpen(true)
  }

  const openEdit = (row: AdminUser) => {
    setEditing(row)
    setCore({
      name: row.name ?? '',
      email: row.email,
      password: '', // blank — only sent when explicitly typed
      role: row.role,
      industry_id: row.industry_id ?? '',
      is_active: row.is_active,
    })
    setDynamicValues((row.fields as Record<string, unknown>) ?? {})
    setFormError(null)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    if (saving) return
    setDialogOpen(false)
    setEditing(null)
  }

  // ── Submit handler — receives merged dynamic values from DynamicForm.
  const handleSubmit = async (dynVals: Record<string, unknown>) => {
    setFormError(null)
    if (!core.email.trim()) { setFormError('Email is required'); return }
    if (!editing && !core.password) { setFormError('Password is required for a new user'); return }
    if (!core.role) { setFormError('Role is required'); return }
    if (isSuperAdmin && !core.industry_id) { setFormError('Industry is required'); return }

    setSaving(true)
    try {
      if (editing) {
        await updateUser(editing._id, {
          name: core.name.trim(),
          role: core.role,
          industry_id: core.industry_id || undefined,
          is_active: core.is_active,
          password: core.password || undefined,
          fields: dynVals,
        })
        showToast('User updated')
      } else {
        await createUser({
          name: core.name.trim(),
          email: core.email.trim().toLowerCase(),
          password: core.password,
          role: core.role,
          industry_id: core.industry_id || undefined,
          is_active: core.is_active,
          fields: dynVals,
        })
        showToast('User created')
      }
      setDialogOpen(false)
      setEditing(null)
      await refresh()
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } ; message?: string }
      setFormError(err?.response?.data?.message ?? err?.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: AdminUser) => {
    if (!window.confirm(`Delete user "${row.email}"?`)) return
    try {
      await deleteUser(row._id)
      showToast('User deleted')
      await refresh()
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } }
      showToast(err?.response?.data?.message ?? 'Delete failed', 'error')
    }
  }

  // ── Render a cell value with sensible defaults for our common types. ─────
  const renderCell = (row: AdminUser, col: ResolvedTableHeader) => {
    if (col.key === 'is_active') {
      return (
        <Chip
          size="small"
          label={row.is_active ? 'Active' : 'Inactive'}
          color={row.is_active ? 'success' : 'default'}
        />
      )
    }
    if (col.key === 'role') {
      return <Chip size="small" label={row.role} />
    }
    let v: unknown
    if (col.key in row) {
      v = (row as unknown as Record<string, unknown>)[col.key]
    } else {
      v = (row.fields as Record<string, unknown>)?.[col.key]
    }
    if (v == null || v === '') return <Box sx={{ color: 'text.secondary' }}>—</Box>
    return String(v)
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%', minWidth: 0 }}>
      <AppCard
        title="Users"
        subtitle="Add, edit, and manage users. Per-role custom fields are configured in Users → Roles & Permissions."
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            disabled={!filterIndustry}
          >
            Add User
          </Button>
        }
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          {isSuperAdmin && (
            <TextField
              select
              size="small"
              label="Industry"
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              sx={{ minWidth: 240 }}
            >
              {industries.map((i) => (
                <MenuItem key={i._id} value={i.code}>
                  {i.name} ({i.code})
                </MenuItem>
              ))}
            </TextField>
          )}
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No users yet — click "Add User" to create one.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  {allColumns.map((c) => (
                    <TableCell key={c.key}>{c.label}</TableCell>
                  ))}
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row._id} hover>
                    {allColumns.map((c) => (
                      <TableCell key={c.key}>{renderCell(row, c)}</TableCell>
                    ))}
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(row)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => remove(row)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </AppCard>

      {/* ── Add / Edit dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? `Edit User — ${editing.email}` : 'New User'}</DialogTitle>
        <DialogContent dividers>
          <DynamicForm
            screen="users"
            industry_code={isSuperAdmin ? core.industry_id : undefined}
            role_key={core.role}
            initialValues={dynamicValues as Record<string, string | number | boolean | null>}
            onSubmit={async (vals) => { await handleSubmit(vals as Record<string, unknown>) }}
            onCancel={closeDialog}
            submitLabel={editing ? 'Save' : 'Create User'}
            headerSlot={
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
                  Account
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <TextField
                    size="small"
                    label="Name"
                    value={core.name}
                    onChange={(e) => setCore({ ...core, name: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label="Email *"
                    type="email"
                    value={core.email}
                    onChange={(e) => setCore({ ...core, email: e.target.value })}
                    disabled={!!editing}
                    fullWidth
                  />
                  <TextField
                    size="small"
                    label={editing ? 'New Password (leave blank to keep)' : 'Password *'}
                    type="password"
                    value={core.password}
                    onChange={(e) => setCore({ ...core, password: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    select
                    size="small"
                    label="Role *"
                    value={core.role}
                    onChange={(e) => setCore({ ...core, role: e.target.value })}
                    fullWidth
                    helperText="Form fields below auto-update based on the selected role"
                  >
                    {roles.length === 0 ? (
                      <MenuItem value="sales">sales</MenuItem>
                    ) : (
                      roles.map((r) => (
                        <MenuItem key={r._id} value={r.key}>{r.name} ({r.key})</MenuItem>
                      ))
                    )}
                  </TextField>
                  {isSuperAdmin && (
                    <TextField
                      select
                      size="small"
                      label="Industry *"
                      value={core.industry_id}
                      onChange={(e) => setCore({ ...core, industry_id: e.target.value })}
                      disabled={!!editing}
                      fullWidth
                    >
                      {industries.map((i) => (
                        <MenuItem key={i._id} value={i.code}>
                          {i.name} ({i.code})
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                  <TextField
                    select
                    size="small"
                    label="Status"
                    value={core.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setCore({ ...core, is_active: e.target.value === 'active' })}
                    fullWidth
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </TextField>
                </Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
                  Role-specific Fields
                </Typography>
                {formError && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
                    {formError}
                  </Alert>
                )}
              </Box>
            }
          />
        </DialogContent>
      </Dialog>

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
