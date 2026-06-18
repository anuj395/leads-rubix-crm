import React from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Divider from '@mui/material/Divider'
import CardMembershipIcon from '@mui/icons-material/CardMembership'
import PaymentIcon from '@mui/icons-material/Payment'
import UpdateIcon from '@mui/icons-material/Update'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { AppCard } from '@/components/ui/AppCard'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface Invoice {
  id: string
  date: string
  amount: string
  method: string
  status: string
}

const MOCK_INVOICES: Invoice[] = [
  { id: 'INV-2026-006', date: '2026-06-01', amount: '₹4,999.00', method: 'Visa ending in 4242', status: 'Paid' },
  { id: 'INV-2026-005', date: '2026-05-01', amount: '₹4,999.00', method: 'Visa ending in 4242', status: 'Paid' },
  { id: 'INV-2026-004', date: '2026-04-01', amount: '₹4,999.00', method: 'Visa ending in 4242', status: 'Paid' },
  { id: 'INV-2026-003', date: '2026-03-01', amount: '₹4,999.00', method: 'Visa ending in 4242', status: 'Paid' },
]

export default function SubscriptionDetailsPage() {
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
      <Box sx={{ flexShrink: 0 }}>
        <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800, mb: 0.5 }}>
          Subscription & Billing
        </Typography>
        <Typography color="text.secondary">
          Overview of your current enterprise subscription plan, workspace usage, and payment history.
        </Typography>
      </Box>

      {/* Main Info Blocks */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <AppCard title="Current Subscription Plan" subtitle="Active features & license status">
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'secondary.main',
                    }}
                  >
                    <CardMembershipIcon />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      Enterprise Gold Plan
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Renewing automatically
                    </Typography>
                  </Box>
                </Stack>
                <StatusBadge value="Active" />
              </Box>

              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Plan Price</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>₹4,999 / month</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Next Renewal Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>July 1, 2026</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Billing Frequency</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Monthly</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Registered Method</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PaymentIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} /> Visa ending in 4242
                  </Typography>
                </Stack>
              </Stack>

              <Divider />

              <Stack direction="row" spacing={2}>
                <Button variant="contained" sx={{ flexGrow: 1, borderRadius: '8px' }}>
                  Upgrade Plan
                </Button>
                <Button variant="outlined" color="inherit" sx={{ flexGrow: 1, borderRadius: '8px' }}>
                  Update Card
                </Button>
              </Stack>
            </Stack>
          </AppCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <AppCard title="Workspace Quotas & Usage" subtitle="Track active limits across features">
            <Stack spacing={3} sx={{ mt: 2 }}>
              {/* Agent Seats */}
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Agent Seats / Licenses</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>8 of 10 active</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={80}
                  sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.05)' }}
                />
              </Box>

              {/* Monthly Leads limit */}
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Monthly Leads Volume</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>14,208 of 50,000 processed</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={28.4}
                  color="success"
                  sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.05)' }}
                />
              </Box>

              {/* Integrations limits */}
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Active Custom Integrations</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>4 of 5 active</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={80}
                  color="warning"
                  sx={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.05)' }}
                />
              </Box>

              <Divider />

              <Stack spacing={1.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Included Add-ons</Typography>
                <Stack direction="row" alignItems="center" gap={1} color="text.secondary">
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: '1.1rem' }} />
                  <Typography variant="body2">Dedicated Account Manager support</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={1} color="text.secondary">
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: '1.1rem' }} />
                  <Typography variant="body2">Unlimited Projects & Config Catalogs</Typography>
                </Stack>
              </Stack>
            </Stack>
          </AppCard>
        </Grid>
      </Grid>

      {/* Invoice Table */}
      <AppCard title="Payment Invoice Logs" subtitle="Receipts and historic charges">
        <TableContainer component={Paper} sx={{ boxShadow: 'none', background: 'transparent' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Invoice ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Billing Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Amount Charged</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Payment Source</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Payment Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Downloads</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {MOCK_INVOICES.map((invoice) => (
                <TableRow key={invoice.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 600 }}>{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{invoice.amount}</TableCell>
                  <TableCell>{invoice.method}</TableCell>
                  <TableCell>
                    <StatusBadge value={invoice.status} />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="text" sx={{ textTransform: 'none' }}>
                      PDF Receipt
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </AppCard>
    </Box>
  )
}
