import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface SystemComponentContainerProps {
  heading: string
  children?: ReactNode
  minHeight?: number | string
  flex?: number
}

export function SystemComponentContainer({
  heading,
  children,
  minHeight,
  flex,
}: SystemComponentContainerProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        border: '1px solid rgba(0, 0, 0, 0.25)',
        borderRadius: 1,
        pt: 2.5,
        px: 1.5,
        pb: 1.5,
        backgroundColor: '#f0f0f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        minHeight,
        flex,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#333',
          fontWeight: 500,
          textAlign: 'center',
          backgroundColor: '#f0f0f0',
          border: '1px solid rgba(0, 0, 0, 0.25)',
          borderRadius: 0.5,
          px: 1,
          py: 0.25,
          whiteSpace: 'nowrap',
        }}
      >
        {heading}
      </Typography>
      {children}
    </Box>
  )
}
