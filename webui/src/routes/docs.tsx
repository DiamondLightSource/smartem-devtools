import { createFileRoute } from '@tanstack/react-router'
import { Docs } from '~/components/pages'

export const Route = createFileRoute('/docs')({
  component: Docs,
})
