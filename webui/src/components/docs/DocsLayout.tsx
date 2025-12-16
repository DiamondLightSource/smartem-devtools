import { Box, useMediaQuery, useTheme } from '@mui/material'
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
    <Box
      sx={{
        display: 'flex',
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: '#ffffff',
      }}
    >
      {!isMobile && (
        <Box
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            position: 'sticky',
            top: 64,
            height: 'calc(100vh - 64px)',
            backgroundColor: '#2c2c2c',
            backgroundImage: `url("${import.meta.env.BASE_URL}assets/textures/asfalt-dark.png")`,
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'auto',
          }}
        >
          <Box sx={{ py: 2 }}>
            <DocsSidebar navigation={docsNavigation} />
          </Box>
        </Box>
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
