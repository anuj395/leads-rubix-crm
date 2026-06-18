import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { GridColDef } from '@mui/x-data-grid'
import { AppCard } from '@/components/ui/AppCard'
import { AppDataGrid } from '@/components/ui/AppDataGrid'
import { StatusBadge } from '@/components/ui/StatusBadge'

export interface WhatsappLog {
  id: string
  recipient: string
  message: string
  status: 'Sent' | 'Delivered' | 'Read' | 'Failed'
  timestamp: string
}

const INITIAL_LOGS: WhatsappLog[] = [
  {
    id: 'w1',
    recipient: '+1-555-0101',
    message: 'Hello Alice! Welcome to Leads Rubix. Your callback request has been assigned to Sales Team.',
    status: 'Read',
    timestamp: '2026-06-13T10:30:00.000Z',
  },
  {
    id: 'w2',
    recipient: '+1-555-0102',
    message: 'Hi Robert! Showing confirmed for Downtown Plaza site visit on Monday at 2 PM. See you soon!',
    status: 'Delivered',
    timestamp: '2026-06-13T09:15:00.000Z',
  },
  {
    id: 'w3',
    recipient: '+1-555-0104',
    message: 'Hello Michael, your documents for Bayview Estates have been approved. Please check your email.',
    status: 'Sent',
    timestamp: '2026-06-13T08:00:00.000Z',
  },
  {
    id: 'w4',
    recipient: '+1-555-0105',
    message: 'Hi Jessica, we tried calling you regarding your commercial property inquiry. Please reply when free.',
    status: 'Failed',
    timestamp: '2026-06-12T17:45:00.000Z',
  },
]

export default function WhatsappApiPage() {
  const [logs, setLogs] = useState<WhatsappLog[]>(INITIAL_LOGS)
  const [isConnected, setIsConnected] = useState(true)
  const [phoneId, setPhoneId] = useState('109485763524')
  const [accessToken, setAccessToken] = useState('••••••••••••••••••••••••••••••••••••')
  const [newRecipient, setNewRecipient] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  })

  const handleConnect = () => {
    if (!phoneId || !accessToken) {
      setToast({ open: true, msg: 'Phone Number ID and Access Token are required', sev: 'error' })
      return
    }
    setIsConnected((prev) => !prev)
    setToast({
      open: true,
      msg: isConnected ? 'WhatsApp API disconnected' : 'WhatsApp API connected successfully',
      sev: 'success',
    })
  }

  const handleSendMessage = () => {
    if (!newRecipient || !newMessage) {
      setToast({ open: true, msg: 'Recipient Phone and Message are required', sev: 'error' })
      return
    }
    if (!isConnected) {
      setToast({ open: true, msg: 'Please connect WhatsApp API first', sev: 'error' })
      return
    }

    const newLog: WhatsappLog = {
      id: `w_${Date.now()}`,
      recipient: newRecipient,
      message: newMessage,
      status: 'Sent',
      timestamp: new Date().toISOString(),
    }

    setLogs((prev) => [newLog, ...prev])
    setNewRecipient('')
    setNewMessage('')
    setToast({ open: true, msg: 'Message sent successfully', sev: 'success' })
  }

  const columns = useMemo<GridColDef<WhatsappLog>[]>(
    () => [
      {
        field: 'recipient',
        headerName: 'Recipient Phone',
        width: 150,
        renderCell: (p) => <Box sx={{ fontWeight: 600 }}>{p.value}</Box>,
      },
      { field: 'message', headerName: 'Message Content', flex: 1.5, minWidth: 250 },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: (p) => <StatusBadge value={p.value} />,
      },
      {
        field: 'timestamp',
        headerName: 'Timestamp',
        width: 180,
        renderCell: (p) => new Date(p.value as string).toLocaleString(),
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
        gap: 3,
        overflowY: 'auto',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >
        <AppCard
          title="WhatsApp API Configuration"
          subtitle="Meta Cloud API Setup (Super Admin System View)"
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <StatusBadge value={isConnected ? 'Connected' : 'Disconnected'} />
              <Typography variant="body2" color="text.secondary">
                {isConnected ? 'Meta Cloud API v20.0 active' : 'API integration idle'}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Phone Number ID"
              value={phoneId}
              onChange={(e) => setPhoneId(e.target.value)}
              disabled={isConnected}
            />

            <TextField
              fullWidth
              type="password"
              label="Permanent Access Token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={isConnected}
            />

            <Button
              variant={isConnected ? 'outlined' : 'contained'}
              color={isConnected ? 'error' : 'primary'}
              onClick={handleConnect}
              sx={{ alignSelf: 'flex-start', mt: 1 }}
            >
              {isConnected ? 'Disconnect API' : 'Connect API'}
            </Button>
          </Box>
        </AppCard>

        <AppCard
          title="Send Test Message"
          subtitle="Manually trigger a template or custom WhatsApp message to verify connection."
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Recipient Phone (e.g. +15551234567)"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              placeholder="+15551234567"
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Message Body"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your WhatsApp notification message here..."
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handleSendMessage}
              disabled={!isConnected}
              sx={{ alignSelf: 'flex-start', mt: 1 }}
            >
              Send Message
            </Button>
          </Box>
        </AppCard>
      </Box>

      <AppCard title="WhatsApp Message Logs" subtitle="History of sent messages and delivery statuses." fullHeight>
        <Box sx={{ height: 400, width: '100%' }}>
          <AppDataGrid rows={logs} columns={columns} getRowId={(r) => r.id} />
        </Box>
      </AppCard>

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
