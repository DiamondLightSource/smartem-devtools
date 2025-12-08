import { Box } from '@mui/material'
import { Link } from '@tanstack/react-router'
import { AppTooltip } from '~/components/common'

const ICON_HOME = '\uf015'

export function LogoHomeButton() {
  return (
    <AppTooltip title="Navigate back to dev dashboard" arrow placement="bottom">
      <Box
        component={Link}
        to="/home"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          color: 'inherit',
          p: 1,
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
          {ICON_HOME}
        </Box>
      </Box>
    </AppTooltip>
  )
}
