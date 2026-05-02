import { useMemo, useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import Avatar from '@mui/material/Avatar'
import Collapse from '@mui/material/Collapse'
import Tooltip from '@mui/material/Tooltip'
import { useTheme, alpha } from '@mui/material/styles'
import { industries } from '@/config/industries'
import { getMenuConfigForRole } from '@/config/menuConfig'
import { assignSidebar, fetchSidebar } from '@/features/sidebar/api/sidebarService'
import type { UserRole } from '@/types/user'
import { AppCard } from '@/components/ui/AppCard'

function flattenMenu(role:any) {
  const menu = getMenuConfigForRole(role) as any
  const items: { id: string; label: string }[] = []

  // If menu already in MenuSection[] shape, keep existing behaviour
  if (Array.isArray(menu) && menu.length > 0 && (menu[0] as any).items) {
    menu.forEach((section: any) => {
      section.items.forEach((item: any) => {
        items.push({ id: item.label, label: item.label })
        item.children?.forEach((child: any) => {
          const childId = `${item.label} > ${child.label}`
          items.push({ id: childId, label: `${item.label} / ${child.label}` })
        })
      })
    })
    return items
  }

  // Otherwise handle flat SuperAdminMenuItem[] shape: group by `module` or first path segment
  const flat: any[] = Array.isArray(menu) ? menu : []
  const groups: Record<string, any[]> = {}
  const order: string[] = []

  const getModuleKey = (it: any) => {
    if (it.module) return String(it.module).toLowerCase()
    if (it.route) {
      const seg = String(it.route).split('/').filter(Boolean)[0]
      return seg ?? 'misc'
    }
    return 'misc'
  }

  const getLabelForModule = (modKey: string, sample?: any) => {
    if (!sample) return modKey.charAt(0).toUpperCase() + modKey.slice(1)
    if (sample.module) return sample.module
    return modKey.charAt(0).toUpperCase() + modKey.slice(1)
  }

  flat.forEach((it) => {
    const key = getModuleKey(it)
    if (!groups[key]) {
      groups[key] = []
      order.push(key)
    }
    groups[key].push(it)
  })

  order.forEach((key) => {
    const entries = groups[key]
    const moduleLabel = getLabelForModule(key, entries[0])

    if (entries.length === 1) {
      const it = entries[0]
      items.push({ id: it.name ?? it.label ?? moduleLabel, label: it.name ?? it.label ?? moduleLabel })
      return
    }

    // multiple entries -> parent + children
    items.push({ id: moduleLabel, label: moduleLabel })
    entries.forEach((it) => {
      const childId = `${moduleLabel} > ${it.name ?? it.label}`
      items.push({ id: childId, label: `${moduleLabel} / ${it.name ?? it.label}` })
    })
  })

  return items
}

const SidebarConfigPage = () => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const [industryId, setIndustryId] = useState<string>(industries[0]?.id ?? '')
  const [roleId, setRoleId] = useState<UserRole>('admin')
  const menuOptions = useMemo(() => flattenMenu(roleId), [roleId])
  const [selectedMenus, setSelectedMenus] = useState<string[]>([])
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [rolesStatus, setRolesStatus] = useState<Record<string, boolean>>({})
  const [reminderOpen, setReminderOpen] = useState(false)
  const [reminderMessage, setReminderMessage] = useState('')
  const [previewCollapsed, setPreviewCollapsed] = useState(false)
  const [isLoadingAssigned, setIsLoadingAssigned] = useState(false)

  const handleMenusChange = (_: any, value: string[]) => setSelectedMenus(value)

  const detectAssigned = (res: any, role: string): boolean => {
    if (!res) return false

    // Array responses
    if (Array.isArray(res)) {
      if (res.length === 0) return false
      // array of strings -> menus assigned
      if (typeof res[0] === 'string') return res.length > 0
      // array of role entries like [{ role, menus: [...] }, ...]
      if ((res[0] as any).hasOwnProperty('role') && (res[0] as any).hasOwnProperty('menus')) {
        const roleEntry = (res as any[]).find((r) => r.role === role) || (res as any[])[0]
        return Array.isArray(roleEntry.menus) ? roleEntry.menus.length > 0 : Boolean(roleEntry.menus)
      }
      // otherwise assume array of menu objects
      return true
    }

    // Object with roles array -> find role and check menus length
    if (res.roles && Array.isArray(res.roles)) {
      const match = res.roles.find((x: any) => x.role === role)
      if (!match) return false
      if (Array.isArray(match.menus)) return match.menus.length > 0
      return Boolean(match.menus)
    }

    // Object with top-level menus array
    if (res.menus && Array.isArray(res.menus)) return res.menus.length > 0

    return false
  }

  useEffect(() => {
    let mounted = true
    const loadAssigned = async () => {
      setIsLoadingAssigned(true)
      try {
        const resp = await fetchSidebar(roleId, industryId)

        const mapRespToIds = (res: any): string[] => {
          const cfg = getMenuConfigForRole(roleId) as any
          // Support both MenuSection[] and flat SuperAdminMenuItem[] shapes
          let allItems: any[] = []
          if (Array.isArray(cfg) && cfg.length > 0 && (cfg[0] as any).items) {
            allItems = cfg.flatMap((s: any) => s.items)
          } else if (Array.isArray(cfg)) {
            // convert flat SuperAdminMenuItem[] into parent items with children
            const groups: Record<string, { label: string; icon?: string; children?: any[] }> = {}
            cfg.forEach((it: any) => {
              const modKey = (it.module ?? (it.route ? it.route.split('/').filter(Boolean)[0] : 'misc'))
              const key = String(modKey).toLowerCase()
              if (!groups[key]) groups[key] = { label: it.module ?? String(modKey), children: [] }
              groups[key].children!.push({ label: it.name ?? it.label ?? it.route ?? key, icon: it.icon })
            })
            allItems = Object.values(groups).map((g) => ({ label: g.label, children: g.children }))
          } else {
            allItems = []
          }
          const normalized = (s: string) => s.trim().toLowerCase()
          const out: string[] = []

          if (!res) return out

          // handle array responses
          if (Array.isArray(res)) {
            // array of strings
            if (res.length > 0 && typeof res[0] === 'string') return res as string[]
            // array of role entries: [{ role, menus: [...] }, ...]
            if (res.length > 0 && (res[0] as any).hasOwnProperty('menus')) {
              const roleEntry = (res as any[]).find((x) => x.role === roleId) || (res as any[])[0]
              if (roleEntry && Array.isArray(roleEntry.menus)) return mapRespToIds({ menus: roleEntry.menus })
            }
            // array of menu objects
            res.forEach((it: any) => {
              if (it.name) out.push(it.name)
              it.children?.forEach((ch: any) => {
                if (ch.name) out.push(`${it.name} > ${ch.name}`)
              })
            })
            return out
          }

          // object with menus array
          if (res.menus && Array.isArray(res.menus)) {
            res.menus.forEach((m: any) => {
              if (typeof m === 'string') {
                out.push(m)
                return
              }

              // try mapping by key: 'parent.child'
              if (m.key && typeof m.key === 'string') {
                const parts = m.key.split('.')
                const parentKey = parts[0]
                const childKey = parts[1]
                const parent = allItems.find((it) => it.icon === parentKey || normalized(it.label).replace(/\s+/g, '_') === parentKey)
                if (parent) {
                  if (childKey && Array.isArray(parent.children)) {
                    const child = parent.children.find((c: any) => c.icon === childKey || normalized(c.label).replace(/\s+/g, '_') === childKey)
                    if (child) out.push(`${parent.label} > ${child.label}`)
                    else out.push(parent.label)
                  } else {
                    out.push(parent.label)
                  }
                  return
                }
              }

              // fallback: map by name (try children first)
              if (m.name && typeof m.name === 'string') {
                const nameNorm = normalized(m.name)
                let found = false
                for (const it of allItems) {
                  if (it.children) {
                    const child = it.children.find((c: any) => normalized(c.label) === nameNorm || normalized(c.label).includes(nameNorm) || nameNorm.includes(normalized(c.label)))
                    if (child) {
                      out.push(`${it.label} > ${child.label}`)
                      found = true
                      break
                    }
                  }
                  if (!found && normalized(it.label) === nameNorm) {
                    out.push(it.label)
                    found = true
                    break
                  }
                }
                if (!found) out.push(m.name)
              }
            })
          }

          // roles-based response
          if (res.roles && Array.isArray(res.roles)) {
            const match = res.roles.find((r: any) => r.role === roleId)
            if (match && Array.isArray(match.menus)) return mapRespToIds({ menus: match.menus })
          }

          return out
        }

        const ids = mapRespToIds(resp)
        const valid = ids.filter((id) => menuOptions.some((m) => m.id === id))
        if (mounted) setSelectedMenus(valid)
      } catch (err) {
        console.error('loadAssigned error', err)
      } finally {
        if (mounted) setIsLoadingAssigned(false)
      }
    }
    void loadAssigned()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId, industryId])

  const loadRolesStatus = async () => {
    try {
      const rolesList: UserRole[] = ['admin', 'leadManager', 'teamLead', 'sales']
      const results = await Promise.all(rolesList.map((r) => fetchSidebar(r, industryId)))
      const status: Record<string, boolean> = {}
      rolesList.forEach((r, i) => { status[r] = detectAssigned(results[i], r) })
      setRolesStatus(status)
    } catch (err) {
      console.error(err)
    }
  }

  // Build payload expected by backend: full menu objects { key, name, route, icon, module }
  const buildMenusPayload = (menuIds: string[]) => {
    const rawConfig = getMenuConfigForRole(roleId) as any
    // Normalize to MenuSection[] shape so lookup by label works regardless of source shape
    let config: any[] = []
    if (Array.isArray(rawConfig) && rawConfig.length > 0 && (rawConfig[0] as any).items) {
      config = rawConfig
    } else if (Array.isArray(rawConfig)) {
      const groups: Record<string, { title?: string; items: any[] }> = {}
      const order: string[] = []
      rawConfig.forEach((it: any) => {
        const mod = (it.module ?? (it.route ? it.route.split('/').filter(Boolean)[0] : 'misc'))
        const key = String(mod).toLowerCase()
        if (!groups[key]) {
          groups[key] = { title: it.module ?? String(mod), items: [] }
          order.push(key)
        }
        groups[key].items.push({ label: it.name ?? it.label ?? (it.route ?? key), icon: it.icon, path: it.route })
      })
      config = order.map((k) => ({ title: groups[k].title, items: groups[k].items }))
    } else {
      config = []
    }

    const items: { key: string; name: string; route?: string; icon?: string; module?: string }[] = []
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '_')

    menuIds.forEach((id) => {
      const parts = id.split(' > ').map((p) => p.trim())
      if (parts.length === 1) {
        const parentLabel = parts[0]
        for (const section of config) {
          const match = section.items.find((it: any) => it.label === parentLabel)
          if (match) {
            const parentKey = (match.icon as string) ?? normalize(parentLabel)
            const route = match.path ?? match.route
            const icon = (match.icon as string) ?? undefined
            const module = (match.icon as string) ?? normalize(parentLabel)
            items.push({ key: parentKey, name: match.label, route, icon, module })
            break
          }
        }
      } else {
        const [parentLabel, childLabel] = parts
        // Try find parent as an item label first, otherwise try matching section title (module)
        let matched = false
        for (const section of config) {
          // find child where parent was represented as an item with children
          const parent = section.items.find((it: any) => it.label === parentLabel)
          if (parent) {
            const children = Array.isArray(parent.children) ? parent.children : []
            const child = children.find((c: any) => c.label === childLabel)
            const parentKey = (parent.icon as string) ?? normalize(parentLabel)
            const childKey = (child?.icon as string) ?? normalize(childLabel)
            const route = child?.path ?? child?.route ?? parent.path ?? parent.route
            const icon = (child?.icon as string) ?? (parent.icon as string) ?? undefined
            const module = (parent.icon as string) ?? normalize(parentLabel)
            items.push({ key: `${parentKey}.${childKey}`, name: child ? child.label : childLabel, route, icon, module })
            matched = true
            break
          }
          // If parentLabel matches the section title (module), look for child in this section's items
          if (!matched && section.title && section.title === parentLabel) {
            const child = section.items.find((it: any) => it.label === childLabel)
            if (child) {
              const parentKey = normalize(String(section.title))
              const childKey = (child.icon as string) ?? normalize(childLabel)
              const route = child.path ?? child.route
              const icon = (child.icon as string) ?? undefined
              const module = normalize(String(section.title))
              items.push({ key: `${parentKey}.${childKey}`, name: child.label, route, icon, module })
              matched = true
              break
            }
          }
        }
      }
    })

    return items
  }

  const handleSave = async () => {
    const menusPayload = buildMenusPayload(selectedMenus)
    console.log('Saving with payload', { industry_id: industryId, role: roleId, menus: menusPayload });
    setIsSaving(true)
    try {
      await assignSidebar({ industry_id: industryId, role: roleId, menus: menusPayload })
      await loadRolesStatus()
      if (rolesStatus[roleId]) {
        setReminderMessage(`Users with role "${roleId}" have been updated and will see the new sidebar.`)
        setReminderOpen(true)
      }
      setToastMessage('Sidebar updated successfully')
      setToastOpen(true)
    } catch (err) {
      console.error(err)
      setToastMessage('Failed to save sidebar')
      setToastOpen(true)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLaunch = async () => {
    const menusPayload = buildMenusPayload(selectedMenus)
    setIsSaving(true)
    try {
      await assignSidebar({ industry_id: industryId, role: roleId, menus: menusPayload, is_ready_to_launch: true })
      setToastMessage('Sidebar launched successfully')
      setToastOpen(true)
      await loadRolesStatus()
    } catch (err) {
      console.error(err)
      setToastMessage('Failed to launch')
      setToastOpen(true)
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => { void loadRolesStatus() }, [industryId])

  const roles = [
    { id: 'admin', label: 'Admin' },
    { id: 'leadManager', label: 'Lead Manager' },
    { id: 'teamLead', label: 'Team Lead' },
    { id: 'sales', label: 'Sales' },
  ] as const

  const rolesList: UserRole[] = roles.map((r) => r.id as UserRole)
  const allAssigned = rolesList.length > 0 && rolesList.every((r) => Boolean(rolesStatus[r]))

  // ── Shared card styles ────────────────────────────────────────────────────
  const cardSx = {
    borderRadius: '14px',
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: isDark
      ? '0 2px 8px rgba(0,0,0,0.35)'
      : '0 2px 8px rgba(15,17,23,0.06)',
    backgroundColor: theme.palette.background.paper,
    overflow: 'hidden',
    width: '100%',
    minWidth: 0,
  }

  const cardHeaderSx = {
    px: { xs: 2, sm: 2.5 },
    py: { xs: 1.5, sm: 2 },
    '& .MuiCardHeader-content': { minWidth: 0 },
    '& .MuiCardHeader-title': {
      fontSize: 'clamp(0.9375rem, 2.5vw, 1.0625rem)',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    '& .MuiCardHeader-subheader': {
      fontSize: 'clamp(0.75rem, 1.8vw, 0.8125rem)',
      mt: 0.25,
    },
    '& .MuiCardHeader-action': {
      // Prevent action from shrinking/overflowing on mobile
      margin: 0,
      alignSelf: 'flex-start',
      flexShrink: 0,
    },
  }

  return (
    <AppCard title="Industry Sidebar Configuration" subtitle="Assign menus per industry and role.">
      {/* ── Two-column on md+, single column on mobile ────────── */}
      <Box
        sx={{
          display: 'grid',
          // On mobile: 1 column. On md+: config | preview (360px)
          gridTemplateColumns: { xs: '1fr', md: '1fr 340px' },
          gap: { xs: 2, sm: 2.5, md: 3 },
          width: '100%',
          minWidth: 0,
        }}
      >
        {/* ── LEFT: Configure card ─────────────────────────────── */}
        <Card sx={cardSx}>

          <Divider />

          {isLoadingAssigned ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={36} />
            </Box>
          ) : (
            <>
              {isSaving && <LinearProgress />}
              <CardContent sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 2, sm: 2.5 } }}>
                <Stack spacing={{ xs: 2.5, sm: 3 }}>

                  {/* ── Role selector: scrollable chips on mobile ───── */}
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 'clamp(0.8125rem, 2vw, 0.9rem)',
                        mb: 1.25,
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                      }}
                    >
                      Role
                    </Typography>

                    {/* Scrollable row on mobile — no wrapping overflow */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        // On mobile, allow scroll if too many chips
                        overflowX: { xs: 'auto', sm: 'visible' },
                        pb: { xs: 0.5, sm: 0 },
                        // Hide scrollbar but keep functionality
                        '&::-webkit-scrollbar': { height: 3 },
                        '&::-webkit-scrollbar-thumb': {
                          borderRadius: 999,
                          background: alpha(theme.palette.text.secondary, 0.2),
                        },
                      }}
                    >
                      {roles.map((r) => {
                        const isSelected = roleId === r.id
                        const isAssigned = Boolean(rolesStatus[r.id])
                        return (
                          <Box
                            key={r.id}
                            component="button"
                            type="button"
                            onClick={() => setRoleId(r.id as UserRole)}
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.75,
                              px: { xs: 1.25, sm: 1.5 },
                              py: { xs: 0.625, sm: 0.75 },
                              borderRadius: '10px',
                              border: `1.5px solid ${isSelected
                                ? theme.palette.primary.main
                                : theme.palette.divider}`,
                              backgroundColor: isSelected
                                ? alpha(theme.palette.primary.main, isDark ? 0.16 : 0.08)
                                : theme.palette.background.default,
                              color: isSelected
                                ? theme.palette.primary.main
                                : theme.palette.text.secondary,
                              fontFamily: theme.typography.fontFamily,
                              fontSize: 'clamp(0.75rem, 1.8vw, 0.8125rem)',
                              fontWeight: isSelected ? 600 : 500,
                              cursor: 'pointer',
                              transition: 'all 160ms ease',
                              whiteSpace: 'nowrap',
                              // Minimum touch target
                              minHeight: 38,
                              outline: 'none',
                                '&:hover': {
                                borderColor: theme.palette.primary.main,
                                color: theme.palette.primary.main,
                                backgroundColor: alpha(theme.palette.primary.main, 0.06),
                              },
                              '&:active': {
                                transform: 'scale(0.97)',
                              },
                            }}
                          >
                            {r.label}
                            {/* Assigned indicator dot */}
                            {isAssigned && (
                              <Box
                                sx={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: '50%',
                                  backgroundColor: isSelected
                                    ? theme.palette.primary.main
                                    : '#22c55e',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </Box>
                        )
                      })}
                    </Box>
                  </Box>

                  {/* ── Industry + Role dropdowns: side-by-side on sm+ ── */}
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: { xs: 1.75, sm: 2 },
                    }}
                  >
                    <TextField
                      select
                      value={industryId}
                      label="Industry"
                      onChange={(e) => setIndustryId(e.target.value)}
                      size="small"
                      fullWidth
                      sx={{
                        '& .MuiInputBase-input': { fontSize: '0.875rem' },
                        '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                      }}
                    >
                      {industries.map((ind) => (
                        <MenuItem key={ind.id} value={ind.id} sx={{ fontSize: '0.875rem' }}>
                          {ind.name}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      value={roleId}
                      label="Role"
                      onChange={(e) => setRoleId(e.target.value as UserRole)}
                      size="small"
                      fullWidth
                      sx={{
                        '& .MuiInputBase-input': { fontSize: '0.875rem' },
                        '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                      }}
                    >
                      {roles.map((r) => (
                        <MenuItem key={r.id} value={r.id} sx={{ fontSize: '0.875rem' }}>
                          {r.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>

                  {/* ── Assign Menus autocomplete ────────────────────── */}
                  <Box>
                    <Typography
                      sx={{
                        fontSize: 'clamp(0.8125rem, 2vw, 0.9rem)',
                        mb: 1.25,
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                      }}
                    >
                      Assign Menus
                    </Typography>
                    <Autocomplete
                      multiple
                      options={menuOptions.map((m) => m.id)}
                      value={selectedMenus}
                      onChange={handleMenusChange}
                      freeSolo={false}
                      filterSelectedOptions
                      disableCloseOnSelect
                      loading={isLoadingAssigned}
                      renderTags={(value: string[], getTagProps) =>
                        value.map((option: string, index: number) => (
                          <Chip
                            label={option}
                            size="small"
                            {...getTagProps({ index })}
                            key={option}
                            sx={{
                              fontSize: 'clamp(0.6875rem, 1.5vw, 0.75rem)',
                              height: 24,
                              maxWidth: { xs: '9rem', sm: '14rem' },
                              '& .MuiChip-label': {
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              },
                            }}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search and select menus…"
                          size="small"
                          helperText="Tip: select multiple menus. Use search to quickly find items."
                          sx={{
                            '& .MuiInputBase-root': {
                              flexWrap: 'wrap',
                              // Chips wrap properly on mobile
                              gap: 0.5,
                              p: '6px 8px',
                              minHeight: 42,
                            },
                            '& .MuiFormHelperText-root': {
                              fontSize: '0.75rem',
                              mt: 0.5,
                            },
                          }}
                        />
                      )}
                      // Popover stays within viewport on mobile
                      slotProps={{
                        popper: {
                          sx: {
                            zIndex: 1400,
                            '& .MuiPaper-root': {
                              maxHeight: { xs: '45vh', sm: '50vh' },
                              overflowY: 'auto',
                            },
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* ── Save / Launch button — full width on mobile ──── */}
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1.25}
                    sx={{ pt: 0.5, justifyContent: { xs: 'stretch', sm: 'center' }, flexWrap: 'wrap' }}
                  >
                    <Button
                      variant="contained"
                      onClick={allAssigned ? handleLaunch : handleSave}
                      disabled={isSaving}
                      sx={{
                        width: { xs: '100%', sm: 200 },
                        py: { xs: 0.875, sm: 0.75 },
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        borderRadius: '10px',
                      }}
                    >
                      {isSaving ? 'Please wait…' : allAssigned ? 'Launch Sidebar' : 'Save Configuration'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setSelectedMenus([])}
                      disabled={isSaving}
                      sx={{
                        width: { xs: '100%', sm: 200 },
                        py: { xs: 0.875, sm: 0.75 },
                        fontWeight: 500,
                        borderRadius: '10px',
                      }}
                    >
                      Reset
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </>
          )}
        </Card>

        {/* ── RIGHT: Preview card ──────────────────────────────── */}
        <Card sx={{ ...cardSx, height: { xs: 'auto', md: 'fit-content' } }}>
          <CardHeader
            title="Preview"
            subheader="How the sidebar will appear for the selected role"
            sx={cardHeaderSx}
            action={
              <Tooltip title={previewCollapsed ? 'Expand preview' : 'Collapse preview'}>
                <IconButton
                  size="small"
                  onClick={() => setPreviewCollapsed((s) => !s)}
                  sx={{
                    minWidth: 36,
                    minHeight: 36,
                    borderRadius: '8px',
                    border: `1px solid ${theme.palette.divider}`,
                    fontSize: '1rem',
                  }}
                >
                  {previewCollapsed ? '⤢' : '⤡'}
                </IconButton>
              </Tooltip>
            }
          />
          <Divider />

          <CardContent sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 1.5, sm: 2 } }}>
            <Collapse in={!previewCollapsed} timeout={220}>
              {selectedMenus.length === 0 ? (
                <Box
                  sx={{
                    py: 4,
                    textAlign: 'center',
                    color: theme.palette.text.secondary,
                  }}
                >
                  <Typography
                    sx={{ fontSize: '2rem', mb: 1, lineHeight: 1 }}
                  >
                    📋
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    No menus selected
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}
                  >
                    Selected menus will appear here
                  </Typography>
                </Box>
              ) : (
                <List dense disablePadding>
                  {selectedMenus.map((m) => (
                    <ListItem
                      key={m}
                      sx={{
                        borderRadius: '8px',
                        mb: 0.5,
                        px: 1,
                        py: { xs: 0.625, sm: 0.5 },
                        minHeight: 42,
                        transition: 'background 140ms ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.06),
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 44 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.22 : 0.12),
                            color: theme.palette.primary.main,
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                          }}
                        >
                          {m[0]?.toUpperCase() ?? '?'}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={m}
                        primaryTypographyProps={{
                          sx: {
                            fontSize: 'clamp(0.8125rem, 2vw, 0.875rem)',
                            fontWeight: 500,
                            color: theme.palette.text.primary,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Collapse>

            <Collapse in={previewCollapsed} timeout={220}>
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={1}
                sx={{ py: 1 }}
              >
                {selectedMenus.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No items
                  </Typography>
                ) : (
                  selectedMenus.map((m) => (
                    <Tooltip key={m} title={m}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: alpha(theme.palette.primary.main, isDark ? 0.22 : 0.12),
                          color: theme.palette.primary.main,
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          cursor: 'default',
                        }}
                      >
                        {m[0]?.toUpperCase()}
                      </Avatar>
                    </Tooltip>
                  ))
                )}
              </Stack>
            </Collapse>
          </CardContent>
        </Card>
      </Box>

      {/* ── Toast notifications ──────────────────────────────── */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        message={toastMessage || 'Sidebar updated successfully'}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          // Stay above mobile nav bars
          bottom: { xs: 'max(1rem, env(safe-area-inset-bottom, 1rem))', sm: '1.5rem' },
        }}
      />
      <Snackbar
        open={reminderOpen}
        autoHideDuration={5000}
        onClose={() => setReminderOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          bottom: { xs: 'max(4rem, env(safe-area-inset-bottom, 4rem))', sm: '5rem' },
        }}
      >
        <Alert
          onClose={() => setReminderOpen(false)}
          severity="info"
          sx={{ width: '100%', maxWidth: 'calc(100vw - 2rem)' }}
        >
          {reminderMessage}
        </Alert>
      </Snackbar>
    </AppCard>
  )
}

export default SidebarConfigPage
