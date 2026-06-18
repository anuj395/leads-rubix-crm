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
import { Edit as EditIcon } from '@mui/icons-material'
import type { GridColDef } from '@mui/x-data-grid'
import { AppCard } from '@/components/ui/AppCard'
import { AppDataGrid } from '@/components/ui/AppDataGrid'
import { StatusBadge } from '@/components/ui/StatusBadge'

export interface WorkingDay {
  id: string
  day: string
  isWorking: boolean
  startHour: string
  endHour: string
  notes: string
}

const INITIAL_DAYS: WorkingDay[] = [
  { id: 'd1', day: 'Monday', isWorking: true, startHour: '09:00', endHour: '18:00', notes: 'Standard business hours' },
  { id: 'd2', day: 'Tuesday', isWorking: true, startHour: '09:00', endHour: '18:00', notes: 'Standard business hours' },
  { id: 'd3', day: 'Wednesday', isWorking: true, startHour: '09:00', endHour: '18:00', notes: 'Standard business hours' },
  { id: 'd4', day: 'Thursday', isWorking: true, startHour: '09:00', endHour: '18:00', notes: 'Standard business hours' },
  { id: 'd5', day: 'Friday', isWorking: true, startHour: '09:00', endHour: '18:00', notes: 'Standard business hours' },
  { id: 'd6', day: 'Saturday', isWorking: false, startHour: '10:00', endHour: '14:00', notes: 'Weekend standby support' },
  { id: 'd7', day: 'Sunday', isWorking: false, startHour: '—', endHour: '—', notes: 'Off-duty' },
]

export default function DaysConfigPage() {
  const [items, setItems] = useState<WorkingDay[]>(INITIAL_DAYS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<WorkingDay | null>(null)
  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  })

  // Form state
  const [form, setForm] = useState({
    isWorking: true,
    startHour: '09:00',
    endHour: '18:00',
    notes: '',
  })

  const openEditDialog = (day: WorkingDay) => {
    setEditing(day)
    setForm({
      isWorking: day.isWorking,
      startHour: day.startHour === '—' ? '09:00' : day.startHour,
      endHour: day.endHour === '—' ? '18:00' : day.endHour,
      notes: day.notes,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!editing) return

    setItems((prev) =>
      prev.map((d) =>
        d.id === editing.id
          ? {
              ...d,
              isWorking: form.isWorking,
              startHour: form.isWorking ? form.startHour : '—',
              endHour: form.isWorking ? form.endHour : '—',
              notes: form.notes,
            }
          : d,
      ),
    )
    setToast({ open: true, msg: `${editing.day} configuration updated`, sev: 'success' })
    setDialogOpen(false)
  }

  const columns = useMemo<GridColDef<WorkingDay>[]>(
    () => [
      {
        field: 'day',
        headerName: 'Day of Week',
        flex: 1,
        minWidth: 140,
        renderCell: (p) => <Box sx={{ fontWeight: 600 }}>{p.value}</Box>,
      },
      {
        field: 'isWorking',
        headerName: 'Status',
        width: 150,
        renderCell: (p) => (
          <StatusBadge value={p.value ? 'Working' : 'Non-Working'} />
        ),
      },
      {
        field: 'hours',
        headerName: 'Business Hours',
        flex: 1,
        minWidth: 160,
        valueGetter: (_v, row) => {
          if (!row.isWorking && row.startHour === '—') return 'Closed'
          return `${row.startHour} - ${row.endHour}`
        },
      },
      { field: 'notes', headerName: 'Notes / Remarks', flex: 1.5, minWidth: 200 },
      {
        field: '__actions',
        headerName: 'Actions',
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Stack direction="row" spacing={0.5} sx={{ height: '100%', alignItems: 'center' }}>
            <Tooltip title="Configure Day">
              <IconButton size="small" onClick={() => openEditDialog(p.row)}>
                <EditIcon fontSize="small" />
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
        title="Weekly Working Days"
        subtitle="Configure standard business working days and operating hours for lead assignment SLAs."
        fullHeight
      >
        <AppDataGrid height="100%" rows={items} columns={columns} getRowId={(r) => r.id} />
      </AppCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Configure {editing?.day}</DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              pt: 1,
            }}
          >
            <TextField
              select
              fullWidth
              label="Working Status"
              value={form.isWorking ? 'true' : 'false'}
              onChange={(e) => setForm({ ...form, isWorking: e.target.value === 'true' })}
            >
              <MenuItem value="true">Working Day</MenuItem>
              <MenuItem value="false">Non-Working</MenuItem>
            </TextField>

            {form.isWorking && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  fullWidth
                  type="time"
                  label="Start Hour"
                  value={form.startHour}
                  onChange={(e) => setForm({ ...form, startHour: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  type="time"
                  label="End Hour"
                  value={form.endHour}
                  onChange={(e) => setForm({ ...form, endHour: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            )}

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
