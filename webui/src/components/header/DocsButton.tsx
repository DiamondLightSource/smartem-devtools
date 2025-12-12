import { Box } from '@mui/material'
import { Link } from '@tanstack/react-router'
import { AppTooltip } from '~/components/common'
import { webUiAppContents } from '~/config'

const ICON_BOOK_OPEN = '\uf518'

export function DocsButton() {
  const { text, tooltip } = webUiAppContents.config.header.docsButton

  return (
    <AppTooltip title={tooltip} arrow placement="bottom">
      <Box
        component={Link}
        to="/docs"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          textDecoration: 'none',
          color: 'inherit',
          px: 1.5,
          py: 0.75,
          borderRadius: 1,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
        <Box component="span" sx={{ fontSize: 14 }}>
          {text}
        </Box>
      </Box>
    </AppTooltip>
  )
}
