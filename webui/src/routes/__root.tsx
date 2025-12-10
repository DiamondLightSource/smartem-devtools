import { useEffect } from 'react'
import { Box, CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ErrorBoundary } from '~/components/common'
import { Header } from '~/components/header'
import { MainSection } from '~/components/layout'
import { theme } from '~/components/theme'
import { webUiAppContents } from '~/config'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  useEffect(() => {
    document.title = webUiAppContents.config.appTitle
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <ErrorBoundary name="Header">
            <Header />
          </ErrorBoundary>
          <ErrorBoundary name="Main Content">
            <MainSection />
          </ErrorBoundary>
        </Box>
        <TanStackRouterDevtools position="bottom-right" />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
