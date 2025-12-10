import type { ReactNode } from 'react'
import { Box } from '@mui/material'

interface MicroscopeItemContainerProps {
  children?: ReactNode
}

export function MicroscopeItemContainer({ children }: MicroscopeItemContainerProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
      }}
    >
      {children}
    </Box>
  )
}
