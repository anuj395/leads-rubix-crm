import { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material'
import type { GridColDef } from '@mui/x-data-grid'
import { AppCard } from '@/components/ui/AppCard'
import { AppDataGrid } from '@/components/ui/AppDataGrid'
import {
  getIndustries,
  createIndustryRecord,
  updateIndustryRecord,
  deleteIndustryRecord,
  type Industry,
} from '@/services/sidebarAdminService'

interface FormState {
  _id?: string
  code: string
  name: string
  description: string
  is_active: boolean
}

const emptyForm: FormState = { code: '', name: '', description: '', is_active: true }

export default function IndustriesPage() {
  const [items, setItems] = useState<Industry[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false, msg: '', sev: 'success',
  })

  const refresh = async () => {
    setLoading(true)
    try {
      setItems(await getIndustries())
    } catch (e: any) {
      setToast({ open: true, msg: e?.response?.data?.message ?? 'Failed to load', sev: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  const openCreate = () => { setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (row: Industry) => {
    setForm({ _id: row._id, code: row.code, name: row.name, description: row.description ?? '', is_active: row.is_active })
    setDialogOpen(true)
  }

  const submit = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setToast({ open: true, msg: 'Code and name are required', sev: 'error' }); return
    }
    setSaving(true)
    try {
      if (form._id) {
        await updateIndustryRecord(form._id, { code: form.code, name: form.name, description: form.description, is_active: form.is_active })
      } else {
        await createIndustryRecord({ code: form.code, name: form.name, description: form.description, is_active: form.is_active })
      }
      setDialogOpen(false)
      setToast({ open: true, msg: 'Saved', sev: 'success' })
      await refresh()
    } catch (e: any) {
      setToast({ open: true, msg: e?.response?.data?.message ?? 'Save failed', sev: 'error' })
    } finally { setSaving(false) }
  }

  const remove = async (row: Industry) => {
    if (!window.confirm(`Delete industry "${row.name}"?`)) return
    try {
      await deleteIndustryRecord(row._id)
      setToast({ open: true, msg: 'Deleted', sev: 'success' })
      await refresh()
    } catch (e: any) {
      setToast({ open: true, msg: e?.response?.data?.message ?? 'Delete failed', sev: 'error' })
    }
  }

  const gridColumns = useMemo<GridColDef<Industry>[]>(() => [
    { field: 'code', headerName: 'Code', minWidth: 140,
      renderCell: (p) => <Box component="code">{String(p.value)}</Box> },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
    { field: 'description', headerName: 'Description', flex: 1.5, minWidth: 200,
      renderCell: (p) => p.value ? String(p.value) : <Box sx={{ color: 'text.secondary' }}>—</Box> },
    { field: 'is_active', headerName: 'Status', minWidth: 110,
      renderCell: (p) => (
        <Chip size="small" label={p.value ? 'Active' : 'Inactive'} color={p.value ? 'success' : 'default'} />
      ),
    },
    { field: '__actions', headerName: 'Actions', sortable: false, filterable: false, disableColumnMenu: true,
      align: 'right', headerAlign: 'right', width: 120,
      renderCell: (p) => (
        <>
          <IconButton size="small" onClick={() => openEdit(p.row)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => void remove(p.row)}><DeleteIcon fontSize="small" /></IconButton>
        </>
      ),
    },
  ], [])

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <AppCard
        title="Industries"
        subtitle="Tenants/verticals that the platform serves."
        action={<Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add Industry</Button>}
        fullHeight
      >
        <AppDataGrid rows={items} columns={gridColumns} loading={loading} getRowId={(r) => r._id} height="100%" />
      </AppCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form._id ? 'Edit Industry' : 'New Industry'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
              helperText="Stable identifier (e.g. temp001, real-estate)" disabled={!!form._id} fullWidth />
            <TextField label="Display Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField label="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={2} fullWidth />
            <FormControlLabel
              control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />}
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

      <Snackbar open={toast.open} autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.sev} variant="filled" onClose={() => setToast({ ...toast, open: false })}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
