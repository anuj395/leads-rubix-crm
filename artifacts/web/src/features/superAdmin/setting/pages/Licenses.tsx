import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import { StatusBadge } from '@/components/ui/StatusBadge'
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

export interface PricingPlan {
  id: string
  name: string
  costPerUser: number
  billingCycle: 'Monthly' | 'Yearly'
  maxLeads: string
  integrationsCount: string
  status: 'Active' | 'Deprecated'
  description: string
}

const INITIAL_PLANS: PricingPlan[] = [
  {
    id: 'plan_1',
    name: 'Basic Starter',
    costPerUser: 15,
    billingCycle: 'Monthly',
    maxLeads: '1,000 / mo',
    integrationsCount: '2 Integrations',
    status: 'Active',
    description: 'Perfect for small local agencies or solo agents.',
  },
  {
    id: 'plan_2',
    name: 'Business Pro',
    costPerUser: 35,
    billingCycle: 'Monthly',
    maxLeads: '10,000 / mo',
    integrationsCount: '5 Integrations',
    status: 'Active',
    description: 'Complete lead automation and WhatsApp integration for growing teams.',
  },
  {
    id: 'plan_3',
    name: 'Enterprise Scale',
    costPerUser: 75,
    billingCycle: 'Monthly',
    maxLeads: 'Unlimited',
    integrationsCount: 'All Integrations',
    status: 'Active',
    description: 'Dedicated support, custom field mappings, and advanced reporting dashboard.',
  },
  {
    id: 'plan_4',
    name: 'Legacy Basic',
    costPerUser: 9,
    billingCycle: 'Monthly',
    maxLeads: '500 / mo',
    integrationsCount: '1 Integration',
    status: 'Deprecated',
    description: 'Old starter plan. No longer sold to new tenants.',
  },
]

export default function LicensesPage() {
  const [items, setItems] = useState<PricingPlan[]>(INITIAL_PLANS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PricingPlan | null>(null)
  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  })

  // Form state
  const [form, setForm] = useState({
    name: '',
    costPerUser: 20,
    billingCycle: 'Monthly' as PricingPlan['billingCycle'],
    maxLeads: '5,000 / mo',
    integrationsCount: '3 Integrations',
    status: 'Active' as PricingPlan['status'],
    description: '',
  })

  const openAddDialog = () => {
    setEditing(null)
    setForm({
      name: '',
      costPerUser: 20,
      billingCycle: 'Monthly',
      maxLeads: '5,000 / mo',
      integrationsCount: '3 Integrations',
      status: 'Active',
      description: '',
    })
    setDialogOpen(true)
  }

  const openEditDialog = (plan: PricingPlan) => {
    setEditing(plan)
    setForm({
      name: plan.name,
      costPerUser: plan.costPerUser,
      billingCycle: plan.billingCycle,
      maxLeads: plan.maxLeads,
      integrationsCount: plan.integrationsCount,
      status: plan.status,
      description: plan.description,
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this pricing plan?')) {
      setItems((prev) => prev.filter((p) => p.id !== id))
      setToast({ open: true, msg: 'Pricing plan deleted successfully', sev: 'success' })
    }
  }

  const handleSave = () => {
    if (!form.name) {
      setToast({ open: true, msg: 'Plan Name is required', sev: 'error' })
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
      setToast({ open: true, msg: 'Pricing plan updated successfully', sev: 'success' })
    } else {
      const newPlan: PricingPlan = {
        id: `plan_${Date.now()}`,
        ...form,
      }
      setItems((prev) => [newPlan, ...prev])
      setToast({ open: true, msg: 'Pricing plan added successfully', sev: 'success' })
    }
    setDialogOpen(false)
  }

  const columns = useMemo<GridColDef<PricingPlan>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Plan Name',
        flex: 1.2,
        minWidth: 150,
        renderCell: (p) => <Box sx={{ fontWeight: 600 }}>{p.value}</Box>,
      },
      {
        field: 'costPerUser',
        headerName: 'User / Month',
        width: 130,
        renderCell: (p) => `$${p.value}`,
      },
      { field: 'billingCycle', headerName: 'Billing Cycle', width: 130 },
      { field: 'maxLeads', headerName: 'Leads SLA Limit', width: 140 },
      { field: 'integrationsCount', headerName: 'Included Integrations', width: 180 },
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
        title="Tenant License Costs Manager"
        subtitle="Manage available pricing tiers, billing cycle rules, and feature flags for client industries."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
            Add Plan
          </Button>
        }
        fullHeight
      >
        <AppDataGrid height="100%" rows={items} columns={columns} getRowId={(r) => r.id} />
      </AppCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Plan Config' : 'Add New Pricing Plan'}</DialogTitle>
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
                label="Plan Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                type="number"
                label="Cost Per User ($)"
                value={form.costPerUser}
                onChange={(e) => setForm({ ...form, costPerUser: parseInt(e.target.value) || 0 })}
              />
            </Box>
            <Box>
              <TextField
                select
                fullWidth
                label="Billing Cycle"
                value={form.billingCycle}
                onChange={(e) => setForm({ ...form, billingCycle: e.target.value as PricingPlan['billingCycle'] })}
              >
                <MenuItem value="Monthly">Monthly</MenuItem>
                <MenuItem value="Yearly">Yearly</MenuItem>
              </TextField>
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Max Leads / Month (e.g. 5,000 / mo)"
                value={form.maxLeads}
                onChange={(e) => setForm({ ...form, maxLeads: e.target.value })}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                label="Included Integrations (e.g. 3 Integrations)"
                value={form.integrationsCount}
                onChange={(e) => setForm({ ...form, integrationsCount: e.target.value })}
              />
            </Box>
            <Box sx={{ gridColumn: 'span 2' }}>
              <TextField
                select
                fullWidth
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as PricingPlan['status'] })}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Deprecated">Deprecated</MenuItem>
              </TextField>
            </Box>
            <Box sx={{ gridColumn: 'span 2' }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
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
