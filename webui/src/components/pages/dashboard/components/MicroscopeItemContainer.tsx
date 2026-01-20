import { Box } from '@mui/material'
import type { ReactNode } from 'react'

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
