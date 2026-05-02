import { useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import { Outlet as RouterOutlet } from 'react-router-dom'

import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export function MainLayout() {
  const theme = useTheme()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

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
        background: theme.palette.background.default,
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
    </Box>
  )
}
