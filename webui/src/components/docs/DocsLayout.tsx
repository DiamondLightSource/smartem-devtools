import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material'
import type { ReactNode } from 'react'
import { docsNavigation } from '~/docs/navigation'
import { DocsSidebar } from './DocsSidebar'

const DRAWER_WIDTH = 280

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
              borderRight: 1,
              borderColor: 'divider',
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
          p: 3,
          maxWidth: '900px',
          mx: 'auto',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
