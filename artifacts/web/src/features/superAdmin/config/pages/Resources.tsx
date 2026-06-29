import { useState, useEffect, useMemo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material'
import type { GridColDef } from '@mui/x-data-grid'
import { AppCard } from '@/components/ui/AppCard'
import { AppDataGrid } from '@/components/ui/AppDataGrid'
import { getIndustries, type Industry } from '@/services/sidebarAdminService'
import { getScreens, resolveScreen, type Screen, type ResolvedScreen, type ResolvedFormField } from '@/services/screenAdminService'
import { getResources, createResource, updateResource, deleteResource } from '@/services/resourcesService'
import { listOrganizationsPaged, type Organization } from '@/services/organizationsService'
import { api } from '@/services/api'

export default function ResourcesPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [resourceScreens, setResourceScreens] = useState<Screen[]>([])
  const [activeTab, setActiveTab] = useState(0)

  // Resolved configurations for active tab
  const [resolvedScreen, setResolvedScreen] = useState<ResolvedScreen | null>(null)
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Caching mechanism for screen resolutions and resource list rows
  const [resolvedScreensCache, setResolvedScreensCache] = useState<Record<string, ResolvedScreen>>({})
  const [resourceDataCache, setResourceDataCache] = useState<Record<string, any[]>>({})

  // Modals & Forms State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [apiDropdownOptions, setApiDropdownOptions] = useState<Record<string, Array<{ value: string; label: string }>>>({})

  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  })

  // Load organizations and screens on mount
  useEffect(() => {
    void (async () => {
      try {
        setLoading(true)
        const [orgsData, scrs] = await Promise.all([
          listOrganizationsPaged({ page: 0, pageSize: 100 }),
          getScreens()
        ])
        setOrganizations(orgsData.items)
        
        // Filter screens starting with resource_
        const filtered = scrs.filter((s) => s.key.startsWith('resource_') && s.is_active)
        setResourceScreens(filtered)

        setSelectedOrgId('null')
      } catch (e: any) {
        setToast({ open: true, msg: e?.response?.data?.message ?? 'Failed to load initial data', sev: 'error' })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Load configuration and data for selected screen / organization
  const activeScreen = resourceScreens[activeTab]
  const activeOrg = organizations.find((o) => o.organization_id === selectedOrgId)
  const selectedIndustry = activeOrg?.industry_id || 'temp0001'

  useEffect(() => {
    if (!activeScreen || !selectedOrgId) {
      setResolvedScreen(null)
      setRows([])
      return
    }

    const cacheKey = `${activeScreen.key}_${selectedOrgId}`
    const cachedScreen = resolvedScreensCache[cacheKey]
    const cachedRows = resourceDataCache[cacheKey]

    if (cachedScreen && cachedRows) {
      setResolvedScreen(cachedScreen)
      setRows(cachedRows)
      
      // Fetch in background silently
      void (async () => {
        try {
          const [resolved, items] = await Promise.all([
            resolveScreen({ screen_key: activeScreen.key, industry_code: selectedIndustry }),
            getResources(activeScreen.key, selectedOrgId)
          ])
          setResolvedScreensCache(prev => ({ ...prev, [cacheKey]: resolved }))
          setResourceDataCache(prev => ({ ...prev, [cacheKey]: items }))
          setResolvedScreen(resolved)
          setRows(items)
        } catch (e) {
          console.error('Failed background sync', e)
        }
      })()
      return
    }

    let cancelled = false
    void (async () => {
      try {
        setLoading(true)
        const [resolved, items] = await Promise.all([
          resolveScreen({ screen_key: activeScreen.key, industry_code: selectedIndustry }),
          getResources(activeScreen.key, selectedOrgId)
        ])
        if (cancelled) return
        
        // Save to cache
        setResolvedScreensCache(prev => ({ ...prev, [cacheKey]: resolved }))
        setResourceDataCache(prev => ({ ...prev, [cacheKey]: items }))
        
        setResolvedScreen(resolved)
        setRows(items)
      } catch (e: any) {
        if (!cancelled) {
          setToast({ open: true, msg: e?.response?.data?.message ?? 'Failed to load resource data', sev: 'error' })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [activeScreen, selectedOrgId, selectedIndustry])

  // Resolve API-driven select options
  useEffect(() => {
    if (!resolvedScreen) return
    resolvedScreen.form_fields.forEach((field) => {
      if (field.type === 'select' && field.dropdown_source === 'api' && field.dropdown_api) {
        // Build query string if it needs industry
        const connector = field.dropdown_api.includes('?') ? '&' : '?'
        const targetUrl = `${field.dropdown_api}${connector}industry_code=${encodeURIComponent(selectedIndustry)}`
        
        void (async () => {
          try {
            const res = await api.get(targetUrl)
            const raw = res.data?.items ?? res.data ?? []
            const list = Array.isArray(raw)
              ? raw
              : Array.isArray(raw.items)
                ? raw.items
                : []
            const options = list.map((entry: any) => {
              if (entry && typeof entry === 'object') {
                return {
                  value: String(entry.value ?? entry.id ?? entry.key ?? ''),
                  label: String(entry.label ?? entry.name ?? entry.value ?? ''),
                }
              }
              return { value: String(entry), label: String(entry) }
            })
            setApiDropdownOptions((prev) => ({ ...prev, [field.key]: options }))
          } catch (e) {
            console.error('Failed to load api option source', e)
          }
        })()
      }
    })
  }, [resolvedScreen, selectedIndustry])

  const handleExport = () => {
    if (!resolvedScreen || rows.length === 0) return
    const headers = resolvedScreen.table_headers.map(h => h.label)
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(",")].concat(rows.map(row => resolvedScreen.table_headers.map(h => `"${row[h.key] ?? ''}"`).join(","))).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${activeScreen.key}_export.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setToast({ open: true, msg: 'Exported successfully!', sev: 'success' })
  }

  const handleImport = () => {
    setToast({ open: true, msg: `Import template ready!`, sev: 'success' })
  }

  const handleDeleteItem = async (id: string) => {
    if (!activeScreen) return
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteResource(activeScreen.key, id)
        const nextRows = rows.filter((r) => r.id !== id)
        setRows(nextRows)
        setResourceDataCache((prev) => ({ ...prev, [`${activeScreen.key}_${selectedOrgId}`]: nextRows }))
        setToast({ open: true, msg: 'Deleted successfully!', sev: 'success' })
      } catch (e: any) {
        setToast({ open: true, msg: e?.response?.data?.message ?? 'Failed to delete item', sev: 'error' })
      }
    }
  }

  const openAdd = () => {
    if (!resolvedScreen) return
    const initial: Record<string, any> = {}
    resolvedScreen.form_fields.forEach((f) => {
      initial[f.key] = f.type === 'checkbox' ? false : ''
    })
    setFormValues(initial)
    setEditingItem(null)
    setDialogOpen(true)
  }

  const openEdit = (item: any) => {
    if (!resolvedScreen) return
    const values: Record<string, any> = {}
    resolvedScreen.form_fields.forEach((f) => {
      values[f.key] = item[f.key] !== undefined ? item[f.key] : (f.type === 'checkbox' ? false : '')
    })
    setFormValues(values)
    setEditingItem(item)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!activeScreen || !resolvedScreen) return

    // Simple validation
    for (const field of resolvedScreen.form_fields) {
      if (field.required && !formValues[field.key]) {
        setToast({ open: true, msg: `${field.label} is required`, sev: 'error' })
        return
      }
    }

    try {
      const cacheKey = `${activeScreen.key}_${selectedOrgId}`
      if (editingItem) {
        const updated = await updateResource(activeScreen.key, editingItem.id, formValues)
        const nextRows = rows.map((r) => r.id === editingItem.id ? updated : r)
        setRows(nextRows)
        setResourceDataCache((prev) => ({ ...prev, [cacheKey]: nextRows }))
        setToast({ open: true, msg: 'Updated successfully!', sev: 'success' })
      } else {
        const created = await createResource(activeScreen.key, formValues, selectedOrgId)
        const nextRows = [created, ...rows]
        setRows(nextRows)
        setResourceDataCache((prev) => ({ ...prev, [cacheKey]: nextRows }))
        setToast({ open: true, msg: 'Created successfully!', sev: 'success' })
      }
      setDialogOpen(false)
    } catch (e: any) {
      setToast({ open: true, msg: e?.response?.data?.message ?? 'Failed to save resource', sev: 'error' })
    }
  }

  // Dynamic columns for AppDataGrid
  const gridColumns = useMemo<GridColDef[]>(() => {
    if (!resolvedScreen) return []

    const cols: GridColDef[] = resolvedScreen.table_headers.map((header) => {
      const col: GridColDef = {
        field: header.key,
        headerName: header.label,
        flex: 1,
        minWidth: 120,
        sortable: header.sortable,
      }

      if (header.type === 'avatar') {
        col.renderCell = (p) => <Avatar src={p.value} variant="rounded" sx={{ width: 36, height: 36 }} />
        col.width = 80
        col.flex = 0
      } else if (header.type === 'checkbox') {
        col.renderCell = (p) => <Checkbox checked={!!p.value} disabled />
        col.width = 100
        col.flex = 0
      } else if (header.type === 'badge') {
        col.renderCell = (p) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: String(p.value).startsWith('#') ? p.value : '#22c55e' }} />
            {p.value}
          </Box>
        )
      } else if (header.type === 'date') {
        col.renderCell = (p) => p.value ? new Date(p.value as string).toLocaleDateString() : ''
      }

      return col
    })

    // Action column placed at the end
    cols.push({
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(p.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDeleteItem(p.id as string)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    })

    return cols
  }, [resolvedScreen, rows])

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
      
      {/* Industry Selector & Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} gap={2}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Resources Management</Typography>
          <Typography variant="body2" color="text.secondary">Configure and load lookup resources dynamically per industry.</Typography>
        </Box>
      </Stack>

      {resourceScreens.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No resource screens found. Create screens prefixed with <code>resource_</code> in screen management.
        </Alert>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={(_, val) => setActiveTab(val)} 
              variant="scrollable" 
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                }
              }}
            >
              {resourceScreens.map((s) => (
                <Tab key={s._id} label={s.name} />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ flexGrow: 1, minHeight: 0 }}>
            {activeScreen && resolvedScreen && (
              <AppCard 
                title={resolvedScreen.screen.name} 
                subtitle={activeScreen.description || `Manage ${resolvedScreen.screen.name} lookup items.`}
                action={
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openAdd}>Add</Button>
                    <Button variant="outlined" size="small" startIcon={<UploadIcon />} onClick={handleImport}>Import</Button>
                    <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={handleExport}>Export</Button>
                  </Stack>
                }
              >
                <Box sx={{ height: 480, width: '100%', position: 'relative' }}>
                  {loading && (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
                      <LinearProgress />
                    </Box>
                  )}
                  <AppDataGrid rows={rows} columns={gridColumns} getRowId={(r) => r.id} />
                </Box>
              </AppCard>
            )}
          </Box>
        </>
      )}

      {/* Dynamic Popups for Adding/Editing */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            p: 1,
            width: '100%',
            maxWidth: 650
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, px: 3, pt: 3, pb: 1, fontSize: '1.25rem' }}>
          {editingItem ? 'Edit' : 'Add'} {resolvedScreen?.screen.name}
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            {resolvedScreen?.form_fields.map((field) => {
              if (field.key === 'url' || field.key === 'image' || field.type === 'avatar') {
                return (
                  <Box key={field.key} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
                    </Typography>
                    <Box
                      sx={{
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        bgcolor: 'action.hover',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.selected',
                        },
                      }}
                      onClick={() => document.getElementById(`file-input-${field.key}`)?.click()}
                    >
                      <input
                        type="file"
                        id={`file-input-${field.key}`}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              const base64 = event.target?.result as string
                              setFormValues((prev) => {
                                const next = { ...prev, [field.key]: base64 }
                                if (prev.hasOwnProperty('image_name')) {
                                  next['image_name'] = file.name
                                }
                                return next
                              })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                      {formValues[field.key] ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            component="img"
                            src={formValues[field.key]}
                            sx={{
                              maxWidth: '100%',
                              maxHeight: 120,
                              borderRadius: 1.5,
                              objectFit: 'contain',
                              boxShadow: 2,
                            }}
                          />
                          <Button size="small" variant="outlined" color="primary" sx={{ textTransform: 'none', fontWeight: 600 }}>
                            Change Image
                          </Button>
                        </Box>
                      ) : (
                        <Box sx={{ py: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <UploadIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Click to upload image
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )
              }

              if (field.type === 'checkbox') {
                return (
                  <FormControlLabel
                    key={field.key}
                    control={
                      <Checkbox
                        checked={!!formValues[field.key]}
                        onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.checked }))}
                      />
                    }
                    label={field.label}
                  />
                )
              }

              if (field.type === 'select') {
                const options = field.dropdown_source === 'static'
                  ? (field.options || []).map(o => ({ value: o, label: o }))
                  : (apiDropdownOptions[field.key] || [])

                return (
                  <TextField
                    key={field.key}
                    fullWidth
                    select
                    label={field.label}
                    value={formValues[field.key] || ''}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    required={field.required}
                  >
                    {options.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )
              }

              return (
                <TextField
                  key={field.key}
                  fullWidth
                  label={field.label}
                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
                  multiline={field.type === 'textarea'}
                  rows={field.type === 'textarea' ? 3 : 1}
                  value={formValues[field.key] || ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  required={field.required}
                />
              )
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}>Save</Button>
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
