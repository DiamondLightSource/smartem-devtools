import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'

const docModules = import.meta.glob('../../docs/**/*.mdx')

function getDocComponent(path: string) {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path

  const matchingKey = Object.keys(docModules).find(
    (key) => key.endsWith(`${normalizedPath}.mdx`)
  )

  if (!matchingKey) {
    return null
  }

  return lazy(docModules[matchingKey] as () => Promise<{ default: React.ComponentType }>)
}

function DocsPage() {
  const { _splat: path } = Route.useParams()

  if (!path) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4">Page not found</Typography>
      </Box>
    )
  }

  const DocComponent = getDocComponent(path)

  if (!DocComponent) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4">Page not found</Typography>
        <Typography color="text.secondary">
          The documentation page &quot;{path}&quot; could not be found.
        </Typography>
      </Box>
    )
  }

  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      }
    >
      <DocComponent />
    </Suspense>
  )
}

export const Route = createFileRoute('/docs/$')({
  component: DocsPage,
})
