import { useEffect, useState } from 'react'

import ApiOutlinedIcon from '@mui/icons-material/ApiOutlined'
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import CallOutlinedIcon from '@mui/icons-material/CallOutlined'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined'
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined'
import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import MenuOpenRoundedIcon from '@mui/icons-material/MenuOpenRounded'
import NewspaperOutlinedIcon from '@mui/icons-material/NewspaperOutlined'
import PermContactCalendarOutlinedIcon from '@mui/icons-material/PermContactCalendarOutlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import SortOutlinedIcon from '@mui/icons-material/SortOutlined'
import SwitchAccountOutlinedIcon from '@mui/icons-material/SwitchAccountOutlined'
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined'
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'

import { NavLink, useLocation } from 'react-router-dom'

import type { MenuIconKey } from '@/config/menuConfig'
import { useSidebarMenu } from '@/features/sidebar/hooks/useSidebarMenu'
import type { SidebarNavItem } from '@/features/sidebar/types/sidebar.types'

// ── Icon map ──────────────────────────────────────────────────────────────────
const iconMap: Partial<Record<MenuIconKey, typeof AppsOutlinedIcon>> = {
  account: SwitchAccountOutlinedIcon,
  analytics: AssessmentOutlinedIcon,
  api: ApiOutlinedIcon,
  billing: CreditCardOutlinedIcon,
  blog: ArticleOutlinedIcon,
  booking: ReceiptLongOutlinedIcon,
  call: CallOutlinedIcon,
  configuration: SettingsOutlinedIcon,
  contact: PermContactCalendarOutlinedIcon,
  coupon: Inventory2OutlinedIcon,
  dashboard: AppsOutlinedIcon,
  data: DataObjectOutlinedIcon,
  faq: HelpOutlineRoundedIcon,
  headers: ArticleOutlinedIcon,
  leads: Groups2OutlinedIcon,
  news: NewspaperOutlinedIcon,
  organization: BusinessOutlinedIcon,
  password: VpnKeyOutlinedIcon,
  projects: BusinessOutlinedIcon,
  resources: DataObjectOutlinedIcon,
  integrations: DataObjectOutlinedIcon,
  settings: SettingsOutlinedIcon,
  shield: ShieldOutlinedIcon,
  sidebar: MenuOpenRoundedIcon,
  sort: SortOutlinedIcon,
  support: SupportAgentOutlinedIcon,
  tasks: AssignmentOutlinedIcon,
  users: Groups2OutlinedIcon,
  whatsapp: WhatsAppIcon,
}

function getIcon(iconKey?: MenuIconKey) {
  return iconKey ? (iconMap[iconKey] ?? AppsOutlinedIcon) : AppsOutlinedIcon
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onMobileClose?: () => void
}

export function Sidebar({ collapsed, onToggle, onMobileClose }: SidebarProps) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const location = useLocation()

  const { menu, loading, error } = useSidebarMenu()

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const toggleExpand = (id: string) =>
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }))

  // Expand all parents that have children by default
  useEffect(() => {
    const defaults = menu.reduce<Record<string, boolean>>((acc, it) => {
      if (it.children && it.children.length) acc[it.id] = true
      return acc
    }, {})
    setExpandedItems((prev) => ({ ...defaults, ...prev }))
  }, [menu])

  // Auto-expand parents that contain the active route
  useEffect(() => {
    menu.forEach((item) => {
      if (item.children?.some((c) => c.route === location.pathname)) {
        setExpandedItems((prev) => ({ ...prev, [item.id]: true }))
      }
    })
  }, [location.pathname, menu])

  // Close mobile drawer on navigation
  useEffect(() => { onMobileClose?.() }, [location.pathname]) // eslint-disable-line

  // ── Colours ───────────────────────────────────────────────────────────────
  const activeBg    = isDark ? alpha(theme.palette.primary.main, 0.18) : alpha(theme.palette.primary.main, 0.10)
  const activeColor = isDark ? theme.palette.primary.light            : theme.palette.primary.main

  const navItemBase = {
    display: 'flex',
    alignItems: 'center',
    gap: 1.25,
    px: collapsed ? 0 : 1,
    py: 0.8,
    borderRadius: '8px',
    textDecoration: 'none',
    color: theme.palette.text.secondary,
    transition: 'all 160ms ease',
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.text.primary,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    },
  } as const

  const childItemSx = {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    px: 1.5,
    py: 0.55,
    borderRadius: '6px',
    textDecoration: 'none',
    color: theme.palette.text.secondary,
    fontSize: '0.8125rem',
    transition: 'all 160ms ease',
    '&:hover': {
      color: theme.palette.text.primary,
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    },
    '&.active': { color: activeColor, fontWeight: 600, backgroundColor: activeBg },
  } as const

  // ── Render helpers ────────────────────────────────────────────────────────
  function renderLeaf(item: SidebarNavItem) {
    const Icon = getIcon(item.icon)
    const content = (
      <>
        <Icon sx={{ fontSize: '1.2rem', flexShrink: 0 }} />
        {!collapsed && (
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 400, color: 'inherit' }}>
            {item.name}
          </Typography>
        )}
      </>
    )

    if (item.route) {
      return (
        <Tooltip title={collapsed ? item.name : ''} placement="right" key={item.id}>
          <Box
            component={NavLink}
            to={item.route}
            sx={{
              ...navItemBase,
              justifyContent: collapsed ? 'center' : 'flex-start',
              '&.active': { color: activeColor, backgroundColor: activeBg, fontWeight: 600 },
            }}
          >
            {content}
          </Box>
        </Tooltip>
      )
    }

    return (
      <Box key={item.id} sx={{ ...navItemBase, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        {content}
      </Box>
    )
  }

  function renderParent(item: SidebarNavItem) {
    const Icon = getIcon(item.icon)
    const isExpanded    = expandedItems[item.id] ?? false
    const isChildActive = item.children?.some((c) => c.route === location.pathname) ?? false

    return (
      <Box key={item.id}>
        <Tooltip title={collapsed ? item.name : ''} placement="right">
          <Box
            component="button"
            type="button"
            onClick={() => toggleExpand(item.id)}
            sx={{
              ...navItemBase,
              width: '100%',
              border: 'none',
              backgroundColor: isChildActive ? activeBg : 'transparent',
              color: isChildActive ? activeColor : theme.palette.text.secondary,
              textAlign: 'left',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <Icon sx={{ fontSize: '1.2rem', flexShrink: 0 }} />
            {!collapsed && (
              <>
                <Typography sx={{ flexGrow: 1, fontSize: '0.875rem', fontWeight: isChildActive ? 500 : 400, color: 'inherit' }}>
                  {item.name}
                </Typography>
                <ChevronRightRoundedIcon
                  sx={{
                    fontSize: '1rem',
                    flexShrink: 0,
                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                    transition: 'transform 180ms ease',
                  }}
                />
              </>
            )}
          </Box>
        </Tooltip>

        <Collapse in={!collapsed && isExpanded} timeout="auto" unmountOnExit>
          <Stack
            spacing={0.15}
            sx={{ mt: 0.25, ml: 1.5, pl: 1.25, borderLeft: `1.5px solid ${theme.palette.divider}` }}
          >
            {item.children?.map((child) => (
              <Box key={child.id} component={NavLink} to={child.route} sx={childItemSx}>
                <Typography variant="body2" sx={{ color: 'inherit', fontSize: '0.8125rem' }}>
                  {child.name}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Collapse>
      </Box>
    )
  }

  return (
    <Box
      component="aside"
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        transition: 'width 220ms ease',
      }}
    >
      {/* ── Logo row ──────────────────────────────────────────────────── */}
      <Stack
        direction="row"
        justifyContent={collapsed ? 'center' : 'space-between'}
        alignItems="center"
        sx={{
          minHeight: { xs: '3.75rem', md: '4rem' },
          px: collapsed ? 0.75 : 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <Box
            component="img"
            src="https://leadsrubix.com/wp-content/uploads/2023/10/Logo.svg"
            alt="Leads Rubix"
            sx={{
              width: '8.5rem',
              height: 'auto',
              maxHeight: '1.625rem',
              objectFit: 'contain',
              objectPosition: 'left center',
              flexShrink: 0,
              filter: isDark ? 'brightness(0) invert(1)' : 'none',
            }}
          />
        )}
        <IconButton
          onClick={onToggle}
          size="small"
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '8px',
            width: '2rem',
            height: '2rem',
            color: theme.palette.text.secondary,
            display: { xs: 'none', md: 'flex' },
            '&:hover': {
              color: theme.palette.text.primary,
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            },
          }}
        >
          <MenuOpenRoundedIcon
            sx={{
              fontSize: '1.125rem',
              transform: collapsed ? 'rotate(180deg)' : 'none',
              transition: 'transform 160ms ease',
            }}
          />
        </IconButton>
      </Stack>

      {/* ── Nav content ───────────────────────────────────────────────── */}
      <Stack
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: collapsed ? 0.5 : 1.25,
          py: 1.5,
          gap: 0.5,
          scrollbarWidth: 'thin',
          scrollbarColor: `${alpha(theme.palette.text.secondary, 0.24)} transparent`,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { background: alpha(theme.palette.text.secondary, 0.22), borderRadius: 999 },
        }}
      >
        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} color="secondary" />
          </Box>
        )}

        {/* Error */}
        {!loading && error && (
          <Typography
            variant="caption"
            sx={{ color: theme.palette.error.main, px: 1, py: 2, textAlign: 'center', display: 'block' }}
          >
            {collapsed ? '!' : `Menu error: ${error}`}
          </Typography>
        )}

        {/* Empty */}
        {!loading && !error && menu.length === 0 && (
          <Typography
            variant="caption"
            sx={{ color: theme.palette.text.disabled, px: 1, py: 2, textAlign: 'center', display: 'block' }}
          >
            {collapsed ? '' : 'No menu items available.'}
          </Typography>
        )}

        {/* Menu items */}
        {!loading && menu.length > 0 && (
          <Stack spacing={0.25}>
            {menu.map((item) =>
              item.children?.length ? renderParent(item) : renderLeaf(item),
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  )
}
