import { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import { AppCard } from '@/components/ui/AppCard'
import {
  getIndustries,
  getRoles,
  createRoleRecord,
  updateRoleRecord,
  deleteRoleRecord,
  type Industry,
  type AdminRole,
} from '@/services/sidebarAdminService'

const ROLE_KEYS = ['superAdmin', 'admin', 'leadManager', 'teamLead', 'sales']

interface FormState {
  _id?: string
  industry_id: string
  key: string
  name: string
  description: string
  is_active: boolean
}

const emptyForm: FormState = {
  industry_id: '',
  key: '',
  name: '',
  description: '',
  is_active: true,
}

export default function RolesPage() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [filterIndustry, setFilterIndustry] = useState<string>('')
  const [items, setItems] = useState<AdminRole[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  })

  const industryById = useMemo(
    () => new Map(industries.map((i) => [i._id, i])),
    [industries],
  )

  const loadIndustries = async () => {
    try {
      const list = await getIndustries()
      setIndustries(list)
      if (!filterIndustry && list[0]) setFilterIndustry(list[0]._id)
    } catch (e: any) {
      setToast({ open: true, msg: e?.response?.data?.message ?? 'Failed to load industries', sev: 'error' })
    }
  }

  const refresh = async () => {
    if (!filterIndustry) return
    setLoading(true)
    try {
      setItems(await getRoles(filterIndustry))
    } catch (e: any) {
      setToast({ open: true, msg: e?.response?.data?.message ?? 'Failed to load', sev: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadIndustries()
  }, [])

  useEffect(() => {
    void refresh()
  }, [filterIndustry])

  const openCreate = () => {
    setForm({ ...emptyForm, industry_id: filterIndustry })
    setDialogOpen(true)
  }

  const openEdit = (row: AdminRole) => {
    setForm({
      _id: row._id,
      industry_id: row.industry_id,
      key: row.key,
      name: row.name,
      description: row.description ?? '',
      is_active: row.is_active,
    })
    setDialogOpen(true)
  }

  const submit = async () => {
    if (!form.industry_id || !form.key || !form.name.trim()) {
      setToast({ open: true, msg: 'Industry, key and name are required', sev: 'error' })
      return
    }
    setSaving(true)
    try {
      if (form._id) {
        await updateRoleRecord(form._id, {
          key: form.key,
          name: form.name,
          description: form.description,
          is_active: form.is_active,
        })
      } else {
        await createRoleRecord({
          industry_id: form.industry_id,
          key: form.key,
          name: form.name,
          description: form.description,
          is_active: form.is_active,
        })
      }
      setDialogOpen(false)
      setToast({ open: true, msg: 'Saved', sev: 'success' })
      await refresh()
    } catch (e: any) {
      setToast({ open: true, msg: e?.response?.data?.message ?? 'Save failed', sev: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: AdminRole) => {
    if (!window.confirm(`Delete role "${row.name}" (${row.key})?`)) return
    try {
      await deleteRoleRecord(row._id)
      setToast({ open: true, msg: 'Deleted', sev: 'success' })
      await refresh()
    } catch (e: any) {
      setToast({ open: true, msg: e?.response?.data?.message ?? 'Delete failed', sev: 'error' })
    }
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <AppCard
        title="Roles"
        subtitle="Per-industry roles. Each user inherits sidebar permissions from their (industry, role) pair."
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openCreate}
            disabled={!filterIndustry}
          >
            Add Role
          </Button>
        }
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            select
            size="small"
            label="Industry"
            value={filterIndustry}
            onChange={(e) => setFilterIndustry(e.target.value)}
            sx={{ minWidth: 240 }}
          >
            {industries.map((i) => (
              <MenuItem key={i._id} value={i._id}>
                {i.name} ({i.code})
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No roles for this industry yet.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Key</TableCell>
                  <TableCell>Display Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row._id} hover>
                    <TableCell><code>{row.key}</code></TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{row.description || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.is_active ? 'Active' : 'Inactive'}
                        color={row.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form._id ? 'Edit Role' : 'New Role'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Industry"
              value={form.industry_id}
              onChange={(e) => setForm({ ...form, industry_id: e.target.value })}
              disabled={!!form._id}
              fullWidth
            >
              {industries.map((i) => (
                <MenuItem key={i._id} value={i._id}>
                  {i.name} ({i.code})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Role Key"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              disabled={!!form._id}
              fullWidth
              helperText="Must match user.role values used in the app"
            >
              {ROLE_KEYS.map((k) => (
                <MenuItem key={k} value={k}>
                  {k}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Display Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit} disabled={saving}>
            {saving ? <CircularProgress size={18} /> : 'Save'}
          </Button>
        </DialogActions>
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
