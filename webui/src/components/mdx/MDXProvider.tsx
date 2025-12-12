import { MDXProvider as BaseMDXProvider } from '@mdx-js/react'
import {
  Box,
  Divider,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { MDXComponents } from 'mdx/types'
import type { ReactNode } from 'react'

const components: MDXComponents = {
  h1: (props) => (
    <Typography variant="h3" component="h1" gutterBottom sx={{ mt: 4, mb: 2 }} {...props} />
  ),
  h2: (props) => (
    <Typography variant="h4" component="h2" gutterBottom sx={{ mt: 3, mb: 2 }} {...props} />
  ),
  h3: (props) => (
    <Typography variant="h5" component="h3" gutterBottom sx={{ mt: 2, mb: 1 }} {...props} />
  ),
  h4: (props) => (
    <Typography variant="h6" component="h4" gutterBottom sx={{ mt: 2, mb: 1 }} {...props} />
  ),
  p: (props) => <Typography variant="body1" paragraph {...props} />,
  a: (props) => <Link {...props} />,
  ul: (props) => (
    <Box component="ul" sx={{ pl: 3, mb: 2 }} {...props} />
  ),
  ol: (props) => (
    <Box component="ol" sx={{ pl: 3, mb: 2 }} {...props} />
  ),
  li: (props) => (
    <Typography component="li" variant="body1" sx={{ mb: 0.5 }} {...props} />
  ),
  blockquote: (props) => (
    <Paper
      elevation={0}
      sx={{
        pl: 2,
        py: 1,
        my: 2,
        borderLeft: 4,
        borderColor: 'primary.main',
        bgcolor: 'action.hover',
      }}
      {...props}
    />
  ),
  hr: () => <Divider sx={{ my: 3 }} />,
  pre: (props) => (
    <Paper
      component="pre"
      elevation={0}
      sx={{
        p: 2,
        my: 2,
        overflow: 'auto',
        bgcolor: 'grey.900',
        color: 'grey.100',
        borderRadius: 1,
        '& code': {
          fontFamily: 'monospace',
          fontSize: '0.875rem',
        },
      }}
      {...props}
    />
  ),
  code: (props) => {
    const isInline = typeof props.children === 'string' && !props.className
    if (isInline) {
      return (
        <Box
          component="code"
          sx={{
            px: 0.5,
            py: 0.25,
            bgcolor: 'action.hover',
            borderRadius: 0.5,
            fontFamily: 'monospace',
            fontSize: '0.875em',
          }}
          {...props}
        />
      )
    }
    return <code {...props} />
  },
  table: (props) => (
    <Paper elevation={0} sx={{ my: 2, overflow: 'auto' }}>
      <Table size="small" {...props} />
    </Paper>
  ),
  thead: (props) => <TableHead {...props} />,
  tbody: (props) => <TableBody {...props} />,
  tr: (props) => <TableRow {...props} />,
  th: (props) => (
    <TableCell component="th" sx={{ fontWeight: 'bold' }} {...props} />
  ),
  td: (props) => <TableCell {...props} />,
}

interface MDXProviderProps {
  children: ReactNode
}

export function MDXProvider({ children }: MDXProviderProps) {
  return <BaseMDXProvider components={components}>{children}</BaseMDXProvider>
}
