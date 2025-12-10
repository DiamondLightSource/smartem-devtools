import { useRef } from 'react'
import { Box, Link, Typography } from '@mui/material'
import { ConnectionsOverlay, MicroscopeGrid, SystemComponentContainer } from './components'
import { dashboardConnections } from './components/connectionConfig'

const itemBoxSx = {
  border: '1px solid rgba(0, 0, 0, 0.15)',
  borderRadius: 1,
  p: 1.5,
  backgroundColor: 'rgba(255, 255, 255, 0.5)',
}

export function Dashboard() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        flexGrow: 1,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        fontFamily: '"JetBrainsMono NF", monospace',
        background: `
          linear-gradient(#e0e0e0 1px, transparent 1px),
          linear-gradient(90deg, #e0e0e0 1px, transparent 1px)
        `,
        backgroundColor: '#ffffff',
        backgroundSize: '20px 20px',
      }}
    >
      <ConnectionsOverlay connections={dashboardConnections} containerRef={containerRef} />
      {/* Column Headings Row */}
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3, mb: 4 }}>
        <Box sx={{ flex: 2, display: 'flex', flexDirection: 'row', gap: 3 }}>
          <Typography
            variant="body2"
            fontWeight="bold"
            sx={{ flex: 1, color: 'rgba(0, 0, 0, 0.5)', textAlign: 'center' }}
          >
            CryoEM Facilities
          </Typography>
          <Typography
            variant="body2"
            fontWeight="bold"
            sx={{ flex: 1, color: 'rgba(0, 0, 0, 0.5)', textAlign: 'center' }}
          >
            SmartEM Application
          </Typography>
        </Box>
        <Typography
          variant="body2"
          fontWeight="bold"
          sx={{ flex: 1, color: 'rgba(0, 0, 0, 0.5)', textAlign: 'center' }}
        >
          External Systems
        </Typography>
      </Box>

      {/* Three columns content */}
      <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, gap: 3 }}>
        {/* Left two columns container */}
        <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Two equal columns: CryoEM Facilities and SmartEM Application */}
          <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, gap: 3 }}>
            {/* CryoEM Facilities */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <MicroscopeGrid />
            </Box>

            {/* SmartEM Application */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                {/* Row 1: ARIA Connector (thin) */}
                <Box data-connection-id="aria-connector" sx={{ display: 'flex', flexDirection: 'column' }}>
                  <SystemComponentContainer heading="ARIA Connector" />
                </Box>

                {/* Row 2: SmartEM Backend */}
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <SystemComponentContainer heading="SmartEM Backend">
                    <Box sx={{ display: 'flex', flexDirection: 'row', flex: 1, gap: 1 }}>
                      {/* Column 1: APIs */}
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box data-connection-id="smartem-backend-api" sx={{ ...itemBoxSx, flex: 1, display: 'flex', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: '#333' }}>
                            SmartEM Backend API (JSON/CRUD)
                          </Typography>
                        </Box>
                        <Box data-connection-id="smartem-agent-api" sx={{ ...itemBoxSx, flex: 1, display: 'flex', alignItems: 'center' }}>
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
                        <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            component="img"
                            src="/assets/database.svg"
                            alt="Database"
                            sx={{ width: 20, height: 20, opacity: 0.6 }}
                          />
                          <Typography variant="caption" sx={{ color: '#333' }}>
                            PostgreSQL DB
                          </Typography>
                        </Box>
                        <Box sx={{ ...itemBoxSx, flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            component="img"
                            src="/assets/database.svg"
                            alt="Message Queue"
                            sx={{ width: 20, height: 20, opacity: 0.6, transform: 'rotate(90deg)' }}
                          />
                          <Typography variant="caption" sx={{ color: '#333' }}>
                            RabbitMQ Event Broker
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </SystemComponentContainer>
                </Box>

                {/* Row 3: Web UI and Services (left to right) */}
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'stretch' }}>
                  <Box data-connection-id="smartem-webui" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <SystemComponentContainer heading="SmartEM Web UI" flex={1} />
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <SystemComponentContainer heading="SmartEM Services" flex={1}>
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
                    </SystemComponentContainer>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* External Systems */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <SystemComponentContainer heading="ARIA Depositions Backend">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box data-connection-id="aria-graphql-api" sx={{ ...itemBoxSx, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#333' }}>
                    GraphQL API
                  </Typography>
                </Box>
                <Box sx={{ ...itemBoxSx, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#333', fontWeight: 500 }}>
                    ARIA OAuth2 Endpoints (Beta & Prod)
                  </Typography>
                  <Typography variant="caption" component="div" sx={{ color: '#555', fontSize: '0.65rem', fontFamily: 'monospace' }}>
                    Auth: <Link href="https://auth.aria.services/auth/realms/ARIA/protocol/openid-connect/auth" target="_blank" rel="noopener">https://auth.aria.services/auth/realms/ARIA/protocol/openid-connect/auth</Link><br />
                    Token: <Link href="https://auth.aria.services/auth/realms/ARIA/protocol/openid-connect/token" target="_blank" rel="noopener">https://auth.aria.services/auth/realms/ARIA/protocol/openid-connect/token</Link>
                  </Typography>

                  <Typography variant="caption" sx={{ color: '#333', fontWeight: 500, mt: 1 }}>
                    Beta Environment
                  </Typography>
                  <Typography variant="caption" component="div" sx={{ color: '#555', fontSize: '0.65rem', fontFamily: 'monospace' }}>
                    Docs: <Link href="https://beta.api.aria.services/" target="_blank" rel="noopener">https://beta.api.aria.services/</Link><br />
                    Endpoint: <Link href="https://graphql-beta.aria.services/graphql/" target="_blank" rel="noopener">https://graphql-beta.aria.services/graphql/</Link><br />
                    Client ID: ********<br />
                    Client Secret: ********<br />
                    Site: <Link href="https://beta.structuralbiology.eu/" target="_blank" rel="noopener">https://beta.structuralbiology.eu/</Link>
                  </Typography>

                  <Typography variant="caption" sx={{ color: '#333', fontWeight: 500, mt: 1 }}>
                    Production Environment
                  </Typography>
                  <Typography variant="caption" component="div" sx={{ color: '#555', fontSize: '0.65rem', fontFamily: 'monospace' }}>
                    Docs: <Link href="https://api.aria.services/" target="_blank" rel="noopener">https://api.aria.services/</Link><br />
                    Endpoint: <Link href="https://graphql.aria.services/graphql/" target="_blank" rel="noopener">https://graphql.aria.services/graphql/</Link><br />
                    Client ID: ********<br />
                    Client Secret: ********<br />
                    Site: <Link href="https://instruct-eric.org/" target="_blank" rel="noopener">https://instruct-eric.org/</Link>
                  </Typography>
                </Box>
              </Box>
            </SystemComponentContainer>
          </Box>
        </Box>
    </Box>
  )
}
