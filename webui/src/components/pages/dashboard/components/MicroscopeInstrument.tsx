import { Box, Typography } from '@mui/material'

interface MicroscopeInstrumentProps {
  name: string
  alias: string
}

export function MicroscopeInstrument({ name, alias }: MicroscopeInstrumentProps) {
  return (
    <Box
      sx={{
        position: 'relative',
        width: 120,
        height: 120,
        border: '1px solid rgba(0, 0, 0, 0.25)',
        borderRadius: 1,
        backgroundColor: 'rgba(240, 240, 240, 0.7)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Name and alias at top */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(240, 240, 240, 0.95)',
          border: '1px solid rgba(0, 0, 0, 0.25)',
          borderRadius: 0.5,
          px: 1,
          py: 0.25,
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: '#333',
            fontWeight: 500,
          }}
        >
          {name}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(0, 0, 0, 0.5)',
            fontFamily: 'monospace',
          }}
        >
          ({alias})
        </Typography>
      </Box>
      {/* Background microscope image */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(/assets/laboratory-microscope-svgrepo-com.svg)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          opacity: 0.15,
        }}
      />
      {/* Athena API box */}
      <Box
        data-connection-id="athena-api"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(0, 0, 0, 0.15)',
          borderRadius: 0.5,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          px: 0.75,
          py: 0.25,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: '#333',
            fontSize: '0.6rem',
            whiteSpace: 'nowrap',
          }}
        >
          Athena API
        </Typography>
      </Box>
    </Box>
  )
}
