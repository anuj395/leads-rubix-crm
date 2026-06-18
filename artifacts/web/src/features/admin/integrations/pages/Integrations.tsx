import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { Settings as SettingsIcon, Sync as SyncIcon } from '@mui/icons-material'
import type { GridColDef } from '@mui/x-data-grid'
import { AppCard } from '@/components/ui/AppCard'
import { AppDataGrid } from '@/components/ui/AppDataGrid'
import { StatusBadge } from '@/components/ui/StatusBadge'

export interface IntegrationApp {
  id: string
  name: string
  category: string
  status: 'Active' | 'Inactive'
  lastSynced: string
  description: string
  apiKey?: string
  clientId?: string
  syncInterval?: string
  webhookUrl?: string
}

const INITIAL_INTEGRATIONS: IntegrationApp[] = [
  {
    id: 'int_1',
    name: 'Facebook Lead Ads',
    category: 'Lead Generation',
    status: 'Active',
    lastSynced: '2 minutes ago',
    description: 'Capture leads directly from your Facebook Ads campaigns in real time.',
    apiKey: 'fb_live_9a2f1b8c3d...',
    clientId: '7849203817402',
    syncInterval: 'Real-time',
    webhookUrl: 'https://api.leadsrubix.com/api/v1/webhooks/facebook',
  },
  {
    id: 'int_2',
    name: 'Google Sheets Exporter',
    category: 'Data Storage',
    status: 'Active',
    lastSynced: '15 minutes ago',
    description: 'Automatically export qualified leads to designated Google Spreadsheets.',
    apiKey: 'gapi_sec_8d29a0e1c2...',
    clientId: 'sheets-sync-sheet-001',
    syncInterval: 'Every 15 minutes',
    webhookUrl: 'https://script.google.com/macros/s/AKfycbz.../exec',
  },
  {
    id: 'int_3',
    name: 'Salesforce CRM Sync',
    category: 'CRM Sync',
    status: 'Inactive',
    lastSynced: 'Never',
    description: 'Push closed bookings and verified lead contacts straight into your Salesforce pipeline.',
    apiKey: '',
    clientId: 'sf_client_sandbox_v2',
    syncInterval: 'Hourly',
    webhookUrl: 'https://login.salesforce.com/services/oauth2/token',
  },
  {
    id: 'int_4',
    name: 'HubSpot Integration',
    category: 'Marketing Automation',
    status: 'Inactive',
    lastSynced: 'Never',
    description: 'Synchronize marketing contacts and subscriber lists with HubSpot lists.',
    apiKey: '',
    clientId: '',
    syncInterval: 'Daily',
    webhookUrl: '',
  },
  {
    id: 'int_5',
    name: 'Slack Alerts',
    category: 'Notifications',
    status: 'Active',
    lastSynced: 'Just now',
    description: 'Send instant team notifications in designated channels when new leads are booked.',
    apiKey: 'xoxb-9283017263-827...',
    clientId: 'general-notifications',
    syncInterval: 'Instant',
    webhookUrl: 'https://hooks.slack.com/services/T000/B000/XXXX',
  },
  {
    id: 'int_6',
    name: 'Zapier Webhooks',
    category: 'Automation Broker',
    status: 'Active',
    lastSynced: '1 hour ago',
    description: 'Bridge lead events to over 5,000 external applications and workflows.',
    apiKey: 'zap_auth_token_90182',
    clientId: 'zapier_catch_hook_v1',
    syncInterval: 'Instant',
    webhookUrl: 'https://hooks.zapier.com/hooks/catch/12345/abcde/',
  },
]

export default function IntegrationsPage() {
  const [items, setItems] = useState<IntegrationApp[]>(INITIAL_INTEGRATIONS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<IntegrationApp | null>(null)
  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  })

  // Dialog Form state
  const [form, setForm] = useState({
    apiKey: '',
    clientId: '',
    syncInterval: 'Instant',
    webhookUrl: '',
  })

  const openConfigDialog = (integration: IntegrationApp) => {
    setEditing(integration)
    setForm({
      apiKey: integration.apiKey || '',
      clientId: integration.clientId || '',
      syncInterval: integration.syncInterval || 'Instant',
      webhookUrl: integration.webhookUrl || '',
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!editing) return

    setItems((prev) =>
      prev.map((item) =>
        item.id === editing.id
          ? {
               ...item,
               apiKey: form.apiKey,
               clientId: form.clientId,
               syncInterval: form.syncInterval,
               webhookUrl: form.webhookUrl,
               status: form.apiKey || form.webhookUrl ? 'Active' : item.status,
             }
          : item,
      ),
    )
    setToast({ open: true, msg: `${editing.name} configuration updated successfully`, sev: 'success' })
    setDialogOpen(false)
  }

  const handleToggleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active'
          setToast({
            open: true,
            msg: `${item.name} is now ${nextStatus}`,
            sev: 'success',
          })
          return { ...item, status: nextStatus }
        }
        return item
      }),
    )
  }

  const handleForceSync = (id: string, name: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, lastSynced: 'Just now' }
        }
        return item
      }),
    )
    setToast({ open: true, msg: `Triggered manual synchronization for ${name}`, sev: 'success' })
  }

  const columns = useMemo<GridColDef<IntegrationApp>[]>(
    () => [
      {
        field: 'name',
        headerName: 'Integration Name',
        flex: 1.2,
        minWidth: 180,
        renderCell: (p) => (
          <Box sx={{ display: 'flex', flexDirection: 'column', py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {p.value}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineClamp: 1, textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {p.row.description}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'category',
        headerName: 'Category',
        width: 160,
        renderCell: (p) => <StatusBadge value={p.value} />,
      },
      {
        field: 'lastSynced',
        headerName: 'Last Synced',
        width: 140,
        renderCell: (p) => (
          <Typography variant="body2" color="text.secondary">
            {p.value}
          </Typography>
        ),
      },
      {
        field: 'status',
        headerName: 'Connection Status',
        width: 170,
        renderCell: (p) => {
          const isActive = p.value === 'Active'
          return (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', height: '100%' }}>
              <Switch size="small" checked={isActive} onChange={() => handleToggleStatus(p.row.id)} />
              <StatusBadge value={p.value} />
            </Stack>
          )
        },
      },
      {
        field: '__actions',
        headerName: 'Actions',
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (p) => (
          <Stack direction="row" spacing={0.5} sx={{ height: '100%', alignItems: 'center' }}>
            <Tooltip title="Trigger Sync">
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  disabled={p.row.status !== 'Active'}
                  onClick={() => handleForceSync(p.row.id, p.row.name)}
                >
                  <SyncIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Configure Credentials">
              <IconButton size="small" onClick={() => openConfigDialog(p.row)}>
                <SettingsIcon fontSize="small" />
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
        title="Third-Party Integrations"
        subtitle="Manage and configure active data streams with external SaaS tools, advertising engines, and spreadsheet platforms."
        fullHeight
      >
        <AppDataGrid
          height="100%"
          rows={items}
          columns={columns}
          getRowId={(r) => r.id}
          rowHeight={65}
        />
      </AppCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure {editing?.name}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Enter authenticating credentials or endpoint destinations to configure this active CRM link.
            </Typography>

            <TextField
              fullWidth
              label="API Key / Auth Token"
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder="e.g. key_live_..."
            />

            <TextField
              fullWidth
              label="Client ID / App Account Identifier"
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              placeholder="e.g. client_abc123"
            />

            <TextField
              fullWidth
              label="Integration Webhook URL"
              value={form.webhookUrl}
              onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
              placeholder="https://hooks.yourdomain.com/..."
            />

            <TextField
              select
              fullWidth
              label="Data Sync Frequency"
              value={form.syncInterval}
              onChange={(e) => setForm({ ...form, syncInterval: e.target.value })}
              SelectProps={{ native: true }}
            >
              <option value="Real-time">Real-time / Instant</option>
              <option value="Every 15 minutes">Every 15 minutes</option>
              <option value="Hourly">Hourly</option>
              <option value="Daily">Daily</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save Configuration
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
