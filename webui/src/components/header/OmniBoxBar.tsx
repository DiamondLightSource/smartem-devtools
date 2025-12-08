import { Box } from '@mui/material'
import { useState } from 'react'
import { CommandPalette, type CommandGroup } from '~/components/widgets'

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
          py: 0.5,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          minWidth: 200,
        }}
      >
        <Box component="span" sx={{ color: 'text.secondary', fontSize: 14 }}>
          Search...
        </Box>
        <Box component="kbd" sx={{ ml: 'auto', fontSize: 11, color: 'text.secondary' }}>
          Ctrl+K
        </Box>
      </Box>
      <CommandPalette
        groups={placeholderCommands}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        placeholder="Type a command or search..."
      />
    </Box>
  )
}
