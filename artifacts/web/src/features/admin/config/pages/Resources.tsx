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
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Download as DownloadIcon, Link as LinkIcon } from '@mui/icons-material'
import type { GridColDef } from '@mui/x-data-grid'
import { AppCard } from '@/components/ui/AppCard'
import { AppDataGrid } from '@/components/ui/AppDataGrid'
import { StatusBadge } from '@/components/ui/StatusBadge'

export interface Resource {
  id: string
  name: string
  type: 'PDF' | 'DOCX' | 'PPTX' | 'MP4' | 'URL'
  size: string
  category: 'Marketing' | 'Product Specifications' | 'Training Material' | 'Legal & Contracts'
  updatedAt: string
  url: string
}

const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'r1',
    name: 'Bayview Estates Brochure 2026',
    type: 'PDF',
    size: '4.8 MB',
    category: 'Marketing',
    updatedAt: '2026-05-15',
    url: 'https://example.com/bayview-estates-brochure.pdf',
  },
  {
    id: 'r2',
    name: 'Downtown Plaza Floor Plans & Pricing',
    type: 'PDF',
    size: '12.4 MB',
    category: 'Product Specifications',
    updatedAt: '2026-06-01',
    url: 'https://example.com/downtown-plaza-floor-plans.pdf',
  },
  {
    id: 'r3',
    name: 'Sales Pitch Deck - Q2 Horizon Heights',
    type: 'PPTX',
    size: '8.2 MB',
    category: 'Marketing',
    updatedAt: '2026-05-20',
    url: 'https://example.com/horizon-heights-pitch-deck.pptx',
  },
  {
    id: 'r4',
    name: 'Lead Management System - Video Walkthrough',
    type: 'MP4',
    size: '85.0 MB',
    category: 'Training Material',
    updatedAt: '2026-04-10',
    url: 'https://example.com/lms-training-walkthrough.mp4',
  },
  {
    id: 'r5',
    name: 'Booking Agreement Standard Template',
    type: 'DOCX',
    size: '2.1 MB',
    category: 'Legal & Contracts',
    updatedAt: '2026-06-11',
    url: 'https://example.com/standard-booking-agreement.docx',
  },
]

export default function ResourcesPage() {
  const [items, setItems] = useState<Resource[]>(INITIAL_RESOURCES)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Resource | null>(null)
  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  })

  // Form state
  const [form, setForm] = useState({
    name: '',
    type: 'PDF' as Resource['type'],
    size: '1.5 MB',
    category: 'Marketing' as Resource['category'],
    url: 'https://',
  })

  const openAddDialog = () => {
    setEditing(null)
    setForm({
      name: '',
      type: 'PDF',
      size: '1.5 MB',
      category: 'Marketing',
      url: 'https://',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (res: Resource) => {
    setEditing(res)
    setForm({
      name: res.name,
      type: res.type,
      size: res.size,
      category: res.category,
      url: res.url,
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      setItems((prev) => prev.filter((r) => r.id !== id))
      setToast({ open: true, msg: 'Resource deleted successfully', sev: 'success' })
    }
  }

  const handleSave = () => {
    if (!form.name || !form.url) {
      setToast({ open: true, msg: 'Name and Resource URL are required', sev: 'error' })
      return
    }

    if (editing) {
      setItems((prev) =>
        prev.map((r) =>
          r.id === editing.id
            ? {
                ...r,
                ...form,
              }
            : r,
        ),
      )
      setToast({ open: true, msg: 'Resource updated successfully', sev: 'success' })
    } else {
      const newRes: Resource = {
        id: `r_${Date.now()}`,
        updatedAt: new Date().toISOString().split('T')[0],
        ...form,
      }
      setItems((prev) => [newRes, ...prev])
      setToast({ open: true, msg: 'Resource added successfully', sev: 'success' })
    }
    setDialogOpen(false)
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    setToast({ open: true, msg: 'Link copied to clipboard', sev: 'success' })
  }

  const columns = useMemo<GridColDef<Resource>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Resource Name',
        flex: 1.2,
        minWidth: 180,
        renderCell: (p) => <Box sx={{ fontWeight: 600 }}>{p.value}</Box>,
      },
      {
        field: 'type',
        headerName: 'File Type',
        width: 110,
        renderCell: (p) => <StatusBadge value={p.value} hideDot />,
      },
      { field: 'size', headerName: 'Size', width: 90 },
      {
        field: 'category',
        headerName: 'Category',
        flex: 1,
        minWidth: 150,
        renderCell: (p) => <StatusBadge value={p.value} hideDot />,
      },
      { field: 'updatedAt', headerName: 'Last Updated', width: 130 },
      {
        field: '__actions',
        headerName: 'Actions',
        width: 160,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Stack direction="row" spacing={0.5} sx={{ height: '100%', alignItems: 'center' }}>
            <Tooltip title="Download">
              <IconButton size="small" component="a" href={p.row.url} target="_blank" rel="noopener noreferrer">
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Copy Link">
              <IconButton size="small" onClick={() => handleCopyLink(p.row.url)}>
                <LinkIcon fontSize="small" />
              </IconButton>
            </Tooltip>
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
        title="Resources Library"
        subtitle="Access sales brochures, documents, legal templates, and marketing files."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
            Add Resource
          </Button>
        }
        fullHeight
      >
        <AppDataGrid height="100%" rows={items} columns={columns} getRowId={(r) => r.id} />
      </AppCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
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
                label="Resource Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Box>
            <Box>
              <TextField
                select
                fullWidth
                label="File Type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as Resource['type'] })}
              >
                <MenuItem value="PDF">PDF Document</MenuItem>
                <MenuItem value="DOCX">Word Document</MenuItem>
                <MenuItem value="PPTX">Powerpoint Presentation</MenuItem>
                <MenuItem value="MP4">Video File</MenuItem>
                <MenuItem value="URL">External URL</MenuItem>
              </TextField>
            </Box>
            <Box>
              <TextField
                fullWidth
                label="File Size (e.g. 2.4 MB)"
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
              />
            </Box>
            <Box sx={{ gridColumn: 'span 2' }}>
              <TextField
                select
                fullWidth
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Resource['category'] })}
              >
                <MenuItem value="Marketing">Marketing Brochure / Deck</MenuItem>
                <MenuItem value="Product Specifications">Product Specifications</MenuItem>
                <MenuItem value="Training Material">Training Material</MenuItem>
                <MenuItem value="Legal & Contracts">Legal & Contracts</MenuItem>
              </TextField>
            </Box>
            <Box sx={{ gridColumn: 'span 2' }}>
              <TextField
                fullWidth
                label="URL / Download Link"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                required
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
