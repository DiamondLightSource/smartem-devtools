import { Box } from '@mui/material'
import { webUiAppContents } from '~/config'

const ICON_BOOK_OPEN = '\uf518'

export function DocsButton() {
  return (
    <Box
      component="a"
      href={webUiAppContents.repos.links.docs}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        textDecoration: 'none',
        color: 'inherit',
        px: 1,
        py: 0.5,
        borderRadius: 1,
        border: '0.5px solid rgba(255, 255, 255, 0.3)',
        transition: 'background-color 0.2s ease',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      <Box
        component="span"
        sx={{
          fontFamily: '"JetBrainsMono NF"',
          fontSize: 20,
          lineHeight: 1,
          color: 'inherit',
        }}
      >
        {ICON_BOOK_OPEN}
      </Box>
      <Box component="span">Documentation</Box>
    </Box>
  )
}
