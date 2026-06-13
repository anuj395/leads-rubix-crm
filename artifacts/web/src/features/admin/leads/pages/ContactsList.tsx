/**
 * features/admin/leads/pages/ContactsList.tsx
 *
 * Orchestration only — all UI extracted to dedicated components:
 *   TableTopBar    → components/DataTable/TableTopBar.tsx
 *   MobileCardsView → components/common/MobileCardsView.tsx
 *
 * Desktop UI: PIXEL-IDENTICAL to previous version (no visual change).
 * Mobile UI:  card-based layout via MobileCardsView.
 */

import { useState, useMemo, useCallback } from 'react'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import EditIcon from '@mui/icons-material/Edit'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import PauseCircleIcon from '@mui/icons-material/PauseCircle'
import { useNavigate } from 'react-router-dom'

import {
  DataGrid,
  GridToolbar,
  useGridApiRef,
  type GridColDef,
  type GridRenderCellParams,
  type GridRowId,
} from '@mui/x-data-grid'

// Extracted reusable components
import TableTopBar from '../../../../components/DataTable/TableToolbar'
import MobileCardsView from '../../../../components/DataTable/MobileCardView'

import { useTableConfig } from '../../../../hooks/useTableConfig'
import { useContacts } from '../hooks/useContacts'
import { useAppSelector } from '../../../../store/hooks'
import { selectAuth } from '../../../auth/store/authSlice'

import type { DbColumnConfig } from '../../../../components/DataTable/types'
import type { PaginationState, SortState, ActiveFilters } from '../../../../components/DataTable'
import type { ContactApiRow } from '../api/contactsApi'

// ─── Avatar cell (desktop DataGrid) ──────────────────────────────────────────

const getInitials = (name: string) => {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

const getAvatarColor = (name: string) => {
  const p = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return p[Math.abs(h) % p.length]
}

const AvatarCell = ({ value }: { value: string }) => {
  const name = value || '—'
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, height: '100%' }}>
      <Avatar sx={{ width: 28, height: 28, bgcolor: getAvatarColor(name), fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
        {getInitials(name)}
      </Avatar>
      <Typography fontSize={13} fontWeight={600} noWrap>{name}</Typography>
    </Box>
  )
}

// ─── Status badge cell (desktop DataGrid) ─────────────────────────────────────

type KnownStatus = 'Active' | 'Inactive' | 'Pending'

const STATUS_CFG: Record<KnownStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  Active: { color: '#059669', bg: '#ECFDF5', icon: <CheckCircleIcon sx={{ fontSize: 12 }} /> },
  Inactive: { color: '#DC2626', bg: '#FEF2F2', icon: <CancelIcon sx={{ fontSize: 12 }} /> },
  Pending: { color: '#D97706', bg: '#FFFBEB', icon: <PauseCircleIcon sx={{ fontSize: 12 }} /> },
}

const StatusCell = ({ value }: { value: string }) => {
  const cfg = STATUS_CFG[value as KnownStatus]
  if (!cfg) return <Chip label={value || '—'} size="small" sx={{ fontWeight: 600, fontSize: 11, height: 22, borderRadius: '6px' }} />
  const { color, bg, icon } = cfg
  return (
    <Chip
      icon={<span style={{ color, display: 'flex', alignItems: 'center' }}>{icon}</span>}
      label={value} size="small"
      sx={{ bgcolor: bg, color, fontWeight: 600, fontSize: 11, height: 22, borderRadius: '6px', '& .MuiChip-icon': { ml: '5px', mr: '-4px' } }}
    />
  )
}

// ─── Actions cell (desktop DataGrid) ─────────────────────────────────────────

const ActionsCell = ({ row, onEdit, onDelete }: {
  row: ContactApiRow
  onEdit: (row: ContactApiRow) => void
  onDelete: (row: ContactApiRow) => void
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, height: '100%' }}>
      <Tooltip title="Edit">
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onEdit(row) }}
          sx={{ width: 28, height: 28, color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'action.hover' } }}
        >
          <EditIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onDelete(row) }}
          sx={{ width: 28, height: 28, color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'error.50' } }}
        >
          <DeleteOutlineIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Tooltip>
    </Box>
  )
}

// ─── Column builder ───────────────────────────────────────────────────────────

const buildColumns = (
  dbCols: DbColumnConfig[],
  onEdit: (row: ContactApiRow) => void,
  onDelete: (row: ContactApiRow) => void,
): GridColDef[] => {
  const dataCols: GridColDef[] = dbCols.map((col): GridColDef => {
    const base: GridColDef = {
      field: col.key, headerName: col.label,
      flex: 1, minWidth: col.width ?? 120,
      sortable: true, filterable: true, hideable: true,
    }
    if (col.type === 'avatar' || col.key === 'name' || col.key === 'customer_name') {
      return {
        ...base, minWidth: col.width ?? 180,
        renderCell: (p: GridRenderCellParams) => <AvatarCell value={String(p.value ?? '')} />
      }
    }
    if (col.type === 'badge' || col.key === 'status') {
      return {
        ...base, minWidth: col.width ?? 110,
        renderCell: (p: GridRenderCellParams) => <StatusCell value={String(p.value ?? '')} />
      }
    }
    return base
  })

  return [
    ...dataCols,
    {
      field: '__actions__', headerName: 'Actions',
      width: 90, sortable: false, filterable: false, hideable: false, disableColumnMenu: true,
      renderCell: (p: GridRenderCellParams) => (
        <ActionsCell row={p.row as ContactApiRow} onEdit={onEdit} onDelete={onDelete} />
      ),
    },
  ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ContactsListPage = () => {
  const { user } = useAppSelector(selectAuth)
  const industry_id = user?.industry_id
  const apiRef = useGridApiRef()
  const navigate = useNavigate()

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // ── Shared state (used by BOTH views) ────────────────────────────────────
  const [search, setSearch] = useState('')
  const [activeFilters] = useState<ActiveFilters>({})
  const [sort, setSort] = useState<SortState>({ field: 'name', order: 'asc' })
  const [pagination, setPagination] = useState<PaginationState>({ page: 0, rowsPerPage: 25, total: 0 })
  const [selectedIds, setSelectedIds] = useState<GridRowId[]>([])

  const selectedCount = selectedIds.length

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { columns: dbColumns, loading: configLoading, error: configError, reload: reloadConfig } =
    useTableConfig('contacts', industry_id)

  const { rows, total, loading: dataLoading, error: dataError, reload: reloadData } =
    useContacts({ industry_id, pagination, sort, search, activeFilters })

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearchChange = useCallback((v: string) => {
    setSearch(v)
    setPagination((p) => ({ ...p, page: 0 }))
  }, [])

  const handleRefresh = useCallback(() => {
    reloadConfig()
    reloadData()
  }, [reloadConfig, reloadData])

  const handleExport = useCallback(() => {
    apiRef.current?.exportDataAsCsv?.({ fileName: 'contacts-export' })
  }, [apiRef])

  const handleEdit = useCallback((row: ContactApiRow) => {
    alert(`Edit contact: ${String(row.name ?? row.customer_name ?? row.id)}`)
  }, [])

  const handleDelete = useCallback((row: ContactApiRow) => {
    if (confirm(`Delete contact: ${String(row.name ?? row.customer_name ?? row.id)}?`)) reloadData()
  }, [reloadData])

  const handleBulkDelete = useCallback(() => {
    if (confirm(`Delete ${selectedCount} selected contacts?`)) {
      setSelectedIds([])
      reloadData()
    }
  }, [selectedCount, reloadData])

  const handleCancelSelection = useCallback(() => setSelectedIds([]), [])

  const handleAddContact = () => {
    navigate('/leads/contacts/new')
  }
  // Mobile: toggle a single row in the shared selectedIds array
  const handleMobileToggle = useCallback((id: GridRowId) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  // Desktop: accept whatever MUI gives back and normalise to GridRowId[]
  const handleGridSelectionChange = useCallback((newModel: unknown) => {
    if (Array.isArray(newModel)) {
      setSelectedIds(newModel as GridRowId[])
    } else if (newModel && typeof newModel === 'object' && 'ids' in newModel) {
      setSelectedIds(Array.from((newModel as { ids: Set<GridRowId> }).ids))
    } else {
      setSelectedIds([])
    }
  }, [])

  const columns = useMemo(
    () => buildColumns(dbColumns, handleEdit, handleDelete),
    [dbColumns, handleEdit, handleDelete]
  )

  const computedPageSizeOptions = useMemo(() => {
    const base = [25, 50, 100]
    if (total > 0 && !base.includes(total)) {
      base.push(total)
    }
    const uniqueSorted = Array.from(new Set(base)).sort((a, b) => a - b)
    return uniqueSorted.map((val) => {
      if (val === total) {
        return { value: val, label: `All (${val})` }
      }
      return val
    })
  }, [total])

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (configLoading && !dbColumns.length) {
    return (
      <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}>
        <Skeleton width={160} height={32} sx={{ mb: 0.5 }} />
        <Skeleton width={90} height={20} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={52} sx={{ mb: 0.5 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column',
      height: '100%', minHeight: 0, overflow: 'hidden',
      p: { xs: 1, sm: 1.5, md: 2 }, boxSizing: 'border-box',
    }}>

      {/* Error banners */}
      {configError && (
        <Alert severity="error" sx={{ mb: 1, flexShrink: 0 }}>
          Column config unavailable — please contact your Super Admin to create table headers for this industry. Rendering with default columns.
        </Alert>
      )}
      {!configLoading && dbColumns.length === 0 && (
        <Alert severity="error" sx={{ mb: 1, flexShrink: 0 }}>
          No table columns found for this industry (ID: {String(industry_id ?? 'N/A')}). Please contact your Super Admin to create the table headers.
        </Alert>
      )}
      {dataError && (
        <Alert severity="warning" sx={{ mb: 1, flexShrink: 0 }}>
          Could not load contacts from server — showing cached data. ({dataError})
        </Alert>
      )}

      {dbColumns.length > 0 && (
        <Paper elevation={0} sx={{
          flex: 1, minHeight: 0,
          display: 'flex', flexDirection: 'column',
          border: '1px solid', borderColor: 'divider',
          borderRadius: 2, overflow: 'hidden',
          bgcolor: 'background.paper',
        }}>

          {/* ── Title row ─────────────────────────────────────────────── */}
          <Box sx={{ px: 2, pt: 1, pb: 0.25, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" fontWeight={700} letterSpacing="-0.4px"
                sx={{ fontSize: { xs: '1.05rem', md: '1.25rem' } }}>
                Contacts
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                {total} record{total !== 1 ? 's' : ''}
              </Typography>
            </Box>
          </Box>

          {/* ── Top bar (extracted, fully responsive) ─────────────────── */}
          <TableTopBar
            search={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search Contacts…"
            selectedCount={selectedCount}
            onDeleteSelected={handleBulkDelete}
            onCancelSelection={handleCancelSelection}
            onAdd={handleAddContact}
            onImport={() => alert('Import contacts')}
            onExport={handleExport}
            onRefresh={handleRefresh}
            loading={dataLoading}
          />

          {/* ── Content: mobile cards OR desktop DataGrid ──────────────── */}
          {isMobile ? (
            <MobileCardsView<ContactApiRow>
              rows={rows}
              loading={dataLoading}
              pagination={{ ...pagination, total }}
              onPaginationChange={(next) => setPagination((p) => ({ ...p, ...next }))}
              selectedIds={selectedIds as (string | number)[]}
              onToggleSelect={handleMobileToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              nameKey="customer_name"
              emailKey="email"
              statusKey="status"
              extraFields={[
                { key: 'contact_no', label: 'Phone' },
                { key: 'lead_source', label: 'Source' },
                { key: 'lead_type', label: 'Type' },
                { key: 'project', label: 'Project' },
              ]}
              emptyMessage="No contacts found"
              emptySubMessage="Try adjusting your search or filters."
            />
          ) : (
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <DataGrid<ContactApiRow>
                apiRef={apiRef}
                rows={rows}
                columns={columns}
                loading={dataLoading}

                slots={{ toolbar: GridToolbar }}
                slotProps={{
                  toolbar: {
                    showQuickFilter: false,
                  },
                  filterPanel: {
                    sx: {
                      '& .MuiDataGrid-filterForm, & .MuiDataGrid-filterPanel, & .MuiDataGrid-panel, & .MuiDataGrid-filterFormHeader': {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        padding: 1,
                        flexWrap: 'nowrap',
                      },
                      '& .MuiDataGrid-filterFormColumnInput': { flex: '0 0 180px', minWidth: 140, maxWidth: 260 },
                      '& .MuiDataGrid-filterFormOperatorInput': { flex: '0 0 180px', minWidth: 120, maxWidth: 220 },
                      '& .MuiDataGrid-filterFormValueInput': { flex: '1 1 auto', minWidth: 0 },
                      '& .MuiOutlinedInput-root, & .MuiInputBase-root, & .MuiSelect-root, input, textarea': {
                        width: '100%', minWidth: 0, height: 36, padding: '6px 10px', boxSizing: 'border-box'
                      },
                    }
                  }
                }}

                paginationMode="server"
                rowCount={total}
                paginationModel={{ page: pagination.page, pageSize: pagination.rowsPerPage }}
                onPaginationModelChange={(m) =>
                  setPagination((p) => ({ ...p, page: m.page, rowsPerPage: m.pageSize }))
                }
                pageSizeOptions={computedPageSizeOptions}

                sortingMode="server"
                onSortModelChange={(model) => {
                  setSort(model.length > 0
                    ? { field: model[0].field, order: model[0].sort ?? 'asc' }
                    : { field: 'name', order: 'asc' }
                  )
                  setPagination((p) => ({ ...p, page: 0 }))
                }}

                disableColumnMenu={false}
                checkboxSelection
                disableRowSelectionOnClick
                rowSelectionModel={selectedIds}
                onRowSelectionModelChange={handleGridSelectionChange}

                sx={{
                  height: '100%',
                  border: 'none', borderRadius: 0, bgcolor: 'transparent',
                  '& .MuiDataGrid-columnHeaders': {
                    bgcolor: 'grey.50',
                    borderBottom: '1px solid', borderColor: 'divider',
                  },
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 700, fontSize: 11.5,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: 'text.secondary',
                  },
                  '& .MuiDataGrid-row:hover': { bgcolor: 'action.hover' },
                  '& .MuiDataGrid-row.Mui-selected': { bgcolor: 'action.selected' },
                  '& .MuiDataGrid-row.Mui-selected:hover': { bgcolor: 'action.selected' },
                  '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center', fontSize: 13 },
                  '& .MuiDataGrid-footerContainer': {
                    borderTop: '1px solid', borderColor: 'divider',
                  },
                  '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-columnHeader.Mui-focused, & .MuiDataGrid-columnHeader.Mui-focusVisible': {
                    outline: 'none', boxShadow: 'none', border: 'none',
                  },
                  '& .MuiDataGrid-columnHeader button:focus, & .MuiDataGrid-columnHeaderTitleContainer button:focus': {
                    outline: 'none', boxShadow: 'none',
                  },

                }}
              />
            </Box>
          )}

        </Paper>
      )}
    </Box>
  )
}

export default ContactsListPage;
