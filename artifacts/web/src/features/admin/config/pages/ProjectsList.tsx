import { useMemo, useState } from 'react'
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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import type { GridColDef } from '@mui/x-data-grid'
import { AppCard } from '@/components/ui/AppCard'
import { AppDataGrid } from '@/components/ui/AppDataGrid'
import { StatusBadge } from '@/components/ui/StatusBadge'

export interface Project {
  id: string
  name: string
  location: string
  type: string
  status: 'Planning' | 'Launching' | 'Under Construction' | 'Completed'
  units: number
  available: number
  priceRange: string
  completionDate: string
}

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Gateway Towers',
    location: 'Downtown Chicago, IL',
    type: 'Commercial',
    status: 'Under Construction',
    units: 120,
    available: 45,
    priceRange: '$300k - $750k',
    completionDate: 'Dec 2026',
  },
  {
    id: 'p2',
    name: 'Horizon Heights',
    location: 'Austin, TX',
    type: 'Residential',
    status: 'Launching',
    units: 80,
    available: 72,
    priceRange: '$250k - $550k',
    completionDate: 'Jun 2027',
  },
  {
    id: 'p3',
    name: 'Meadow Greens',
    location: 'Denver, CO',
    type: 'Residential',
    status: 'Completed',
    units: 250,
    available: 12,
    priceRange: '$180k - $400k',
    completionDate: 'Completed',
  },
  {
    id: 'p4',
    name: 'Bayview Estates',
    location: 'San Francisco, CA',
    type: 'Residential',
    status: 'Under Construction',
    units: 150,
    available: 55,
    priceRange: '$450k - $1.2M',
    completionDate: 'Oct 2026',
  },
  {
    id: 'p5',
    name: 'Downtown Plaza',
    location: 'New York, NY',
    type: 'Commercial',
    status: 'Completed',
    units: 95,
    available: 0,
    priceRange: '$600k - $2.5M',
    completionDate: 'Completed',
  },
  {
    id: 'p6',
    name: 'Lakeview Homes',
    location: 'Seattle, WA',
    type: 'Residential',
    status: 'Planning',
    units: 60,
    available: 60,
    priceRange: '$350k - $800k',
    completionDate: 'Mar 2028',
  },
]

export default function ProjectsListPage() {
  const [items, setItems] = useState<Project[]>(INITIAL_PROJECTS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  })

  // Form state
  const [form, setForm] = useState({
    name: '',
    location: '',
    type: 'Residential',
    status: 'Planning' as Project['status'],
    units: 100,
    available: 100,
    priceRange: '',
    completionDate: '',
  })

  const openAddDialog = () => {
    setEditing(null)
    setForm({
      name: '',
      location: '',
      type: 'Residential',
      status: 'Planning',
      units: 100,
      available: 100,
      priceRange: '',
      completionDate: '',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (proj: Project) => {
    setEditing(proj)
    setForm({
      name: proj.name,
      location: proj.location,
      type: proj.type,
      status: proj.status,
      units: proj.units,
      available: proj.available,
      priceRange: proj.priceRange,
      completionDate: proj.completionDate,
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setItems((prev) => prev.filter((p) => p.id !== id))
      setToast({ open: true, msg: 'Project deleted successfully', sev: 'success' })
    }
  }

  const handleSave = () => {
    if (!form.name || !form.location) {
      setToast({ open: true, msg: 'Name and Location are required', sev: 'error' })
      return
    }

    if (editing) {
      setItems((prev) =>
        prev.map((p) =>
          p.id === editing.id
            ? {
                ...p,
                ...form,
              }
            : p,
        ),
      )
      setToast({ open: true, msg: 'Project updated successfully', sev: 'success' })
    } else {
      const newProj: Project = {
        id: `p_${Date.now()}`,
        ...form,
      }
      setItems((prev) => [newProj, ...prev])
      setToast({ open: true, msg: 'Project added successfully', sev: 'success' })
    }
    setDialogOpen(false)
  }

  const columns = useMemo<GridColDef<Project>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Project Name',
        flex: 1.2,
        minWidth: 160,
        renderCell: (p) => <Box sx={{ fontWeight: 600 }}>{p.value}</Box>,
      },
      { field: 'location', headerName: 'Location', flex: 1.2, minWidth: 150 },
      { field: 'type', headerName: 'Type', width: 120 },
      {
        field: 'status',
        headerName: 'Status',
        width: 210,
        renderCell: (p) => <StatusBadge value={p.value} />,
      },
      { field: 'units', headerName: 'Total Units', type: 'number', width: 130 },
      { field: 'available', headerName: 'Available Units', type: 'number', width: 160 },
      { field: 'priceRange', headerName: 'Price Range', width: 130 },
      { field: 'completionDate', headerName: 'Est. Completion', width: 130 },
      {
        field: '__actions',
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
              <IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [],
  )

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
        title="Projects Catalog"
        subtitle="Catalog of properties, real estate developments, and sales units."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
            Add Project
          </Button>
        }
        fullHeight
      >
        <AppDataGrid height="100%" rows={items} columns={columns} getRowId={(r) => r.id} />
      </AppCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Project' : 'Add New Project'}</DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            <Box sx={{ gridColumn: 'span 2' }}>
              <TextField
                fullWidth
                label="Project Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Box>
            <Box sx={{ gridColumn: 'span 2' }}>
              <TextField
                fullWidth
                label="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
            </Box>
            <Box>
              <TextField
                select
                fullWidth
                label="Type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <MenuItem value="Residential">Residential</MenuItem>
                <MenuItem value="Commercial">Commercial</MenuItem>
                <MenuItem value="Mixed Use">Mixed Use</MenuItem>
              </TextField>
            </Box>
            <Box>
              <TextField
                select
                fullWidth
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Project['status'] })}
              >
                <MenuItem value="Planning">Planning</MenuItem>
                <MenuItem value="Launching">Launching</MenuItem>
                <MenuItem value="Under Construction">Under Construction</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </TextField>
            </Box>
            <Box>
              <TextField
                fullWidth
                type="number"
                label="Total Units"
                value={form.units}
                onChange={(e) => setForm({ ...form, units: parseInt(e.target.value) || 0 })}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                type="number"
                label="Available Units"
                value={form.available}
                onChange={(e) => setForm({ ...form, available: parseInt(e.target.value) || 0 })}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Price Range (e.g. $250k - $500k)"
                value={form.priceRange}
                onChange={(e) => setForm({ ...form, priceRange: e.target.value })}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Est. Completion Date"
                value={form.completionDate}
                onChange={(e) => setForm({ ...form, completionDate: e.target.value })}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
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
