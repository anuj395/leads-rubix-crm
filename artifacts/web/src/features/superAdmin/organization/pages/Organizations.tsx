import { useCallback, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import type { GridColDef, GridFilterModel, GridPaginationModel, GridSortModel } from '@mui/x-data-grid'
import { AppCard } from '@/components/ui/AppCard'
import { AppDataGrid } from '@/components/ui/AppDataGrid'
import { DynamicForm } from '@/components/DynamicForm/DynamicForm'
import {
  listOrganizationsPaged,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  type Organization,
} from '@/services/organizationsService'
import { resolveScreen, type ResolvedTableHeader } from '@/services/screenAdminService'
import { useAppSelector } from '@/store/hooks'

const SERVER_SORTABLE = new Set(['createdAt', 'updatedAt', 'is_active'])

type FormValue = string | number | boolean | null

function toFormValues(row: Organization): Record<string, FormValue> {
  const out: Record<string, FormValue> = {}
  for (const [k, v] of Object.entries(row)) {
    if (k.startsWith('_') || k === 'createdAt' || k === 'updatedAt' || k === 'created_by') continue
    if (v === null) { out[k] = null; continue }
    const t = typeof v
    if (t === 'string' || t === 'number' || t === 'boolean') out[k] = v as FormValue
  }
  return out
}

export default function OrganizationsListPage() {
  const user = useAppSelector((s) => s.auth.user)
  const isSuperAdmin = user?.role === 'superAdmin'

  const [items, setItems] = useState<Organization[]>([])
  const [rowCount, setRowCount] = useState(0)
  const [columns, setColumns] = useState<ResolvedTableHeader[]>([])
  const [loading, setLoading] = useState(false)
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 })
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'createdAt', sort: 'desc' }])
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Organization | null>(null)
  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false, msg: '', sev: 'success',
  })

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const sort = sortModel[0]
      const sortField = sort?.field && SERVER_SORTABLE.has(sort.field) ? sort.field : undefined
      const sortDir = sort?.sort === 'asc' ? 'asc' : sort?.sort === 'desc' ? 'desc' : undefined
      const [paged, resolved] = await Promise.all([
        listOrganizationsPaged({
          page: paginationModel.page,
          pageSize: paginationModel.pageSize,
          q: search || undefined,
          sortField,
          sortDir,
        }),
        resolveScreen({
          screen_key: 'organization',
          industry_code: isSuperAdmin ? 'temp001' : undefined,
          role_key: isSuperAdmin ? 'admin' : undefined,
        }).catch(() => ({ table_headers: [] as ResolvedTableHeader[], form_fields: [] })),
      ])
      setItems(paged.items)
      setRowCount(paged.total)
      setColumns(resolved.table_headers ?? [])
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setToast({ open: true, msg: err?.response?.data?.message ?? 'Failed to load', sev: 'error' })
    } finally {
      setLoading(false)
    }
  }, [paginationModel.page, paginationModel.pageSize, sortModel, search, isSuperAdmin])

  useEffect(() => { void refresh() }, [refresh])

  const gridColumns = useMemo<GridColDef<Organization>[]>(() => {
    const sorted = [...columns].sort((a, b) => a.order - b.order)
    const dataCols: GridColDef<Organization>[] = sorted.map((c) => ({
      field: c.key,
      headerName: c.label,
      flex: 1,
      minWidth: 140,
      sortable: c.sortable !== false && SERVER_SORTABLE.has(c.key),
      valueGetter: (_v, row) => (row as Record<string, unknown>)[c.key],
      renderCell: (p) => {
        const v = p.value
        if (v == null || v === '') return <Box sx={{ color: 'text.secondary' }}>—</Box>
        return String(v)
      },
    }))

    const actions: GridColDef<Organization> = {
      field: '__actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => { setEditing(p.row); setDialogOpen(true) }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {isSuperAdmin && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                color="error"
                onClick={async () => {
                  if (!window.confirm('Delete this organization?')) return
                  try {
                    await deleteOrganization(p.row._id)
                    setToast({ open: true, msg: 'Organization deleted', sev: 'success' })
                    await refresh()
                  } catch (e: unknown) {
                    const err = e as { response?: { data?: { message?: string } } }
                    setToast({ open: true, msg: err?.response?.data?.message ?? 'Delete failed', sev: 'error' })
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    }
    return [...dataCols, actions]
  }, [columns, isSuperAdmin, refresh])

  const closeDialog = () => { setDialogOpen(false); setEditing(null) }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%', minWidth: 0 }}>
      <AppCard
        title="Organizations"
        subtitle="Organization records. Columns and the Add/Edit form are driven by the Screen Configuration system (screen key: organization)."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditing(null); setDialogOpen(true) }}>
            Add Organization
          </Button>
        }
      >
        <AppDataGrid
          rows={items}
          columns={gridColumns}
          loading={loading}
          getRowId={(r) => r._id}
          paginationMode="server"
          sortingMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          pageSizeOptions={[10, 25, 50, 100]}
          filterMode="server"
          onFilterModelChange={(model: GridFilterModel) => {
            const next = (model.quickFilterValues ?? []).join(' ').trim()
            if (next !== search) {
              setSearch(next)
              setPaginationModel((m) => ({ ...m, page: 0 }))
            }
          }}
        />
      </AppCard>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Organization' : 'New Organization'}</DialogTitle>
        <DialogContent dividers>
          <DynamicForm
            screen="organization"
            initialValues={editing ? toFormValues(editing) : undefined}
            onCancel={closeDialog}
            submitLabel={editing ? 'Save' : 'Create'}
            onSubmit={async (values) => {
              try {
                if (editing) {
                  await updateOrganization(editing._id, { fields: values })
                  setToast({ open: true, msg: 'Organization updated', sev: 'success' })
                } else {
                  await createOrganization({ fields: values })
                  setToast({ open: true, msg: 'Organization created', sev: 'success' })
                }
                closeDialog()
                await refresh()
              } catch (e: unknown) {
                const err = e as { response?: { data?: { message?: string } } }
                setToast({ open: true, msg: err?.response?.data?.message ?? 'Save failed', sev: 'error' })
              }
            }}
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
