import { Box } from '@mui/material'
import { useMemo, useState } from 'react'
import { SearchPalette } from '~/components/widgets'
import { webUiAppContents } from '~/config'

function getShortcutHint(key: string, requireMeta: boolean, requireShift: boolean): string {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
  const parts: string[] = []
  if (requireMeta) parts.push(isMac ? '\u2318' : 'Ctrl')
  if (requireShift) parts.push('Shift')
  parts.push(key.toUpperCase())
  return parts.join('+')
}

export function OmniBoxBar() {
  const [isOpen, setIsOpen] = useState(false)
  const placeholder = webUiAppContents.config.header.omniboxPlaceholder
  const { shortcut } = webUiAppContents.searchConfig

  const shortcutHint = useMemo(
    () => getShortcutHint(shortcut.key, shortcut.requireMeta, shortcut.requireShift),
    [shortcut.key, shortcut.requireMeta, shortcut.requireShift]
  )

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
        {shortcut.enabled && (
          <Box component="kbd" sx={{ ml: 'auto', fontSize: 11, color: 'text.secondary' }}>
            {shortcutHint}
          </Box>
        )}
      </Box>
      <SearchPalette
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        shortcutEnabled={shortcut.enabled}
        shortcutKey={shortcut.key}
        requireMeta={shortcut.requireMeta}
        requireShift={shortcut.requireShift}
      />
    </Box>
  )
}
