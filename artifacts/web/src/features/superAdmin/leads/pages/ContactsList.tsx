import { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import Paper from '@mui/material/Paper'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import { Add as AddIcon } from '@mui/icons-material'
import { AppCard } from '@/components/ui/AppCard'
import { DynamicForm } from '@/components/DynamicForm/DynamicForm'
import { listContacts, createContact, type Contact } from '@/services/contactsService'
import { resolveScreen, type ResolvedTableHeader } from '@/services/screenAdminService'
import { useAppSelector } from '@/store/hooks'

export default function ContactsListPage() {
  const user = useAppSelector((s) => s.auth.user)
  const [items, setItems] = useState<Contact[]>([])
  const [columns, setColumns] = useState<ResolvedTableHeader[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false, msg: '', sev: 'success',
  })

  const refresh = async () => {
    setLoading(true)
    try {
      const [list, resolved] = await Promise.all([
        listContacts(),
        resolveScreen({
          screen_key: 'contacts',
          // SuperAdmins must pass an explicit scope; fall back to temp001/admin
          // to demo something meaningful when none is selected.
          industry_code: user?.role === 'superAdmin' ? 'temp001' : undefined,
          role_key: user?.role === 'superAdmin' ? 'admin' : undefined,
        }),
      ])
      setItems(list)
      setColumns(resolved.table_headers)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      setToast({ open: true, msg: err?.response?.data?.message ?? 'Failed to load', sev: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.order - b.order),
    [columns],
  )

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%', minWidth: 0 }}>
      <AppCard
        title="Contacts"
        subtitle="Customer / lead contacts. The columns and Add form are driven by the Screen Configuration system."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Add Contact
          </Button>
        }
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No contacts yet — click "Add Contact" to create your first one.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  {sortedColumns.map((c) => (
                    <TableCell key={c.key}>{c.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row._id} hover>
                    {sortedColumns.map((c) => {
                      const v = (row as Record<string, unknown>)[c.key]
                      return (
                        <TableCell key={c.key} sx={{ color: v == null || v === '' ? 'text.secondary' : 'inherit' }}>
                          {v == null || v === '' ? '—' : String(v)}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </AppCard>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Contact</DialogTitle>
        <DialogContent dividers>
          <DynamicForm
            screen="contacts"
            onCancel={() => setDialogOpen(false)}
            submitLabel="Create"
            onSubmit={async (values) => {
              await createContact(values)
              setDialogOpen(false)
              setToast({ open: true, msg: 'Contact created', sev: 'success' })
              await refresh()
            }}
          />
        </DialogContent>
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
