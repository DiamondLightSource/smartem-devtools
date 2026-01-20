import { Box } from '@mui/material'
import { useState } from 'react'
import { SearchPalette } from '~/components/widgets'
import { webUiAppContents } from '~/config'

export function OmniBoxBar() {
  const [isOpen, setIsOpen] = useState(false)
  const placeholder = webUiAppContents.config.header.omniboxPlaceholder

  return (
    <Box>
      <Box
        onClick={() => setIsOpen(true)}
        sx={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 0.75,
          borderRadius: 1,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          minWidth: 200,
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
          },
        }}
      >
        <Box component="span" sx={{ fontSize: 14, opacity: 0.7 }}>
          {placeholder}
        </Box>
        <Box component="kbd" sx={{ ml: 'auto', fontSize: 11, color: 'text.secondary' }}>
          Ctrl+K
        </Box>
      </Box>
      <SearchPalette isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </Box>
  )
}
