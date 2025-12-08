import { Box, Typography } from '@mui/material'
import { webUiAppContents } from '~/config'

const microscopeBoxSx = {
  border: '1px solid rgba(0, 0, 0, 0.15)',
  borderRadius: 1,
  px: 1.5,
  py: 0.5,
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
}

export function MicroscopeGrid() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        flex: 1,
      }}
    >
      {webUiAppContents.microscopes.map((instrument) => (
        <Box key={instrument.alias} sx={microscopeBoxSx}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: '#1a1a1a',
              fontSize: '0.7rem',
            }}
          >
            {instrument.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(0, 0, 0, 0.5)',
              fontFamily: 'monospace',
              fontSize: '0.65rem',
            }}
          >
            {instrument.alias}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
