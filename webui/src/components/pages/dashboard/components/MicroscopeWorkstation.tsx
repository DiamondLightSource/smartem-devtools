import { Box, Typography } from '@mui/material'
import FolderIcon from '@mui/icons-material/Folder'

export function MicroscopeWorkstation() {
  return (
    <Box
      sx={{
        position: 'relative',
        flex: 1,
        height: 120,
        border: '1px solid rgba(0, 0, 0, 0.25)',
        borderRadius: 1,
        backgroundColor: 'rgba(240, 240, 240, 0.7)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'row',
        gap: 0.5,
        p: 1,
        pt: 2,
      }}
    >
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
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: '#333',
            fontWeight: 500,
          }}
        >
          EPU workstation (win10)
        </Typography>
      </Box>

      {/* EPU Desktop Software - Windows GUI style */}
      <Box
        data-connection-id="epu-desktop"
        sx={{
          flex: 1,
          border: '1px solid rgba(0, 0, 0, 0.15)',
          borderRadius: 0.5,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Windows-style title bar */}
        <Box
          sx={{
            backgroundColor: '#0078d4',
            px: 0.5,
            py: 0.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: '#fff', fontSize: '0.6rem', fontWeight: 500 }}
          >
            EPU
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.25 }}>
            <Box sx={{ width: 8, height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '1px' }} />
            <Box sx={{ width: 8, height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '1px' }} />
            <Box sx={{ width: 8, height: 8, backgroundColor: '#e81123', borderRadius: '1px' }} />
          </Box>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#333', textAlign: 'center', fontSize: '0.65rem' }}>
            Desktop Software
          </Typography>
        </Box>
      </Box>

      {/* Filesystem */}
      <Box
        data-connection-id="epu-filesystem"
        sx={{
          width: 64,
          height: 64,
          alignSelf: 'center',
          border: '1px solid rgba(0, 0, 0, 0.15)',
          borderRadius: 0.5,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.25,
          p: 0.5,
        }}
      >
        <FolderIcon sx={{ fontSize: 20, color: '#f0c14b' }} />
        <Typography variant="caption" sx={{ color: '#666', fontSize: '0.6rem' }}>
          fs
        </Typography>
      </Box>

      {/* SmartEM Agent */}
      <Box
        data-connection-id="smartem-agent"
        sx={{
          flex: 1,
          border: '1px solid rgba(0, 0, 0, 0.15)',
          borderRadius: 0.5,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 0.5,
        }}
      >
        <Typography variant="caption" sx={{ color: '#333', textAlign: 'center' }}>
          SmartEM Agent
        </Typography>
      </Box>
    </Box>
  )
}
