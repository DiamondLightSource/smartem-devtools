import { createFileRoute, Outlet } from '@tanstack/react-router'
import { DocsLayout } from '~/components/docs'
import { MDXProvider } from '~/components/mdx'

function DocsLayoutRoute() {
  return (
    <DocsLayout>
      <MDXProvider>
        <Outlet />
      </MDXProvider>
    </DocsLayout>
  )
}

export const Route = createFileRoute('/docs')({
  component: DocsLayoutRoute,
})
