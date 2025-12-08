import { Box } from '@mui/material'

const ICON_MENU = '\uf0c9'

export function MenuButton() {
  return (
    <Box
      component="button"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        color: 'inherit',
        cursor: 'pointer',
        px: 1,
        py: 0.5,
        borderRadius: 1,
        border: '0.5px solid rgba(255, 255, 255, 0.3)',
        fontFamily: '"JetBrainsMono NF"',
        fontSize: 20,
        lineHeight: 1,
        transition: 'background-color 0.2s ease',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      {ICON_MENU}
    </Box>
  )
}
