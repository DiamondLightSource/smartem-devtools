import { Box, Typography } from '@mui/material'
import { MicroscopeGrid } from './components'

const sectionSx = {
  p: 2,
}

const itemBoxSx = {
  border: '1px solid rgba(0, 0, 0, 0.15)',
  borderRadius: 1,
  p: 1.5,
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
}

export function Dashboard() {
  return (
    <Box
      sx={{
        flexGrow: 1,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        background: `
          linear-gradient(#e0e0e0 1px, transparent 1px),
          linear-gradient(90deg, #e0e0e0 1px, transparent 1px)
        `,
        backgroundColor: '#ffffff',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Architectural Overview */}
      <Box sx={{ ...sectionSx, flex: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Two main columns: Ourside (2/3) and Otherside (1/3) */}
        <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1 }}>
          {/* Ourside */}
          <Box sx={{ flex: 2, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {/* Two equal columns: CryoEM Facilities and SmartEM Application */}
            <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, gap: 1 }}>
              {/* CryoEM Facilities */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ color: '#1a1a1a' }}>
                  CryoEM Facilities
                </Typography>
                <MicroscopeGrid />
              </Box>

              {/* SmartEM Application */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ color: '#1a1a1a' }}>
                  SmartEM Application
                </Typography>

                {/* SmartEM Backend - half height */}
                <Box
                  sx={{ ...itemBoxSx, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}
                >
                  <Typography variant="body2" sx={{ color: '#333' }}>
                    SmartEM Backend
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, gap: 1 }}>
                    {/* Column 1: APIs */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#333' }}>
                          SmartEM Backend API (JSON/CRUD)
                        </Typography>
                      </Box>
                      <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#333' }}>
                          SmartEM Agent API (Stateful/SSE)
                        </Typography>
                      </Box>
                    </Box>
                    {/* Column 2: Core */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#333' }}>
                          SmartEM Backend Core
                        </Typography>
                      </Box>
                      <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#333' }}>
                          SmartEM Backend Worker
                        </Typography>
                      </Box>
                    </Box>
                    {/* Column 3: Infrastructure */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#333' }}>
                          PostgreSQL DB
                        </Typography>
                      </Box>
                      <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#333' }}>
                          RabbitMQ Event Broker
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Below: ARIA Connector, Services, Web UI (left to right) */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', gap: 1 }}>
                  <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#333' }}>
                      ARIA Connector
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      ...itemBoxSx,
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#333' }}>
                      SmartEM Services
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 0.5 }}>
                      <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#333' }}>
                          CTF and Motion Correction
                        </Typography>
                      </Box>
                      <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#333' }}>
                          Data Processing
                        </Typography>
                      </Box>
                      <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#333' }}>
                          ML Recommendations
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: '#333' }}>
                      SmartEM Web UI
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Otherside */}
          <Box sx={{ flex: 1, p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
              <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#333' }}>
                  ARIA Depositions Backend
                </Typography>
              </Box>
              <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#333' }}>
                  ?
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Testing and Development */}
      <Box sx={{ ...sectionSx, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, gap: 1 }}>
          <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" fontWeight="bold" sx={{ color: '#333' }}>
              Dev Notes
            </Typography>
          </Box>
          <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" fontWeight="bold" sx={{ color: '#333' }}>
              K8s and Env
            </Typography>
          </Box>
          <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" fontWeight="bold" sx={{ color: '#333' }}>
              CI/CD
            </Typography>
          </Box>
          <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" fontWeight="bold" sx={{ color: '#333' }}>
              Claude Code
            </Typography>
          </Box>
          <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" fontWeight="bold" sx={{ color: '#333' }}>
              Test Automation
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
