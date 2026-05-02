import { useMemo, useState, useRef, useEffect } from 'react'
import { industries } from '@/config/industries'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { getTableConfigs, postTableConfigs, getFormConfig, postFormConfig } from '@/services/headerConfigService'
import axiosInstance from '@/services/axiosInstance'
import { fetchContacts } from '@/features/admin/leads/api/contactsApi'
import { fetchTasks } from '@/features/admin/leads/api/tasksApi'
import { HEADER_KEYS } from '@/config/headerKeys'


const screens = [
  { id: 'organization', name: 'Organization' },
  { id: 'user', name: 'User' },

  { id: 'contacts', name: 'Contacts' },
  { id: 'tasks', name: 'Tasks' },
  { id: 'call_logs', name: 'Call Logs' },
  { id: 'bookings', name: 'Bookings' },

  { id: 'projects', name: 'Projects' },
  { id: 'api', name: 'API' },
  { id: 'booking_form', name: 'Booking Form' },
  { id: 'resources', name: 'Resources' },
  { id: 'whatsapp_api', name: 'Whatsapp API' },

  { id: 'news', name: 'News' },
  { id: 'faq', name: 'FAQ' },

  { id: 'licenses_cost', name: 'Licenses Cost' },
  { id: 'coupon', name: 'Coupon' },
  { id: 'update_password', name: 'Update Password' }
]

export default function HeadersConfigPage() {
  const [industry, setIndustry] = useState<string>(industries[0].id)
  const [screen, setScreen] = useState<string>(screens[0].id)
  const [label, setLabel] = useState<string>('')
  const [availableKeys, setAvailableKeys] = useState<string[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [usingFallbackKeys, setUsingFallbackKeys] = useState<boolean>(false)
  const [headers, setHeaders] = useState<Array<any>>([])
  const [kind, setKind] = useState<'table' | 'form'>('table')
  const [sortable, setSortable] = useState<boolean>(true)
  const [visible, setVisible] = useState<boolean>(true)
  const [inputType, setInputType] = useState<'text' | 'number' | 'select' | 'date'>('text')
  const [options, setOptions] = useState<string>('')
  const labelRef = useRef<HTMLInputElement | null>(null)
  const [saving, setSaving] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info'>('info')
  const [loadingConfigs, setLoadingConfigs] = useState(false)
  const [keysLoading, setKeysLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoadingConfigs(true)
      try {
        const fetched: any[] = []

        // fetch table configs for industry
        try {
          const data = await getTableConfigs(industry)
          if (data && Array.isArray(data.screens)) {
            const s = data.screens.find((x: any) => x.screen === screen)
            if (s && Array.isArray(s.headers)) {
              s.headers.forEach((h: any) => {
                fetched.push({
                  id: `${industry}::${screen}::table::existing_${h.key}`,
                  industry,
                  screen,
                  kind: 'table',
                  key: h.key,
                  label: h.label,
                  visible: h.visible,
                  sortable: h.sortable,
                  options: h.options || [],
                })
              })
            }
          }
        } catch (err) {
          // ignore if table config not found
          // eslint-disable-next-line no-console
          console.warn('getTableConfigs failed', err)
        }

        // fetch form config for this screen
        try {
          const d2 = await getFormConfig(screen)
          const list = Array.isArray(d2) ? d2 : [d2]
          for (const cfg of list) {
            if (cfg && (!cfg.industry_id || cfg.industry_id === industry)) {
              const fields = cfg.fields || cfg.headers || []
              for (const f of fields) {
                fetched.push({
                  id: `${industry}::${screen}::form::existing_${f.key}`,
                  industry,
                  screen,
                  kind: 'form',
                  key: f.key,
                  label: f.label,
                  inputType: f.type || 'text',
                  options: f.options || [],
                  required: !!f.required,
                })
              }
            }
          }
        } catch (err) {
          // ignore if form config not found
          // eslint-disable-next-line no-console
          console.warn('getFormConfig failed', err)
        }

        if (!cancelled) {
          setHeaders((prev) => {
            const others = prev.filter((h) => !(h.industry === industry && h.screen === screen))
            return [...fetched, ...others]
          })
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading configs', err)
        setToastSeverity('error')
        setToastMessage('Failed to load existing configs')
        setToastOpen(true)
      } finally {
        if (!cancelled) setLoadingConfigs(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [industry, screen])

  // Fetch available data keys for the selected screen (try API -> fallback to sample row)
  useEffect(() => {
    let cancelled = false
    const loadKeys = async () => {
      setKeysLoading(true)
      try {
        let row: Record<string, any> | null = null
        const defaultKeys = HEADER_KEYS

        try {
          if (screen === 'contacts') {
            const res = await fetchContacts({ industry_id: industry, limit: 1 })
            row = res?.data?.[0] ?? null
          } else if (screen === 'tasks') {
            const res = await fetchTasks({ industry_id: industry, limit: 1 })
            row = res?.data?.[0] ?? null
          } else {
            // generic endpoint attempt: GET /api/{screen}?industry_id=...&limit=1
            const res = await axiosInstance.get(`/${screen}`, { params: { industry_id: industry, limit: 1, page: 1 } })
            // backend might return { data: [...] } or an array directly
            const payload = res.data
            if (Array.isArray(payload)) row = payload[0] ?? null
            else if (payload && Array.isArray(payload.data)) row = payload.data[0] ?? null
            else row = payload ?? null
          }
        } catch (err) {
          // ignore network errors here; we'll fallback to empty
          // eslint-disable-next-line no-console
          console.warn('fetch sample row failed', err)
        }

        let keys = row ? Object.keys(row) : []
        let fallback = false
        if (!keys || keys.length === 0) {
          keys = defaultKeys
          fallback = true
        }
        if (!cancelled) {
          setAvailableKeys(keys)
          setUsingFallbackKeys(fallback)
          // clear selectedKey if it's no longer available
          if (selectedKey && !keys.includes(selectedKey)) setSelectedKey(null)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading keys', err)
      } finally {
        if (!cancelled) setKeysLoading(false)
      }
    }

    loadKeys()
    return () => { cancelled = true }
  }, [screen, industry])

  const addHeader = () => {
    const text = label.trim()
    if (!text) {
      setToastSeverity('error')
      setToastMessage('Please enter a header label')
      setToastOpen(true)
      return
    }

    if (!selectedKey) {
      setToastSeverity('error')
      setToastMessage('Please select a data key from the dropdown')
      setToastOpen(true)
      return
    }

    // prevent duplicate key for same industry/screen
    // const exists = headers.some((h) => h.industry === industry && h.screen === screen && h.key === selectedKey)

    // prevent duplicate key for same industry/screen *and kind* (allow same key in table and form)
    const exists = headers.some((h) => h.industry === industry && h.screen === screen && h.key === selectedKey && h.kind === kind)
    if (exists) {
      setToastSeverity('error')
      setToastMessage('This key is already added for the selected screen')
      setToastOpen(true)
      return
    }

    const now = Date.now()
    let entry: any
    if (kind === 'table') {
      entry = {
        id: `${industry}::${screen}::table::${now}`,
        industry,
        screen,
        kind: 'table',
        key: selectedKey,
        label: text,
        sortable,
        visible,
      }
    } else {
      entry = {
        id: `${industry}::${screen}::form::${now}`,
        industry,
        screen,
        kind: 'form',
        key: selectedKey,
        label: text,
        inputType,
        options: options.split(',').map((o) => o.trim()).filter(Boolean),
        required: false,
      }
    }

    setHeaders((s) => [...s, entry])
    setLabel('')
    setSelectedKey(null)
    setOptions('')
    setTimeout(() => labelRef.current?.focus(), 50)
  }

  const removeHeader = (id: string) => setHeaders((s) => s.filter((h) => h.id !== id));

  const moveHeader = (id: string, direction: 'up' | 'down' | 'top') => {
    setHeaders((prev) => {
      const idx = prev.findIndex((h) => h.id === id)
      if (idx === -1) return prev

      // indices of headers for current industry+screen in the full array
      const groupIndices = prev.map((h, i) => (h.industry === industry && h.screen === screen ? i : -1)).filter((i) => i !== -1) as number[]
      const posInGroup = groupIndices.indexOf(idx)
      if (posInGroup === -1) return prev

      const next = [...prev]
      if (direction === 'up' && posInGroup > 0) {
        const swapIdx = groupIndices[posInGroup - 1]
          ;[next[swapIdx], next[idx]] = [next[idx], next[swapIdx]]
        return next
      }
      if (direction === 'down' && posInGroup < groupIndices.length - 1) {
        const swapIdx = groupIndices[posInGroup + 1]
          ;[next[swapIdx], next[idx]] = [next[idx], next[swapIdx]]
        return next
      }
      if (direction === 'top' && posInGroup > 0) {
        const item = next.splice(idx, 1)[0]
        // insert before the first group index (which may have shifted if idx > firstIndex)
        const firstIndex = groupIndices[0] < idx ? groupIndices[0] : groupIndices[0]
        next.splice(firstIndex, 0, item)
        return next
      }

      return prev
    })
  }

  // const filtered = useMemo(() => headers.filter((h) => h.industry === industry && h.screen === screen), [headers, industry, screen]);
  const filtered = useMemo(() => headers.filter((h) => h.industry === industry && h.screen === screen && h.kind === kind), [headers, industry, screen, kind]);

  const handleHeaderSubmit = async (headers: any[]) => {
    try {
      // Build payload matching backend desired structure:
      // { industry_id, screens: [ { screen, headers: [ { key,label,type,visible,sortable,options } ] } ] }
      const normalizeKey = (label: string) =>
        label
          .toString()
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_')
          .replace(/[^a-z0-9_]/g, '')

      const byScreen: Record<string, any[]> = {}
      headers.forEach((h) => {
        // ensure header belongs to current industry (fallback)
        if (h.industry && h.industry !== industry) return
        const scr = h.screen ?? screen
        byScreen[scr] = byScreen[scr] || []
        byScreen[scr].push(h)
      })

      // split payloads: table headers -> /table-configs, form fields -> /form-configs
      setSaving(true)

      // build table payload: screens with table-kind headers only
      const tableScreens = Object.entries(byScreen)
        .map(([scr, items]) => ({
          screen: scr,
          headers: (items as any[])
            .filter((i) => i.kind === 'table')
            .map((h: any) => ({
              key: h.key ?? normalizeKey(h.label),
              label: h.label,
              type: 'text',
              visible: typeof h.visible === 'boolean' ? h.visible : true,
              sortable: typeof h.sortable === 'boolean' ? h.sortable : false,
              ...(h.options ? { options: h.options } : {}),
            })),
        }))
        .filter((s) => Array.isArray(s.headers) && s.headers.length > 0)

      if (tableScreens.length > 0) {
        // POST to /table-configs via service
        // eslint-disable-next-line no-console
        console.log('Posting table-configs', { industry_id: industry, screens: tableScreens })
        await postTableConfigs({ industry_id: industry, screens: tableScreens })
      }

      // build and post form configs per screen
      for (const [scr, items] of Object.entries(byScreen)) {
        const formItems = (items as any[]).filter((i) => i.kind === 'form')
        if (formItems.length === 0) continue

        const fields = formItems.map((h: any) => ({
          key: h.key ?? normalizeKey(h.label),
          label: h.label,
          type: h.inputType ?? 'text',
          options: h.options ?? [],
          required: typeof h.required === 'boolean' ? h.required : false,
          inForm: typeof h.inForm === 'boolean' ? h.inForm : true,
          inTable: typeof h.inTable === 'boolean' ? h.inTable : false,
        }))

        const formPayload = { industry_id: industry, form_name: scr, fields }
        // eslint-disable-next-line no-console
        console.log('Posting form-configs', formPayload)
        await postFormConfig(formPayload)
      }

      // success
      // eslint-disable-next-line no-console
      console.log('Headers saved')
      setToastSeverity('success')
      setToastMessage('Headers saved successfully!')
      setToastOpen(true)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error saving headers:', err)
      setToastSeverity('error')
      setToastMessage('Failed to save headers. Please try again.')
      setToastOpen(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 }, width: '100%', minWidth: 0 }}>
      <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
        (Before creating and launching the organization, create headers for all five screens to establish a cohesive and consistent visual identity)
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              select
              label="Industries"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              fullWidth
              size="small"
            >
              {industries.map((ind) => (
                <MenuItem key={ind.id} value={ind.id}>{ind.name}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Screen"
              value={screen}
              onChange={(e) => setScreen(e.target.value)}
              fullWidth
              size="small"
            >
              {screens.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
            sx={{ flexWrap: { xs: 'wrap', sm: 'nowrap' } }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ minWidth: { xs: '100%', sm: 420 }, flex: '1 1 auto' }}>
              <TextField
                label="Header label"
                placeholder="Enter friendly label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                inputRef={(el) => { labelRef.current = el }}
                fullWidth
                size="small"
                sx={{ '& .MuiInputBase-root': { height: 45, alignItems: 'center' } }}
              />

              <Autocomplete
                options={availableKeys}
                value={selectedKey}
                onChange={(_, newVal) => setSelectedKey(newVal)}
                freeSolo={false}
                size="small"
                sx={{ width: { xs: '100%', sm: 220 }, '& .MuiInputBase-root': { height: 45, alignItems: 'center' } }}
                loading={keysLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Data key"
                    placeholder={keysLoading ? 'Loading keys...' : (availableKeys.length ? 'Select key' : 'No keys available')}
                    size="small"
                    sx={{ '& .MuiInputBase-root': { height: 45, alignItems: 'center' } }}
                  />
                )}
              />
            </Stack>

            {(!keysLoading && availableKeys.length === 0) && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                No sample keys found for this screen — try switching to a screen that returns data or ensure API is reachable.
              </Typography>
            )}

            {(!keysLoading && availableKeys.length > 0 && usingFallbackKeys) && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Showing default sample keys. These are fallback suggestions — replace with real keys by switching to a screen that returns data.
              </Typography>
            )}

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              sx={{ flexShrink: 0, ml: { xs: 0, sm: 1 }, width: { xs: '100%', sm: 'auto' } }}
            >
              <TextField
                select
                size="small"
                value={kind}
                onChange={(e) => setKind(e.target.value as any)}
                sx={{ minWidth: 140, width: { xs: '100%', sm: 'auto' }, '& .MuiInputBase-root': { height: 45, alignItems: 'center' } }}
              >
                <MenuItem value="table">Table Header</MenuItem>
                <MenuItem value="form">Form Field</MenuItem>
              </TextField>

              {kind === 'table' ? (
                <Stack direction={{ xs: 'row', sm: 'row' }} spacing={1} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' }, flexWrap: 'wrap' }}>
                  <FormControlLabel control={<Checkbox checked={sortable} onChange={(e) => setSortable(e.target.checked)} />} label="Sortable" />
                  <FormControlLabel control={<Checkbox checked={visible} onChange={(e) => setVisible(e.target.checked)} />} label="Visible" />
                </Stack>
              ) : (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  <TextField
                    select
                    size="small"
                    value={inputType}
                    onChange={(e) => setInputType(e.target.value as any)}
                    sx={{ minWidth: 120, width: { xs: '100%', sm: 'auto' } }}
                  >
                    <MenuItem value="text">Text</MenuItem>
                    <MenuItem value="number">Number</MenuItem>
                    <MenuItem value="select">Select</MenuItem>
                    <MenuItem value="date">Date</MenuItem>
                  </TextField>
                  {inputType === 'select' && (
                    <TextField size="small" placeholder="option1, option2" value={options} onChange={(e) => setOptions(e.target.value)} sx={{ minWidth: 180, width: { xs: '100%', sm: 'auto' } }} />
                  )}
                </Stack>
              )}

              <Button
                type="button"
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addHeader}
                disabled={loadingConfigs}
                sx={{ whiteSpace: 'nowrap', minWidth: 120, width: { xs: '100%', sm: 'auto' }, mt: { xs: 1, sm: 0 } }}
              >
                Add Header
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>Preview for selected Industry / Screen</Typography>

          <Stack spacing={1} sx={{ mb: 1 }}>
            {filtered.length === 0 ? (
              <Typography color="text.secondary">No headers configured for this screen.</Typography>
            ) : (
              filtered.map((h) => (
                <Box key={h.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  {/* <Chip label={`${h.label}${h.key ? ` — ${h.key}` : ''}`} /> */}
                  <Chip label={`${h.label}${h.key ? ` — ${h.key}` : ''}${h.kind === 'form' ? ` (${h.inputType ?? 'text'})` : ''}`} />
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton size="small" onClick={() => moveHeader(h.id, 'top')} title="Move to top">
                      <VerticalAlignTopIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => moveHeader(h.id, 'up')} title="Move up">
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => moveHeader(h.id, 'down')} title="Move down">
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => removeHeader(h.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Box>
              ))
            )}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ pt: 1, justifyContent: 'center', width: '100%' }}>
            <Button
              variant="contained"
              onClick={() => handleHeaderSubmit(headers)}
              disabled={saving || loadingConfigs}
              startIcon={(saving || loadingConfigs) ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {(saving || loadingConfigs) ? 'Saving...' : 'Save'}
            </Button>

            <Button variant="outlined" onClick={() => setHeaders([])} disabled={saving}>Reset</Button>
          </Stack>
        </CardContent>
      </Card>
      <Snackbar
        open={toastOpen}
        autoHideDuration={3500}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToastOpen(false)} severity={toastSeverity} sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
