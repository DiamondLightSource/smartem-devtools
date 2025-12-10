import { Box, Typography } from '@mui/material'
import { webUiAppContents } from '~/config'
import { MicroscopeItemContainer } from './MicroscopeItemContainer'
import { MicroscopeInstrument } from './MicroscopeInstrument'
import { MicroscopeWorkstation } from './MicroscopeWorkstation'

const DETAILED_COUNT = 2

export function MicroscopeGrid() {
  const detailed = webUiAppContents.microscopes.slice(0, DETAILED_COUNT)
  const collapsed = webUiAppContents.microscopes.slice(DETAILED_COUNT)

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3.5,
        flex: 1,
      }}
    >
      {detailed.map((instrument) => (
        <MicroscopeItemContainer key={instrument.alias}>
          <MicroscopeInstrument name={instrument.name} alias={instrument.alias} />
          <MicroscopeWorkstation />
        </MicroscopeItemContainer>
      ))}

      {collapsed.length > 0 && (
        <Box
          sx={{
            position: 'relative',
            height: 100,
          }}
        >
          {collapsed.slice(0, 4).map((m, index) => (
            <Box
              key={m.alias}
              sx={{
                position: 'absolute',
                top: index * 8,
                left: index * 8,
                right: (3 - index) * 8,
                height: 76,
                border: '1px solid rgba(0, 0, 0, 0.25)',
                borderRadius: 1,
                backgroundColor: `rgba(240, 240, 240, ${0.9 - index * 0.15})`,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                zIndex: 4 - index,
              }}
            >
              {index === 0 && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundImage: 'url(/assets/laboratory-microscope-svgrepo-com.svg)',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        opacity: 0.2,
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'rgba(0, 0, 0, 0.5)', fontStyle: 'italic' }}>
                      +{collapsed.length} more microscopes
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(0, 0, 0, 0.4)',
                      fontSize: '0.65rem',
                      fontFamily: 'monospace',
                      textAlign: 'center',
                      px: 2,
                    }}
                  >
                    {collapsed.map((m) => `${m.name} (${m.alias})`).join(', ')}
                  </Typography>
                </>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
