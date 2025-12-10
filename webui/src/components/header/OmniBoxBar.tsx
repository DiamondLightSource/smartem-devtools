import { Box } from '@mui/material'
import { useState } from 'react'
import { CommandPalette, type CommandGroup } from '~/components/widgets'
import { webUiAppContents } from '~/config'

const placeholderCommands: CommandGroup[] = [
  {
    id: 'actions',
    label: 'Quick Actions',
    items: [
      {
        id: 'new',
        label: 'New Item',
        onSelect: () => {},
      },
      {
        id: 'save',
        label: 'Save Changes',
        shortcut: ['Ctrl', 'S'],
        onSelect: () => {},
      },
      {
        id: 'share',
        label: 'Share...',
        onSelect: () => {},
      },
    ],
  },
]

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
      <CommandPalette
        groups={placeholderCommands}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        placeholder={placeholder}
      />
    </Box>
  )
}
