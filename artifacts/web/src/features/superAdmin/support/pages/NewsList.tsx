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
import Typography from '@mui/material/Typography'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material'
import type { GridColDef } from '@mui/x-data-grid'
import { AppCard } from '@/components/ui/AppCard'
import { AppDataGrid } from '@/components/ui/AppDataGrid'
import { StatusBadge } from '@/components/ui/StatusBadge'

export interface NewsArticle {
  id: string
  title: string
  category: 'System Alert' | 'Product Update' | 'Announcement' | 'Industry News'
  publishedAt: string
  author: string
  status: 'Published' | 'Draft'
  content: string
}

const INITIAL_NEWS: NewsArticle[] = [
  {
    id: 'n1',
    title: 'Scheduled System Maintenance - June 15',
    category: 'System Alert',
    publishedAt: '2026-06-12',
    author: 'IT Ops Team',
    status: 'Published',
    content: 'We will be performing scheduled database optimizations on June 15, 2026, from 02:00 AM to 04:00 AM EST. During this window, the CRM dashboard and API webhook endpoints may experience intermittent latency of up to 5 minutes. No data loss is expected.',
  },
  {
    id: 'n2',
    title: 'WhatsApp Meta Cloud Integration is Live',
    category: 'Product Update',
    publishedAt: '2026-06-10',
    author: 'Product Team',
    status: 'Published',
    content: 'You can now configure your own Meta Cloud permanent access tokens directly from the WhatsApp API Configuration page under Settings. Enable instant automated messaging for newly captured inbound leads and assign chat responsibilities directly to sales reps.',
  },
  {
    id: 'n3',
    title: 'Quarterly Sales Kickoff & New Lead Routing Rules',
    category: 'Announcement',
    publishedAt: '2026-06-05',
    author: 'Sales Operations',
    status: 'Published',
    content: 'Starting next Monday, lead routing rules are updated to ensure high-priority inbound leads are automatically routed to the top performing agents on the Alpha Team. Please review your designated active working hours to avoid SLA timeouts.',
  },
  {
    id: 'n4',
    title: 'Upcoming Real Estate Market Expansion Catalog',
    category: 'Industry News',
    publishedAt: '2026-06-01',
    author: 'Research Desk',
    status: 'Draft',
    content: 'An analysis of residential and commercial property conversion metrics shows that residential apartment interest has spiked by 24% month-over-month. We will soon launch a new project catalog mapping detailed area conversions for the Austin and SF suburbs.',
  },
]

export default function NewsListPage() {
  const [items, setItems] = useState<NewsArticle[]>(INITIAL_NEWS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [editing, setEditing] = useState<NewsArticle | null>(null)
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  })

  // Form state
  const [form, setForm] = useState({
    title: '',
    category: 'Announcement' as NewsArticle['category'],
    author: 'Super Admin',
    status: 'Published' as NewsArticle['status'],
    content: '',
  })

  const openAddDialog = () => {
    setEditing(null)
    setForm({
      title: '',
      category: 'Announcement',
      author: 'Super Admin',
      status: 'Published',
      content: '',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (art: NewsArticle) => {
    setEditing(art)
    setForm({
      title: art.title,
      category: art.category,
      author: art.author,
      status: art.status,
      content: art.content,
    })
    setDialogOpen(true)
  }

  const openViewDialog = (art: NewsArticle) => {
    setSelectedNews(art)
    setViewOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setDeleteConfirmOpen(true)
  }

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id))
    setToast({ open: true, msg: 'Article deleted successfully', sev: 'success' })
  }

  const handleSave = () => {
    if (!form.title || !form.content) {
      setToast({ open: true, msg: 'Title and Content are required', sev: 'error' })
      return
    }

    if (editing) {
      setItems((prev) =>
        prev.map((n) =>
          n.id === editing.id
            ? {
                ...n,
                ...form,
              }
            : n,
        ),
      )
      setToast({ open: true, msg: 'Article updated successfully', sev: 'success' })
    } else {
      const newArt: NewsArticle = {
        id: `news_${Date.now()}`,
        publishedAt: new Date().toISOString().split('T')[0],
        ...form,
      }
      setItems((prev) => [newArt, ...prev])
      setToast({ open: true, msg: 'Article published successfully', sev: 'success' })
    }
    setDialogOpen(false)
  }

  const columns = useMemo<GridColDef<NewsArticle>[]>(
    () => [
      {
        field: 'title',
        headerName: 'Title',
        flex: 1.5,
        minWidth: 220,
        renderCell: (p) => <Box sx={{ fontWeight: 600 }}>{p.value}</Box>,
      },
      {
        field: 'category',
        headerName: 'Category',
        width: 150,
        renderCell: (p) => <StatusBadge value={p.value} hideDot />,
      },
      { field: 'publishedAt', headerName: 'Publish Date', width: 130 },
      { field: 'author', headerName: 'Publisher', width: 140 },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: (p) => <StatusBadge value={p.value} />,
      },
      {
        field: '__actions',
        headerName: 'Actions',
        width: 130,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Stack direction="row" spacing={0.5} sx={{ height: '100%', alignItems: 'center' }}>
            <Tooltip title="View Announcement">
              <IconButton size="small" onClick={() => openViewDialog(p.row)}>
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
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
        title="Company News & Announcements Master"
        subtitle="Manage news articles and announcements (Super Admin View)."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
            Publish Article
          </Button>
        }
        fullHeight
      >
        <AppDataGrid height="100%" rows={items} columns={columns} getRowId={(r) => r.id} />
      </AppCard>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '750px',
          },
        }}
      >
        <DialogTitle>{editing ? 'Edit Announcement' : 'Publish New Announcement'}</DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              pt: 1,
            }}
          >
            <TextField
              fullWidth
              label="Article Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
              <TextField
                select
                fullWidth
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as NewsArticle['category'] })}
              >
                <MenuItem value="System Alert">System Alert</MenuItem>
                <MenuItem value="Product Update">Product Update</MenuItem>
                <MenuItem value="Announcement">Announcement</MenuItem>
                <MenuItem value="Industry News">Industry News</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Author / Publisher"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              />

              <TextField
                select
                fullWidth
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as NewsArticle['status'] })}
              >
                <MenuItem value="Published">Published</MenuItem>
                <MenuItem value="Draft">Draft</MenuItem>
              </TextField>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={6}
              label="Article Content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Publish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reader View Dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        {selectedNews && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Typography variant="h5" fontWeight={700}>
                {selectedNews.title}
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                <StatusBadge value={selectedNews.category} hideDot />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                  Published: {new Date(selectedNews.publishedAt).toLocaleDateString()} by {selectedNews.author}
                </Typography>
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'text.primary' }}>
                {selectedNews.content}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setViewOpen(false)} variant="contained">
                Close Reader
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this announcement? This action cannot be undone.
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (deletingId) {
                handleDelete(deletingId)
              }
              setDeleteConfirmOpen(false)
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
