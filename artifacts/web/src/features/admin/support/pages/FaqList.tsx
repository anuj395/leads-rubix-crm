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
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import type { GridColDef } from '@mui/x-data-grid'
import { AppCard } from '@/components/ui/AppCard'
import { AppDataGrid } from '@/components/ui/AppDataGrid'
import { StatusBadge } from '@/components/ui/StatusBadge'

export interface FaqItem {
  id: string
  question: string
  answer: string
  category: 'Lead Management' | 'Billing & Subscription' | 'WhatsApp Integration' | 'Security & Profile'
  status: 'Active' | 'Draft'
}

const INITIAL_FAQS: FaqItem[] = [
  {
    id: 'f1',
    question: 'How do I add a new lead contact to the CRM?',
    answer: 'Navigate to the Leads -> Contacts List section and click on the "Add Contact" button. A dynamic form will appear requesting customer name, contact details, and project interest. These fields are managed dynamically by the Super Admin via the Screen Configuration system.',
    category: 'Lead Management',
    status: 'Active',
  },
  {
    id: 'f2',
    question: 'How does the WhatsApp Cloud API automation work?',
    answer: 'Once you configure your permanent access token and phone number ID under WhatsApp API Settings, you can trigger automated template notifications. Every time a new lead is captured via webhooks, the system will auto-send a greeting or callback confirmation to the customer.',
    category: 'WhatsApp Integration',
    status: 'Active',
  },
  {
    id: 'f3',
    question: 'Where can I update my billing or view subscription details?',
    answer: 'Administrators can navigate to Account -> Subscription Details to view active pricing plans, user seat counts, next billing dates, and features included. For custom upgrades, contact the system Super Admin.',
    category: 'Billing & Subscription',
    status: 'Active',
  },
  {
    id: 'f4',
    question: 'How can I change my login password?',
    answer: 'Go to Account -> Update Password. You will need to enter your current password, type in your new secure password, and confirm it. We recommend using passwords at least 8 characters long with uppercase and numbers.',
    category: 'Security & Profile',
    status: 'Active',
  },
]

export default function FaqListPage() {
  const [items, setItems] = useState<FaqItem[]>(INITIAL_FAQS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FaqItem | null>(null)
  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  })

  // Form state
  const [form, setForm] = useState({
    question: '',
    answer: '',
    category: 'Lead Management' as FaqItem['category'],
    status: 'Active' as FaqItem['status'],
  })

  const openAddDialog = () => {
    setEditing(null)
    setForm({
      question: '',
      answer: '',
      category: 'Lead Management',
      status: 'Active',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (faq: FaqItem) => {
    setEditing(faq)
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      status: faq.status,
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      setItems((prev) => prev.filter((f) => f.id !== id))
      setToast({ open: true, msg: 'FAQ deleted successfully', sev: 'success' })
    }
  }

  const handleSave = () => {
    if (!form.question || !form.answer) {
      setToast({ open: true, msg: 'Question and Answer are required', sev: 'error' })
      return
    }

    if (editing) {
      setItems((prev) =>
        prev.map((f) =>
          f.id === editing.id
            ? {
                ...f,
                ...form,
              }
            : f,
        ),
      )
      setToast({ open: true, msg: 'FAQ updated successfully', sev: 'success' })
    } else {
      const newFaq: FaqItem = {
        id: `faq_${Date.now()}`,
        ...form,
      }
      setItems((prev) => [newFaq, ...prev])
      setToast({ open: true, msg: 'FAQ published successfully', sev: 'success' })
    }
    setDialogOpen(false)
  }

  const columns = useMemo<GridColDef<FaqItem>[]>(
    () => [
      {
        field: 'question',
        headerName: 'Question',
        flex: 1.5,
        minWidth: 220,
        renderCell: (p) => <Box sx={{ fontWeight: 600 }}>{p.value}</Box>,
      },
      {
        field: 'category',
        headerName: 'Category',
        width: 180,
        renderCell: (p) => <StatusBadge value={p.value} hideDot />,
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: (p) => <StatusBadge value={p.value} />,
      },
      {
        field: '__actions',
        headerName: 'Actions',
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Stack direction="row" spacing={0.5} sx={{ height: '100%', alignItems: 'center' }}>
            <Tooltip title="Edit FAQ">
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

  const activeFaqs = useMemo(() => items.filter((f) => f.status === 'Active'), [items])

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        width: '100%',
        minWidth: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        overflowY: 'auto',
      }}
    >
      <AppCard title="Frequently Asked Questions (FAQ)" subtitle="Quick accordion viewer of the most commonly asked queries.">
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {activeFaqs.map((faq) => (
            <Accordion key={faq.id} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" fontWeight={600}>
                  [{faq.category}] {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.6 }}>
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </AppCard>

      <AppCard
        title="FAQ Articles Manager"
        subtitle="Manage frequently asked questions and categorical descriptions."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
            Add FAQ
          </Button>
        }
        fullHeight
      >
        <Box sx={{ height: 350, width: '100%' }}>
          <AppDataGrid rows={items} columns={columns} getRowId={(r) => r.id} />
        </Box>
      </AppCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit FAQ Item' : 'Create New FAQ'}</DialogTitle>
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
              label="Question"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              required
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                select
                fullWidth
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as FaqItem['category'] })}
              >
                <MenuItem value="Lead Management">Lead Management</MenuItem>
                <MenuItem value="Billing & Subscription">Billing & Subscription</MenuItem>
                <MenuItem value="WhatsApp Integration">WhatsApp Integration</MenuItem>
                <MenuItem value="Security & Profile">Security & Profile</MenuItem>
              </TextField>

              <TextField
                select
                fullWidth
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as FaqItem['status'] })}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Draft">Draft</MenuItem>
              </TextField>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Answer Details"
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              required
            />
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
