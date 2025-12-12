import { createFileRoute } from '@tanstack/react-router'
import DocsIndex from '~/docs/index.mdx'

export const Route = createFileRoute('/docs/')({
  component: DocsIndex,
})
