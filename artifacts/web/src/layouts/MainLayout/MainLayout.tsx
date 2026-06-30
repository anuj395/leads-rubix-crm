import { useState, useCallback, useEffect } from 'react'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import { useTheme } from '@mui/material/styles'
import { Outlet as RouterOutlet } from 'react-router-dom'

import { useAppSelector } from '@/store/hooks'
import { selectAuth } from '@/features/auth/store/authSlice'
import { api } from '@/services/api'

import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export function MainLayout() {
  const theme = useTheme()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const { user } = useAppSelector(selectAuth)
  const [trialDialogOpen, setTrialDialogOpen] = useState(false)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const [orgName, setOrgName] = useState('')

  useEffect(() => {
    if (!user || user.role === 'superAdmin') return

    const hasShown = sessionStorage.getItem('trial_popup_shown')
    if (hasShown) return

    void (async () => {
      try {
        const res = await api.get(`organizations?industry_id=${user.industry_id}`)
        const orgs = res.data?.items ?? []
        const org = orgs[0]
        if (org && org.trialPeriod === true) {
          setOrgName((org.organization_name || org.name || 'Your Organization') as string)
          if (org.validTill) {
            const till = new Date(org.validTill as string).getTime()
            const diff = till - Date.now()
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
            setTrialDaysLeft(days > 0 ? days : 0)
          }
          setTrialDialogOpen(true)
          sessionStorage.setItem('trial_popup_shown', 'true')
        }
      } catch (err) {
        console.error('Failed to load trial period details', err)
      }
    })()
  }, [user])

  const handleToggle = useCallback(() => {
    setIsSidebarCollapsed((c) => !c)
  }, [])

  const handleMobileOpen = useCallback(() => {
    setIsMobileOpen(true)
  }, [])

  const handleMobileClose = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100vw',
        height: '100vh',
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: isSidebarCollapsed
            ? '5.25rem minmax(0, 1fr)'
            : 'clamp(14rem, 18vw, 17rem) minmax(0, 1fr)',
        },
        background: 'transparent',
        overflow: 'hidden',
        transition: 'grid-template-columns 220ms ease',
        // Prevent any horizontal scroll
        overflowX: 'hidden',
      }}
    >
      {/* Mobile overlay — backdrop when sidebar is open */}
      {isMobileOpen && (
        <Box
          onClick={handleMobileClose}
          sx={{
            display: { xs: 'block', md: 'none' },
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.52)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            zIndex: 199,
          }}
        />
      )}

      {/* Sidebar */}
      <Box
        sx={{
          position: { xs: 'fixed', md: 'static' },
          top: 0,
          left: 0,
          height: { xs: '100dvh', md: '100vh' },
          width: { xs: 'min(280px, 80vw)', md: '100%' },
          zIndex: { xs: 200, md: 'auto' },
          transform: {
            xs: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
            md: 'none',
          },
          transition: 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: {
            xs: isMobileOpen ? '8px 0 40px rgba(0,0,0,0.28)' : 'none',
            md: 'none',
          },
        }}
      >
        <Sidebar
          collapsed={isSidebarCollapsed}
          onToggle={handleToggle}
          onMobileClose={handleMobileClose}
        />
      </Box>

      {/* Main content area */}
      <Box
        sx={{
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          maxWidth: '100%',
        }}
      >
        {/* Navbar — fixed height */}
        <Navbar onMobileMenuOpen={handleMobileOpen} />

        {/*
         * LAYOUT FIX: The <main> area no longer scrolls itself.
         * Instead it passes its full remaining height down to the page
         * (e.g. ContactsListPage) which then passes it into DataTable.
         * Each page that wants viewport-filling behaviour sets
         * height:100% + overflow:hidden on its own root element.
         * Pages that need normal scroll can set overflowY:'auto'.
         *
         * No padding here — each page controls its own internal padding
         * via the DataTable's Box wrapper (p: { xs:1.5, sm:2.5, md:3 }).
         */}
        <Box
          component="main"
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',   // pages that need scroll set it themselves
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <RouterOutlet />
        </Box>
      </Box>

      <Dialog
        open={trialDialogOpen}
        onClose={() => setTrialDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1.5,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' 
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          }
        }}
      >
        <DialogContent sx={{ pb: 1 }}>
          <Stack spacing={2.5} alignItems="center" textAlign="center" sx={{ mt: 1 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.4)',
              }}
            >
              <HourglassEmptyIcon sx={{ fontSize: 32 }} />
            </Box>
            <Stack spacing={1}>
              <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.025em' }}>
                Trial Period Active
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
                Hey <strong>{user?.name}</strong>, your organization <strong>{orgName}</strong> is currently operating under a trial period.
              </Typography>
            </Stack>

            <Box
              sx={{
                width: '100%',
                p: 2,
                borderRadius: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
              }}
            >
              {trialDaysLeft !== null ? (
                <>
                  <Typography variant="h3" fontWeight={800} color="primary" sx={{ mb: 0.5 }}>
                    {trialDaysLeft}
                  </Typography>
                  <Typography variant="caption" fontWeight={600} color="primary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {trialDaysLeft === 1 ? 'Trial Day Remaining' : 'Trial Days Remaining'}
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" fontWeight={600} color="primary">
                  Trial Active
                </Typography>
              )}
            </Box>

            <Typography variant="caption" color="text.secondary">
              Please contact your administrator or account owner to subscribe to a pricing plan before the trial expires.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setTrialDialogOpen(false)}
            sx={{
              px: 4,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              }
            }}
          >
            Acknowledge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
