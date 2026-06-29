import { useMemo, useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import type { GridColDef } from '@mui/x-data-grid'
import { AppCard } from '@/components/ui/AppCard'
import { AppDataGrid } from '@/components/ui/AppDataGrid'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { api } from '@/services/api'
import { listOrganizationsPaged, type Organization } from '@/services/organizationsService'
import { getResources } from '@/services/resourcesService'
import { resolveScreen, type ResolvedScreen, type ResolvedFormField } from '@/services/screenAdminService'

export interface Project {
  id: string
  project_id?: string
  project_name: string
  developer_name: string
  address: string
  rera_link: string
  walkthrough_link: string
  property_type: string
  property_stage: string
  project_status: 'Launched' | 'Pre Launch' | 'Intermediate Occupation'
  status: 'ACTIVE' | 'INACTIVE'
  organization_id?: string
  organization_name?: string
  createdAt?: string
}

const PROPERTY_STATUS_OPTIONS = [
  { label: 'Launched', value: 'Launched' },
  { label: 'Pre Launch', value: 'Pre Launch' },
  { label: 'Intermediate Occupation', value: 'Intermediate Occupation' }
]

export default function ProjectsListPage() {
  const [items, setItems] = useState<Project[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [propertyTypes, setPropertyTypes] = useState<any[]>([])
  const [propertyStages, setPropertyStages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [resolvedScreen, setResolvedScreen] = useState<ResolvedScreen | null>(null)
  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  })

  // Form state
  const [form, setForm] = useState({
    organization_id: '',
    project_name: '',
    developer_name: '',
    address: '',
    rera_link: '',
    walkthrough_link: '',
    property_type: '',
    property_stage: '',
    project_status: 'Launched' as Project['project_status'],
    status: 'ACTIVE' as Project['status'],
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [resProjects, resOrgs, resolved] = await Promise.all([
        api.get('/resources/resource_projects?all=true'),
        listOrganizationsPaged({ page: 0, pageSize: 200 }),
        resolveScreen({ screen_key: 'config_projects' })
      ])
      setItems(resProjects.data || [])
      setOrganizations(resOrgs.items || [])
      setResolvedScreen(resolved)
    } catch (e: any) {
      setToast({
        open: true,
        msg: e?.response?.data?.message || 'Failed to load projects catalog',
        sev: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Resolve dynamic options when organization selection changes in form
  useEffect(() => {
    if (!form.organization_id) {
      setPropertyTypes([])
      setPropertyStages([])
      return
    }

    void (async () => {
      try {
        const [types, stages] = await Promise.all([
          getResources('resource_property_types', form.organization_id),
          getResources('resource_property_stages', form.organization_id)
        ])
        setPropertyTypes(types)
        setPropertyStages(stages)
      } catch (e) {
        console.error('Failed to load organization custom stages/types', e)
      }
    })()
  }, [form.organization_id])

  const openAddDialog = () => {
    setEditing(null)
    setForm({
      organization_id: '',
      project_name: '',
      developer_name: '',
      address: '',
      rera_link: '',
      walkthrough_link: '',
      property_type: '',
      property_stage: '',
      project_status: 'Launched',
      status: 'ACTIVE',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (proj: Project) => {
    setEditing(proj)
    setForm({
      organization_id: proj.organization_id || '',
      project_name: proj.project_name || '',
      developer_name: proj.developer_name || '',
      address: proj.address || '',
      rera_link: proj.rera_link || '',
      walkthrough_link: proj.walkthrough_link || '',
      property_type: proj.property_type || '',
      property_stage: proj.property_stage || '',
      project_status: proj.project_status || 'Launched',
      status: proj.status || 'ACTIVE',
    })
    setDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setDeleteConfirmOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/resources/resource_projects/${id}`)
      setToast({ open: true, msg: 'Project deleted successfully', sev: 'success' })
      loadData()
    } catch (e: any) {
      setToast({ open: true, msg: e?.response?.data?.message || 'Failed to delete project', sev: 'error' })
    }
  }

  const handleSave = async () => {
    if (!form.organization_id) {
      setToast({ open: true, msg: 'Organization selection is required', sev: 'error' })
      return
    }
    if (!form.project_name || !form.developer_name) {
      setToast({ open: true, msg: 'Developer Name and Project Name are required', sev: 'error' })
      return
    }

    try {
      if (editing) {
        await api.put(`/resources/resource_projects/${editing.id}`, form)
        setToast({ open: true, msg: 'Project updated successfully', sev: 'success' })
      } else {
        await api.post('/resources/resource_projects', form)
        setToast({ open: true, msg: 'Project created successfully', sev: 'success' })
      }
      setDialogOpen(false)
      loadData()
    } catch (e: any) {
      setToast({ open: true, msg: e?.response?.data?.message || 'Failed to save project', sev: 'error' })
    }
  }

  const columns = useMemo<GridColDef<Project>[]>(() => {
    if (!resolvedScreen) return []

    const cols: GridColDef<Project>[] = resolvedScreen.table_headers.map((header) => {
      const col: GridColDef<Project> = {
        field: header.key as keyof Project,
        headerName: header.label,
        flex: 1,
        minWidth: 120,
        sortable: header.sortable,
      }

      if (header.key === 'organization_id') {
        col.field = 'organization_name' as any
        col.flex = 1.2
        col.minWidth = 160
        col.renderCell = (p) => <Box sx={{ fontWeight: 600 }}>{p.value || <em>Global</em>}</Box>
      } else if (header.key === 'project_name') {
        col.flex = 1.2
        col.minWidth = 160
        col.renderCell = (p) => <Box sx={{ fontWeight: 600 }}>{p.value}</Box>
      } else if (header.key === 'developer_name') {
        col.flex = 1.2
        col.minWidth = 150
      } else if (header.key === 'property_type') {
        col.width = 140
      } else if (header.key === 'property_stage') {
        col.width = 140
      } else if (header.key === 'project_status') {
        col.width = 160
        col.renderCell = (p) => <StatusBadge value={p.value} />
      } else if (header.key === 'address') {
        col.flex = 1.2
        col.minWidth = 160
      } else if (header.key === 'rera_link') {
        col.width = 140
        col.renderCell = (p) => p.value ? <a href={p.value} target="_blank" rel="noreferrer" style={{ color: '#1976d2', textDecoration: 'none' }}>View Link</a> : <em>N/A</em>
      } else if (header.key === 'walkthrough_link') {
        col.width = 150
        col.renderCell = (p) => p.value ? <a href={p.value} target="_blank" rel="noreferrer" style={{ color: '#1976d2', textDecoration: 'none' }}>View Link</a> : <em>N/A</em>
      } else if (header.key === 'status') {
        col.width = 100
        col.renderCell = (p) => (
          <Chip
            label={p.value}
            size="small"
            color={p.value === 'ACTIVE' ? 'success' : 'default'}
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />
        )
      } else if (header.key === 'createdAt') {
        col.width = 130
        col.renderCell = (p) => p.value ? new Date(p.value).toLocaleDateString() : ''
      }

      return col
    })

    cols.push({
      field: '__actions' as any,
      headerName: 'Actions',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5} sx={{ height: '100%', alignItems: 'center' }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEditDialog(p.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDeleteClick(p.row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    })

    return cols
  }, [resolvedScreen, items])

  const renderField = (field: ResolvedFormField) => {
    if (field.key === 'organization_id') {
      return (
        <TextField
          key={field.key}
          select
          fullWidth
          label={field.label}
          value={form.organization_id}
          onChange={(e) => setForm(prev => ({ ...prev, organization_id: e.target.value }))}
          required={field.required}
        >
          {organizations.map((org) => (
            <MenuItem key={org._id || String(org.organization_id || '')} value={String(org.organization_id || '')}>
              {String(org.name || org.organization_id || '')}
            </MenuItem>
          ))}
        </TextField>
      )
    }

    if (field.key === 'developer_name') {
      return (
        <TextField
          key={field.key}
          fullWidth
          label={field.label}
          value={form.developer_name}
          onChange={(e) => setForm(prev => ({ ...prev, developer_name: e.target.value }))}
          required={field.required}
        />
      )
    }

    if (field.key === 'project_name') {
      return (
        <TextField
          key={field.key}
          fullWidth
          label={field.label}
          value={form.project_name}
          onChange={(e) => setForm(prev => ({ ...prev, project_name: e.target.value }))}
          required={field.required}
        />
      )
    }

    if (field.key === 'property_type') {
      return (
        <TextField
          key={field.key}
          select
          fullWidth
          label={field.label}
          value={form.property_type}
          onChange={(e) => setForm(prev => ({ ...prev, property_type: e.target.value }))}
          disabled={!form.organization_id}
          required={field.required}
        >
          {propertyTypes.map((t) => (
            <MenuItem key={t.id || t.name} value={t.name || t.value}>
              {t.name || t.value}
            </MenuItem>
          ))}
        </TextField>
      )
    }

    if (field.key === 'property_stage') {
      return (
        <TextField
          key={field.key}
          select
          fullWidth
          label={field.label}
          value={form.property_stage}
          onChange={(e) => setForm(prev => ({ ...prev, property_stage: e.target.value }))}
          disabled={!form.organization_id}
          required={field.required}
        >
          {propertyStages.map((s) => (
            <MenuItem key={s.id || s.name} value={s.name || s.value}>
              {s.name || s.value}
            </MenuItem>
          ))}
        </TextField>
      )
    }

    if (field.key === 'project_status') {
      return (
        <TextField
          key={field.key}
          select
          fullWidth
          label={field.label}
          value={form.project_status}
          onChange={(e) => setForm(prev => ({ ...prev, project_status: e.target.value as any }))}
          required={field.required}
        >
          {PROPERTY_STATUS_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      )
    }

    if (field.key === 'status') {
      return (
        <TextField
          key={field.key}
          select
          fullWidth
          label={field.label}
          value={form.status}
          onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as any }))}
          required={field.required}
        >
          <MenuItem value="ACTIVE">ACTIVE</MenuItem>
          <MenuItem value="INACTIVE">INACTIVE</MenuItem>
        </TextField>
      )
    }

    if (field.key === 'address') {
      return (
        <TextField
          key={field.key}
          fullWidth
          label={field.label}
          value={form.address}
          onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
          required={field.required}
        />
      )
    }

    if (field.key === 'rera_link') {
      return (
        <TextField
          key={field.key}
          fullWidth
          label={field.label}
          value={form.rera_link}
          onChange={(e) => setForm(prev => ({ ...prev, rera_link: e.target.value }))}
          required={field.required}
        />
      )
    }

    if (field.key === 'walkthrough_link') {
      return (
        <TextField
          key={field.key}
          fullWidth
          label={field.label}
          value={form.walkthrough_link}
          onChange={(e) => setForm(prev => ({ ...prev, walkthrough_link: e.target.value }))}
          required={field.required}
        />
      )
    }

    return (
      <TextField
        key={field.key}
        fullWidth
        label={field.label}
        value={form[field.key as keyof typeof form] || ''}
        onChange={(e) => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
        required={field.required}
      />
    )
  }

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        width: '100%',
        minWidth: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <AppCard
        title="Projects Master Catalog"
        subtitle="Catalog of properties and real estate developments (Super Admin View)."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
            Add Project
          </Button>
        }
        fullHeight
      >
        <Box sx={{ flexGrow: 1, minHeight: 0, position: 'relative' }}>
          {loading && (
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
              <LinearProgress />
            </Box>
          )}
          <AppDataGrid height="100%" rows={items} columns={columns} getRowId={(r) => r.id} />
        </Box>
      </AppCard>

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '750px'
          }
        }}
      >
        <DialogTitle>{editing ? 'Edit Project' : 'Add New Project'}</DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              pt: 1,
            }}
          >
            {(() => {
              const fields = resolvedScreen?.form_fields || []
              const renderedKeys = new Set<string>()

              return fields.map((field) => {
                if (renderedKeys.has(field.key)) return null

                if (field.key === 'developer_name') {
                  const sibling = fields.find(f => f.key === 'project_name')
                  if (sibling) {
                    renderedKeys.add('project_name')
                    return (
                      <Box key={field.key} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        {renderField(field)}
                        {renderField(sibling)}
                      </Box>
                    )
                  }
                }

                if (field.key === 'property_type') {
                  const sibling = fields.find(f => f.key === 'property_stage')
                  if (sibling) {
                    renderedKeys.add('property_stage')
                    return (
                      <Box key={field.key} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        {renderField(field)}
                        {renderField(sibling)}
                      </Box>
                    )
                  }
                }

                if (field.key === 'project_status') {
                  const sibling = fields.find(f => f.key === 'status')
                  if (sibling) {
                    renderedKeys.add('status')
                    return (
                      <Box key={field.key} sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
                        {renderField(field)}
                        {renderField(sibling)}
                      </Box>
                    )
                  }
                }

                if (field.key === 'rera_link') {
                  const sibling = fields.find(f => f.key === 'walkthrough_link')
                  if (sibling) {
                    renderedKeys.add('walkthrough_link')
                    return (
                      <Box key={field.key} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        {renderField(field)}
                        {renderField(sibling)}
                      </Box>
                    )
                  }
                }

                return renderField(field)
              })
            })()}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this project? This action cannot be undone.
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (deletingId) {
                handleDelete(deletingId);
              }
              setDeleteConfirmOpen(false);
            }}
            color="error"
            variant="contained"
          >
            Delete
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
