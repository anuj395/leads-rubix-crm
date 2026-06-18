import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import CallMadeIcon from '@mui/icons-material/CallMade'
import CallReceivedIcon from '@mui/icons-material/CallReceived'
import CallMissedIcon from '@mui/icons-material/CallMissed'
import PhoneCallbackIcon from '@mui/icons-material/PhoneCallback'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import type { GridColDef } from '@mui/x-data-grid'
import { AppCard } from '@/components/ui/AppCard'
import { AppDataGrid } from '@/components/ui/AppDataGrid'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface CallLog {
  id: string
  customer_name: string
  phone: string
  agent: string
  direction: 'Inbound' | 'Outbound'
  duration: string
  status: 'Answered' | 'Missed' | 'No Answer' | 'Busy'
  timestamp: string
  notes: string
}

const MOCK_CALL_LOGS: CallLog[] = [
  {
    id: '1',
    customer_name: 'John Doe',
    phone: '+1-555-0199',
    agent: 'Sarah Connor',
    direction: 'Inbound',
    duration: '2m 45s',
    status: 'Answered',
    timestamp: '2026-06-13 15:30',
    notes: 'Inquired about Bayview Estates pricing. Sent brochure.',
  },
  {
    id: '2',
    customer_name: 'Jane Smith',
    phone: '+1-555-0188',
    agent: 'Michael Scott',
    direction: 'Outbound',
    duration: '5m 12s',
    status: 'Answered',
    timestamp: '2026-06-13 14:15',
    notes: 'Follow-up regarding office layouts. Requested pricing sheet.',
  },
  {
    id: '3',
    customer_name: 'William Vance',
    phone: '+1-555-0177',
    agent: 'Dwight Schrute',
    direction: 'Inbound',
    duration: '0s',
    status: 'Missed',
    timestamp: '2026-06-13 12:45',
    notes: 'Missed call. Callback ticket created.',
  },
  {
    id: '4',
    customer_name: 'Bruce Wayne',
    phone: '+1-555-0166',
    agent: 'Sarah Connor',
    direction: 'Outbound',
    duration: '1m 20s',
    status: 'Busy',
    timestamp: '2026-06-13 11:20',
    notes: 'Line busy. Will retry later.',
  },
  {
    id: '5',
    customer_name: 'Clark Kent',
    phone: '+1-555-0155',
    agent: 'Jim Halpert',
    direction: 'Inbound',
    duration: '3m 10s',
    status: 'Answered',
    timestamp: '2026-06-13 10:05',
    notes: 'Scheduled site visit for next Tuesday at 10 AM.',
  },
  {
    id: '6',
    customer_name: 'Diana Prince',
    phone: '+1-555-0144',
    agent: 'Pam Beesly',
    direction: 'Outbound',
    duration: '0s',
    status: 'No Answer',
    timestamp: '2026-06-13 09:15',
    notes: 'No answer. Left voicemail.',
  },
]

export default function CallLogsListPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filteredLogs = useMemo(() => {
    return MOCK_CALL_LOGS.filter((log) => {
      const matchSearch =
        log.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        log.phone.includes(search) ||
        log.agent.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'All' || log.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter])

  const stats = useMemo(() => {
    const total = MOCK_CALL_LOGS.length
    const answered = MOCK_CALL_LOGS.filter((l) => l.status === 'Answered').length
    const missed = MOCK_CALL_LOGS.filter((l) => l.status === 'Missed').length
    const inbound = MOCK_CALL_LOGS.filter((l) => l.direction === 'Inbound').length
    const outbound = MOCK_CALL_LOGS.filter((l) => l.direction === 'Outbound').length
    return { total, answered, missed, inbound, outbound }
  }, [])

  const columns = useMemo<GridColDef<CallLog>[]>(() => [
    {
      field: 'direction',
      headerName: 'Dir',
      width: 80,
      renderCell: (params) => {
        const isI = params.value === 'Inbound'
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            {isI ? (
              <CallReceivedIcon sx={{ color: 'success.main', fontSize: '1.1rem' }} />
            ) : (
              <CallMadeIcon sx={{ color: 'secondary.main', fontSize: '1.1rem' }} />
            )}
          </Box>
        )
      },
    },
    {
      field: 'customer_name',
      headerName: 'Customer Name',
      flex: 1.2,
      minWidth: 160,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {params.value}
        </Typography>
      ),
    },
    { field: 'phone', headerName: 'Phone Number', flex: 1, minWidth: 130 },
    {
      field: 'agent',
      headerName: 'Agent',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ height: '100%' }}>
          <SupportAgentIcon sx={{ fontSize: '1.05rem', color: 'text.secondary' }} />
          <Typography variant="body2">{params.value}</Typography>
        </Stack>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => <StatusBadge value={params.value} />,
    },
    { field: 'duration', headerName: 'Duration', width: 100 },
    { field: 'timestamp', headerName: 'Date & Time', flex: 1.2, minWidth: 140 },
    {
      field: 'notes',
      headerName: 'Call Summary/Notes',
      flex: 2,
      minWidth: 240,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'text.secondary', textOverflow: 'ellipsis', overflow: 'hidden' }}>
          {params.value}
        </Typography>
      ),
    },
  ], [])

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
      
      {/* Analytics widgets */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(5, 1fr)',
          },
          gap: 2,
        }}
      >
        <AppCard title="Total Calls" subtitle="Total logged calls">
          <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>
            {stats.total}
          </Typography>
        </AppCard>
        <AppCard title="Answered" subtitle="Successfully answered">
          <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'success.main' }}>
            {stats.answered}
          </Typography>
        </AppCard>
        <AppCard title="Missed" subtitle="Missed incoming calls">
          <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'error.main' }}>
            {stats.missed}
          </Typography>
        </AppCard>
        <AppCard title="Inbound" subtitle="Incoming call logs">
          <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'info.main' }}>
            {stats.inbound}
          </Typography>
        </AppCard>
        <AppCard title="Outbound" subtitle="Outgoing call logs">
          <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: 'secondary.main' }}>
            {stats.outbound}
          </Typography>
        </AppCard>
      </Box>

      {/* Search and Table */}
      <AppCard
        title="Call Logs List"
        subtitle="Curated agent call details and client conversations."
        fullHeight
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search logs by customer, agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1 }}
          />
          <TextField
            size="small"
            select
            label="Call Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="All">All Statuses</MenuItem>
            <MenuItem value="Answered">Answered</MenuItem>
            <MenuItem value="Missed">Missed</MenuItem>
            <MenuItem value="No Answer">No Answer</MenuItem>
            <MenuItem value="Busy">Busy</MenuItem>
          </TextField>
        </Stack>

        <AppDataGrid
          height="400px"
          rows={filteredLogs}
          columns={columns}
          loading={false}
          getRowId={(r) => r.id}
        />
      </AppCard>
    </Box>
  )
}
