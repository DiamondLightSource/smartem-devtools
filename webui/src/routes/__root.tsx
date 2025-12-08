import { Box, CssBaseline, ThemeProvider } from '@mui/material'
import { createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Header } from '~/components/header'
import { MainSection } from '~/components/layout'
import { theme } from '~/components/theme'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <MainSection />
      </Box>
      <TanStackRouterDevtools position="bottom-right" />
    </ThemeProvider>
  )
}
