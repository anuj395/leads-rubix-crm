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

export interface Coupon {
  id: string
  code: string
  discountType: 'Percentage' | 'Fixed Amount'
  discountValue: number
  status: 'Active' | 'Expired' | 'Disabled'
  expiryDate: string
  usageLimit: number
  usageCount: number
}

const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'c1',
    code: 'WELCOME10',
    discountType: 'Percentage',
    discountValue: 10,
    status: 'Active',
    expiryDate: '2026-12-31',
    usageLimit: 500,
    usageCount: 120,
  },
  {
    id: 'c2',
    code: 'SUMMER50',
    discountType: 'Fixed Amount',
    discountValue: 50,
    status: 'Active',
    expiryDate: '2026-08-31',
    usageLimit: 200,
    usageCount: 45,
  },
  {
    id: 'c3',
    code: 'BLACKFRIDAY30',
    discountType: 'Percentage',
    discountValue: 30,
    status: 'Expired',
    expiryDate: '2025-11-30',
    usageLimit: 1000,
    usageCount: 850,
  },
  {
    id: 'c4',
    code: 'PARTNER20',
    discountType: 'Percentage',
    discountValue: 20,
    status: 'Disabled',
    expiryDate: '2026-10-15',
    usageLimit: 100,
    usageCount: 12,
  },
]

export default function CouponsPage() {
  const [items, setItems] = useState<Coupon[]>(INITIAL_COUPONS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  })

  // Form state
  const [form, setForm] = useState({
    code: '',
    discountType: 'Percentage' as Coupon['discountType'],
    discountValue: 10,
    status: 'Active' as Coupon['status'],
    expiryDate: '',
    usageLimit: 100,
    usageCount: 0,
  })

  const openAddDialog = () => {
    setEditing(null)
    setForm({
      code: '',
      discountType: 'Percentage',
      discountValue: 10,
      status: 'Active',
      expiryDate: '',
      usageLimit: 100,
      usageCount: 0,
    })
    setDialogOpen(true)
  }

  const openEditDialog = (coupon: Coupon) => {
    setEditing(coupon)
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      status: coupon.status,
      expiryDate: coupon.expiryDate,
      usageLimit: coupon.usageLimit,
      usageCount: coupon.usageCount,
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      setItems((prev) => prev.filter((c) => c.id !== id))
      setToast({ open: true, msg: 'Coupon deleted successfully', sev: 'success' })
    }
  }

  const handleSave = () => {
    if (!form.code || !form.expiryDate) {
      setToast({ open: true, msg: 'Code and Expiry Date are required', sev: 'error' })
      return
    }

    if (editing) {
      setItems((prev) =>
        prev.map((c) =>
          c.id === editing.id
            ? {
                ...c,
                ...form,
              }
            : c,
        ),
      )
      setToast({ open: true, msg: 'Coupon updated successfully', sev: 'success' })
    } else {
      const newCoupon: Coupon = {
        id: `coupon_${Date.now()}`,
        ...form,
      }
      setItems((prev) => [newCoupon, ...prev])
      setToast({ open: true, msg: 'Coupon added successfully', sev: 'success' })
    }
    setDialogOpen(false)
  }

  const columns = useMemo<GridColDef<Coupon>[]>(
    () => [
      {
        field: 'code',
        headerName: 'Coupon Code',
        flex: 1.2,
        minWidth: 150,
        renderCell: (p) => <Box sx={{ fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.5px' }}>{p.value}</Box>,
      },
      {
        field: 'discountValue',
        headerName: 'Discount',
        width: 140,
        renderCell: (p) => {
          const type = p.row.discountType
          return type === 'Percentage' ? `${p.value}% Off` : `$${p.value} Off`
        },
      },
      {
        field: 'discountType',
        headerName: 'Type',
        width: 140,
        renderCell: (p) => <StatusBadge value={p.value} hideDot />,
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: (p) => <StatusBadge value={p.value} />,
      },
      {
        field: 'expiryDate',
        headerName: 'Expiry Date',
        width: 140,
        renderCell: (p) => new Date(p.value as string).toLocaleDateString(),
      },
      {
        field: 'redemptions',
        headerName: 'Redemptions',
        width: 160,
        valueGetter: (_v, row) => `${row.usageCount} / ${row.usageLimit}`,
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
        title="Discount Coupons Catalog"
        subtitle="Manage promotional discount codes, subscription price cuts, and coupon active status (Super Admin View)."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
            Add Coupon
          </Button>
        }
        fullHeight
      >
        <AppDataGrid height="100%" rows={items} columns={columns} getRowId={(r) => r.id} />
      </AppCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Coupon Config' : 'Add New Coupon Code'}</DialogTitle>
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
                label="Coupon Code (e.g. SAVE20)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                required
              />
            </Box>
            <Box>
              <TextField
                select
                fullWidth
                label="Discount Type"
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value as Coupon['discountType'] })}
              >
                <MenuItem value="Percentage">Percentage (%)</MenuItem>
                <MenuItem value="Fixed Amount">Fixed Amount ($)</MenuItem>
              </TextField>
            </Box>
            <Box>
              <TextField
                fullWidth
                type="number"
                label="Discount Value"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: parseFloat(e.target.value) || 0 })}
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                type="date"
                label="Expiry Date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Box>
            <Box>
              <TextField
                fullWidth
                type="number"
                label="Usage Limit"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: parseInt(e.target.value) || 100 })}
              />
            </Box>
            <Box sx={{ gridColumn: 'span 2' }}>
              <TextField
                select
                fullWidth
                label="Status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Coupon['status'] })}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Expired">Expired</MenuItem>
                <MenuItem value="Disabled">Disabled</MenuItem>
              </TextField>
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
