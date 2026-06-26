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

// Preset configurations matching old project screenshots
const INITIAL_CAROUSEL = [
  { id: 'c1', url: 'https://via.placeholder.com/150', image_name: 'app_banner.png', created_at: '2026-12-09T17:33:00.000Z' },
]

const INITIAL_LOCATIONS = [
  { id: 'l1', location_name: 'Noida', created_at: '2026-12-24T12:50:00.000Z' },
  { id: 'l2', location_name: 'Delhi', created_at: '2026-12-24T12:50:00.000Z' },
]

const INITIAL_LEAD_SOURCES = [
  { id: 'ls1', leadSource: 'Sulekha', leadSourceColor: '#ff6b76', created_at: '2026-11-28T14:53:00.000Z' },
  { id: 'ls2', leadSource: 'Self Generated', leadSourceColor: '#22c55e', created_at: '2026-11-28T14:53:00.000Z' },
  { id: 'ls3', leadSource: 'OLX', leadSourceColor: '#3b82f6', created_at: '2026-11-28T14:53:00.000Z' },
  { id: 'ls4', leadSource: 'Makaan.com', leadSourceColor: '#eab308', created_at: '2026-11-28T14:53:00.000Z' },
  { id: 'ls5', leadSource: 'Magicbricks', leadSourceColor: '#a855f7', created_at: '2026-11-28T14:53:00.000Z' },
  { id: 'ls6', leadSource: 'LinkedIn Ads', leadSourceColor: '#06b6d4', created_at: '2026-11-28T14:53:00.000Z' },
  { id: 'ls7', leadSource: 'Justdial', leadSourceColor: '#6b7280', created_at: '2026-11-28T14:53:00.000Z' },
  { id: 'ls8', leadSource: 'Indiamart', leadSourceColor: '#f97316', created_at: '2026-11-28T14:53:00.000Z' },
  { id: 'ls9', leadSource: 'Housing.com', leadSourceColor: '#ec4899', created_at: '2026-11-28T14:53:00.000Z' },
  { id: 'ls10', leadSource: 'Google Ads', leadSourceColor: '#14b8a6', created_at: '2026-11-28T14:53:00.000Z' },
]

const INITIAL_BUDGETS = [
  { id: 'b1', budget: 'Rs.40 Lacs - Rs.50 Lacs', created_at: '2026-11-28T14:44:00.000Z' },
  { id: 'b2', budget: 'Rs.50 Lacs - Rs.60 Lacs', created_at: '2026-11-28T14:44:00.000Z' },
  { id: 'b3', budget: 'Rs.60 Lacs - Rs.70 Lacs', created_at: '2026-11-28T14:44:00.000Z' },
  { id: 'b4', budget: 'Rs.70 Lacs - Rs.80 Lacs', created_at: '2026-11-28T14:44:00.000Z' },
  { id: 'b5', budget: 'Rs.80 Lacs - Rs.90 Lacs', created_at: '2026-11-28T14:44:00.000Z' },
  { id: 'b6', budget: 'Rs.90 Lacs - Rs.1 Cr', created_at: '2026-11-28T14:44:00.000Z' },
  { id: 'b7', budget: 'Rs.1 Cr - Rs.1.10 Cr', created_at: '2026-11-28T14:44:00.000Z' },
  { id: 'b8', budget: 'Rs.1.10 Cr - Rs.1.20 Cr', created_at: '2026-11-28T14:44:00.000Z' },
  { id: 'b9', budget: 'Rs.1.20 Cr - Rs.1.30 Cr', created_at: '2026-11-28T14:44:00.000Z' },
  { id: 'b10', budget: 'Rs.1.30 Cr - Rs.1.40 Cr', created_at: '2026-11-28T14:44:00.000Z' },
]

const INITIAL_TRANSFER_REASONS = [
  { id: 'tr1', reason: 'Fresh Leads' },
  { id: 'tr2', reason: 'Old Leads' },
  { id: 'tr3', reason: 'Not Interested Leads' },
]

const INITIAL_PROPERTY_STAGES = [
  { id: 'ps1', stage: 'Under Construction' },
  { id: 'ps2', stage: 'Ready to Move In (RTM) or Completed' },
]

const INITIAL_PROPERTY_TYPES = [
  { id: 'pt1', property_type: 'Residential Properties' },
  { id: 'pt2', property_type: 'Commercial Properties' },
  { id: 'pt3', property_type: 'Investment Properties' },
  { id: 'pt4', property_type: 'Land' },
  { id: 'pt5', property_type: 'Special Purpose Properties' },
  { id: 'pt6', property_type: 'Government Properties' },
]

const INITIAL_PROPERTY_SUB_TYPES = [
  { id: 'pst1', property_type: 'Residential Properties', property_sub_type: 'Apartments/Condos' },
  { id: 'pst2', property_type: 'Residential Properties', property_sub_type: 'Townhouses' },
  { id: 'pst3', property_type: 'Residential Properties', property_sub_type: 'Villas' },
  { id: 'pst4', property_type: 'Commercial Properties', property_sub_type: 'Office Spaces' },
  { id: 'pst5', property_type: 'Commercial Properties', property_sub_type: 'Retail Spaces' },
  { id: 'pst6', property_type: 'Commercial Properties', property_sub_type: 'Industrial Properties' },
  { id: 'pst7', property_type: 'Investment Properties', property_sub_type: 'Rental Properties' },
  { id: 'pst8', property_type: 'Investment Properties', property_sub_type: 'Vacation Homes' },
  { id: 'pst9', property_type: 'Land', property_sub_type: 'Agricultural Land' },
  { id: 'pst10', property_type: 'Land', property_sub_type: 'Residential Land' },
]

export default function ResourcesPage() {
  // State managers
  const [carouselList, setCarouselList] = useState(INITIAL_CAROUSEL)
  const [locationsList, setLocationsList] = useState(INITIAL_LOCATIONS)
  const [leadSourceList, setLeadSourceList] = useState(INITIAL_LEAD_SOURCES)
  const [budgetsList, setBudgetsList] = useState(INITIAL_BUDGETS)
  const [transferReasons, setTransferReasons] = useState(INITIAL_TRANSFER_REASONS)
  const [propertyStages, setPropertyStages] = useState(INITIAL_PROPERTY_STAGES)
  const [propertyTypes, setPropertyTypes] = useState(INITIAL_PROPERTY_TYPES)
  const [propertySubTypes, setPropertySubTypes] = useState(INITIAL_PROPERTY_SUB_TYPES)
  const [activeTab, setActiveTab] = useState(0)

  // Modals & Forms State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<string>('')
  const [editingItem, setEditingItem] = useState<any | null>(null)
  
  // Generic fields for adding/editing
  const [fieldName, setFieldName] = useState('')
  const [fieldExtra, setFieldExtra] = useState('')

  const [toast, setToast] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  })

  // Load from local storage if available
  useEffect(() => {
    const keys = ['carouselList', 'locationsList', 'leadSourceList', 'budgetsList', 'transferReasons', 'propertyStages', 'propertyTypes', 'propertySubTypes']
    const lists = [setCarouselList, setLocationsList, setLeadSourceList, setBudgetsList, setTransferReasons, setPropertyStages, setPropertyTypes, setPropertySubTypes]
    keys.forEach((k, idx) => {
      const saved = localStorage.getItem(`resources_${k}`)
      if (saved) {
        try { lists[idx](JSON.parse(saved)) } catch (e) { console.error(e) }
      }
    })
  }, [])

  const saveList = (key: string, list: any[]) => {
    localStorage.setItem(`resources_${key}`, JSON.stringify(list))
  }

  const handleExport = (filename: string, headers: string[], rows: any[]) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(",")].concat(rows.map(r => r.join(","))).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setToast({ open: true, msg: 'Exported successfully!', sev: 'success' })
  }

  const handleImport = (type: string) => {
    setToast({ open: true, msg: `Import template loaded for ${type}!`, sev: 'success' })
  }

  // Delete Action Dispatcher
  const handleDelete = (type: string, id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      if (type === 'carousel') {
        const next = carouselList.filter(item => item.id !== id)
        setCarouselList(next)
        saveList('carouselList', next)
      } else if (type === 'location') {
        const next = locationsList.filter(item => item.id !== id)
        setLocationsList(next)
        saveList('locationsList', next)
      } else if (type === 'leadSource') {
        const next = leadSourceList.filter(item => item.id !== id)
        setLeadSourceList(next)
        saveList('leadSourceList', next)
      } else if (type === 'budget') {
        const next = budgetsList.filter(item => item.id !== id)
        setBudgetsList(next)
        saveList('budgetsList', next)
      } else if (type === 'reason') {
        const next = transferReasons.filter(item => item.id !== id)
        setTransferReasons(next)
        saveList('transferReasons', next)
      } else if (type === 'stage') {
        const next = propertyStages.filter(item => item.id !== id)
        setPropertyStages(next)
        saveList('propertyStages', next)
      } else if (type === 'type') {
        const next = propertyTypes.filter(item => item.id !== id)
        setPropertyTypes(next)
        saveList('propertyTypes', next)
      } else if (type === 'subType') {
        const next = propertySubTypes.filter(item => item.id !== id)
        setPropertySubTypes(next)
        saveList('propertySubTypes', next)
      }
      setToast({ open: true, msg: 'Deleted successfully!', sev: 'success' })
    }
  }

  // Open Add Dialog
  const openAdd = (type: string) => {
    setDialogType(type)
    setEditingItem(null)
    setFieldName('')
    setFieldExtra(type === 'subType' ? propertyTypes[0]?.property_type || '' : '')
    setDialogOpen(true)
  }

  // Open Edit Dialog
  const openEdit = (type: string, item: any) => {
    setDialogType(type)
    setEditingItem(item)
    if (type === 'location') setFieldName(item.location_name)
    else if (type === 'leadSource') {
      setFieldName(item.leadSource)
      setFieldExtra(item.leadSourceColor)
    }
    else if (type === 'budget') setFieldName(item.budget)
    else if (type === 'reason') setFieldName(item.reason)
    else if (type === 'stage') setFieldName(item.stage)
    else if (type === 'type') setFieldName(item.property_type)
    else if (type === 'subType') {
      setFieldName(item.property_sub_type)
      setFieldExtra(item.property_type)
    }
    setDialogOpen(true)
  }

  // Save Add/Edit Dialog
  const handleSave = () => {
    if (!fieldName.trim() && dialogType !== 'carousel') {
      setToast({ open: true, msg: 'Name field is required', sev: 'error' })
      return
    }

    if (dialogType === 'carousel') {
      const newImg = {
        id: `c_${Date.now()}`,
        url: 'https://via.placeholder.com/150',
        image_name: fieldName || 'custom_banner.png',
        created_at: new Date().toISOString(),
      }
      const next = [newImg, ...carouselList]
      setCarouselList(next)
      saveList('carouselList', next)
    } else if (dialogType === 'location') {
      let next
      if (editingItem) {
        next = locationsList.map(item => item.id === editingItem.id ? { ...item, location_name: fieldName } : item)
      } else {
        next = [{ id: `l_${Date.now()}`, location_name: fieldName, created_at: new Date().toISOString() }, ...locationsList]
      }
      setLocationsList(next)
      saveList('locationsList', next)
    } else if (dialogType === 'leadSource') {
      let next
      if (editingItem) {
        next = leadSourceList.map(item => item.id === editingItem.id ? { ...item, leadSource: fieldName, leadSourceColor: fieldExtra } : item)
      } else {
        next = [{ id: `ls_${Date.now()}`, leadSource: fieldName, leadSourceColor: fieldExtra || '#000000', created_at: new Date().toISOString() }, ...leadSourceList]
      }
      setLeadSourceList(next)
      saveList('leadSourceList', next)
    } else if (dialogType === 'budget') {
      let next
      if (editingItem) {
        next = budgetsList.map(item => item.id === editingItem.id ? { ...item, budget: fieldName } : item)
      } else {
        next = [{ id: `b_${Date.now()}`, budget: fieldName, created_at: new Date().toISOString() }, ...budgetsList]
      }
      setBudgetsList(next)
      saveList('budgetsList', next)
    } else if (dialogType === 'reason') {
      let next
      if (editingItem) {
        next = transferReasons.map(item => item.id === editingItem.id ? { ...item, reason: fieldName } : item)
      } else {
        next = [{ id: `tr_${Date.now()}`, reason: fieldName }, ...transferReasons]
      }
      setTransferReasons(next)
      saveList('transferReasons', next)
    } else if (dialogType === 'stage') {
      let next
      if (editingItem) {
        next = propertyStages.map(item => item.id === editingItem.id ? { ...item, stage: fieldName } : item)
      } else {
        next = [{ id: `ps_${Date.now()}`, stage: fieldName }, ...propertyStages]
      }
      setPropertyStages(next)
      saveList('propertyStages', next)
    } else if (dialogType === 'type') {
      let next
      if (editingItem) {
        next = propertyTypes.map(item => item.id === editingItem.id ? { ...item, property_type: fieldName } : item)
      } else {
        next = [{ id: `pt_${Date.now()}`, property_type: fieldName }, ...propertyTypes]
      }
      setPropertyTypes(next)
      saveList('propertyTypes', next)
    } else if (dialogType === 'subType') {
      let next
      if (editingItem) {
        next = propertySubTypes.map(item => item.id === editingItem.id ? { ...item, property_sub_type: fieldName, property_type: fieldExtra } : item)
      } else {
        next = [{ id: `pst_${Date.now()}`, property_sub_type: fieldName, property_type: fieldExtra }, ...propertySubTypes]
      }
      setPropertySubTypes(next)
      saveList('propertySubTypes', next)
    }

    setToast({ open: true, msg: 'Saved successfully!', sev: 'success' })
    setDialogOpen(false)
  }

  // Memoized Column Definitions for Grid Tables
  const carouselColumns = useMemo<GridColDef[]>(() => [
    {
      field: 'url',
      headerName: 'Image',
      width: 80,
      renderCell: (p) => <Avatar src={p.value} variant="rounded" sx={{ width: 36, height: 36 }} />
    },
    {
      field: 'image_name',
      headerName: 'Image Name',
      flex: 1.2,
      minWidth: 120,
      renderCell: (p) => <Box sx={{ fontWeight: 500 }}>{p.value}</Box>
    },
    {
      field: 'created_at',
      headerName: 'Created At',
      flex: 1,
      minWidth: 120,
      renderCell: (p) => new Date(p.value as string).toLocaleDateString()
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (p) => (
        <Tooltip title="Delete">
          <IconButton size="small" color="error" onClick={() => handleDelete('carousel', p.id as string)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    }
  ], [carouselList])

  const locationColumns = useMemo<GridColDef[]>(() => [
    {
      field: 'location_name',
      headerName: 'Location',
      flex: 1.5,
      minWidth: 150,
      renderCell: (p) => <Box sx={{ fontWeight: 500 }}>{p.value}</Box>
    },
    {
      field: 'created_at',
      headerName: 'Created At',
      flex: 1,
      minWidth: 120,
      renderCell: (p) => new Date(p.value as string).toLocaleDateString()
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit('location', p.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete('location', p.id as string)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [locationsList])

  const leadSourceColumns = useMemo<GridColDef[]>(() => [
    {
      field: 'leadSource',
      headerName: 'Lead Source',
      flex: 1.5,
      minWidth: 150,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: p.row.leadSourceColor || '#000' }} />
          {p.value}
        </Box>
      )
    },
    {
      field: 'created_at',
      headerName: 'Created At',
      flex: 1,
      minWidth: 120,
      renderCell: (p) => new Date(p.value as string).toLocaleDateString()
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit('leadSource', p.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete('leadSource', p.id as string)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [leadSourceList])

  const budgetColumns = useMemo<GridColDef[]>(() => [
    {
      field: 'budget',
      headerName: 'Budget',
      flex: 1.5,
      minWidth: 150,
      renderCell: (p) => <Box sx={{ fontWeight: 500 }}>{p.value}</Box>
    },
    {
      field: 'created_at',
      headerName: 'Created At',
      flex: 1,
      minWidth: 120,
      renderCell: (p) => new Date(p.value as string).toLocaleDateString()
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit('budget', p.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete('budget', p.id as string)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [budgetsList])

  const reasonColumns = useMemo<GridColDef[]>(() => [
    {
      field: 'reason',
      headerName: 'Transfer Reason',
      flex: 2,
      minWidth: 200,
      renderCell: (p) => <Box sx={{ fontWeight: 500 }}>{p.value}</Box>
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit('reason', p.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete('reason', p.id as string)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [transferReasons])

  const stageColumns = useMemo<GridColDef[]>(() => [
    {
      field: 'stage',
      headerName: 'Property Stage',
      flex: 2,
      minWidth: 200,
      renderCell: (p) => <Box sx={{ fontWeight: 500 }}>{p.value}</Box>
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit('stage', p.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete('stage', p.id as string)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [propertyStages])

  const typeColumns = useMemo<GridColDef[]>(() => [
    {
      field: 'property_type',
      headerName: 'Property Type',
      flex: 2,
      minWidth: 200,
      renderCell: (p) => <Box sx={{ fontWeight: 500 }}>{p.value}</Box>
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit('type', p.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete('type', p.id as string)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [propertyTypes])

  const subTypeColumns = useMemo<GridColDef[]>(() => [
    {
      field: 'property_type',
      headerName: 'Property Type',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'property_sub_type',
      headerName: 'Property Sub Type',
      flex: 1.2,
      minWidth: 180,
      renderCell: (p) => <Box sx={{ fontWeight: 500 }}>{p.value}</Box>
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit('subType', p.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete('subType', p.id as string)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ], [propertySubTypes])

  // Card Header Actions components
  const carouselActions = (
    <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openAdd('carousel')}>
      Add Image
    </Button>
  )

  const locationActions = (
    <Stack direction="row" spacing={1}>
      <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openAdd('location')}>Add</Button>
      <Button variant="outlined" size="small" startIcon={<UploadIcon />} onClick={() => handleImport('Location')}>Import</Button>
      <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => handleExport('locations', ['Location', 'Created At'], locationsList.map(item => [item.location_name, item.created_at]))}>Export</Button>
    </Stack>
  )

  const leadSourceActions = (
    <Stack direction="row" spacing={1}>
      <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openAdd('leadSource')}>Add</Button>
      <Button variant="outlined" size="small" startIcon={<UploadIcon />} onClick={() => handleImport('Lead Source')}>Import</Button>
      <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => handleExport('lead_sources', ['Lead Source', 'Created At'], leadSourceList.map(item => [item.leadSource, item.created_at]))}>Export</Button>
    </Stack>
  )

  const budgetActions = (
    <Stack direction="row" spacing={1}>
      <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openAdd('budget')}>Add</Button>
      <Button variant="outlined" size="small" startIcon={<UploadIcon />} onClick={() => handleImport('Budget')}>Import</Button>
      <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => handleExport('budgets', ['Budget', 'Created At'], budgetsList.map(item => [item.budget, item.created_at]))}>Export</Button>
    </Stack>
  )

  const reasonActions = (
    <Stack direction="row" spacing={1}>
      <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openAdd('reason')}>Add</Button>
      <Button variant="outlined" size="small" startIcon={<UploadIcon />} onClick={() => handleImport('Transfer Reason')}>Import</Button>
      <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => handleExport('transfer_reasons', ['Transfer Reason'], transferReasons.map(item => [item.reason]))}>Export</Button>
    </Stack>
  )

  const stageActions = (
    <Stack direction="row" spacing={1}>
      <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openAdd('stage')}>Add</Button>
      <Button variant="outlined" size="small" startIcon={<UploadIcon />} onClick={() => handleImport('Property Stage')}>Import</Button>
      <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => handleExport('property_stages', ['Property Stage'], propertyStages.map(item => [item.stage]))}>Export</Button>
    </Stack>
  )

  const typeActions = (
    <Stack direction="row" spacing={1}>
      <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openAdd('type')}>Add</Button>
      <Button variant="outlined" size="small" startIcon={<UploadIcon />} onClick={() => handleImport('Property Type')}>Import</Button>
      <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => handleExport('property_types', ['Property Type'], propertyTypes.map(item => [item.property_type]))}>Export</Button>
    </Stack>
  )

  const subTypeActions = (
    <Stack direction="row" spacing={1}>
      <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openAdd('subType')}>Add</Button>
      <Button variant="outlined" size="small" startIcon={<UploadIcon />} onClick={() => handleImport('Property Sub Type')}>Import</Button>
      <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => handleExport('property_sub_types', ['Property Type', 'Property Sub Type'], propertySubTypes.map(item => [item.property_type, item.property_sub_type]))}>Export</Button>
    </Stack>
  )

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
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
          <Tab label="Carousel Banners" />
          <Tab label="Locations" />
          <Tab label="Lead Sources" />
          <Tab label="Budgets" />
          <Tab label="Transfer Reasons" />
          <Tab label="Property Stages" />
          <Tab label="Property Types" />
          <Tab label="Property Sub Types" />
        </Tabs>
      </Box>

      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        {activeTab === 0 && (
          <AppCard title="Carousel Images" subtitle="Manage layout media banners." action={carouselActions}>
            <Box sx={{ height: 480, width: '100%' }}>
              <AppDataGrid rows={carouselList} columns={carouselColumns} getRowId={(r) => r.id} />
            </Box>
          </AppCard>
        )}
        {activeTab === 1 && (
          <AppCard title="Location" subtitle="Manage office locations." action={locationActions}>
            <Box sx={{ height: 480, width: '100%' }}>
              <AppDataGrid rows={locationsList} columns={locationColumns} getRowId={(r) => r.id} />
            </Box>
          </AppCard>
        )}
        {activeTab === 2 && (
          <AppCard title="Lead Source" subtitle="Manage marketing channels." action={leadSourceActions}>
            <Box sx={{ height: 480, width: '100%' }}>
              <AppDataGrid rows={leadSourceList} columns={leadSourceColumns} getRowId={(r) => r.id} />
            </Box>
          </AppCard>
        )}
        {activeTab === 3 && (
          <AppCard title="Budget" subtitle="Manage price budget options." action={budgetActions}>
            <Box sx={{ height: 480, width: '100%' }}>
              <AppDataGrid rows={budgetsList} columns={budgetColumns} getRowId={(r) => r.id} />
            </Box>
          </AppCard>
        )}
        {activeTab === 4 && (
          <AppCard title="Transfer Reason" subtitle="Manage transfer explanations." action={reasonActions}>
            <Box sx={{ height: 480, width: '100%' }}>
              <AppDataGrid rows={transferReasons} columns={reasonColumns} getRowId={(r) => r.id} />
            </Box>
          </AppCard>
        )}
        {activeTab === 5 && (
          <AppCard title="Property Stage" subtitle="Manage construction pipeline stages." action={stageActions}>
            <Box sx={{ height: 480, width: '100%' }}>
              <AppDataGrid rows={propertyStages} columns={stageColumns} getRowId={(r) => r.id} />
            </Box>
          </AppCard>
        )}
        {activeTab === 6 && (
          <AppCard title="Property Type" subtitle="Manage core listing categories." action={typeActions}>
            <Box sx={{ height: 480, width: '100%' }}>
              <AppDataGrid rows={propertyTypes} columns={typeColumns} getRowId={(r) => r.id} />
            </Box>
          </AppCard>
        )}
        {activeTab === 7 && (
          <AppCard title="Property Sub Type" subtitle="Manage sub-categories." action={subTypeActions}>
            <Box sx={{ height: 480, width: '100%' }}>
              <AppDataGrid rows={propertySubTypes} columns={subTypeColumns} getRowId={(r) => r.id} />
            </Box>
          </AppCard>
        )}
      </Box>

      {/* Dynamic Popups for Adding/Editing */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingItem ? 'Edit' : 'Add'} {dialogType === 'carousel' ? 'Image' : dialogType === 'leadSource' ? 'Lead Source' : dialogType === 'subType' ? 'Sub Type' : dialogType}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
            <TextField
              fullWidth
              label={dialogType === 'carousel' ? 'Image Name' : 'Name'}
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value)}
              placeholder="Enter value"
            />
            {dialogType === 'leadSource' && (
              <TextField
                fullWidth
                label="Lead Source Color"
                type="color"
                value={fieldExtra || '#000000'}
                onChange={(e) => setFieldExtra(e.target.value)}
              />
            )}
            {dialogType === 'subType' && (
              <TextField
                fullWidth
                select
                label="Property Type"
                value={fieldExtra}
                onChange={(e) => setFieldExtra(e.target.value)}
              >
                {propertyTypes.map((pt) => (
                  <MenuItem key={pt.id} value={pt.property_type}>
                    {pt.property_type}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
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
