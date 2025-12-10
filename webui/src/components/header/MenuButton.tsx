import { Box } from '@mui/material'
import { AppTooltip } from '~/components/common'
import { webUiAppContents } from '~/config'

const ICON_MENU = '\uf0c9'

export function MenuButton() {
  return (
    <AppTooltip title={webUiAppContents.config.header.menuButton.tooltip} arrow placement="bottom">
      <Box
        component="button"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          color: 'inherit',
          cursor: 'pointer',
          px: 1,
          py: 0.75,
          borderRadius: 1,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          fontFamily: '"JetBrainsMono NF"',
          fontSize: 20,
          lineHeight: 1,
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
          },
        }}
      >
        {ICON_MENU}
      </Box>
    </AppTooltip>
  )
}
