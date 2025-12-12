import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { docsNavigation } from '~/docs/navigation'
import { DocsSidebar } from './DocsSidebar'

const DRAWER_WIDTH = 260

interface DocsLayoutProps {
  children: ReactNode
}

export function DocsLayout({ children }: DocsLayoutProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              position: 'relative',
              height: '100%',
              backgroundColor: '#2c2c2c',
              backgroundImage: 'url("/assets/textures/asfalt-dark.png")',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <Box sx={{ overflow: 'auto', py: 2 }}>
            <DocsSidebar navigation={docsNavigation} />
          </Box>
        </Drawer>
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          maxWidth: '900px',
          mx: 'auto',
          color: '#333',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
