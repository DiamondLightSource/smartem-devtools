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

const textColor = '#333'
const mutedColor = '#666'
const linkColor = '#1976d2'

const components: MDXComponents = {
  h1: (props) => (
    <Typography
      variant="h3"
      component="h1"
      gutterBottom
      sx={{ mt: 4, mb: 2, color: textColor }}
      {...props}
    />
  ),
  h2: (props) => (
    <Typography
      variant="h4"
      component="h2"
      gutterBottom
      sx={{ mt: 3, mb: 2, color: textColor }}
      {...props}
    />
  ),
  h3: (props) => (
    <Typography
      variant="h5"
      component="h3"
      gutterBottom
      sx={{ mt: 2, mb: 1, color: textColor }}
      {...props}
    />
  ),
  h4: (props) => (
    <Typography
      variant="h6"
      component="h4"
      gutterBottom
      sx={{ mt: 2, mb: 1, color: textColor }}
      {...props}
    />
  ),
  p: (props) => <Typography variant="body1" paragraph sx={{ color: textColor }} {...props} />,
  a: (props) => (
    <Link
      sx={{
        color: linkColor,
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
        },
      }}
      {...props}
    />
  ),
  ul: (props) => (
    <Box
      component="ul"
      sx={{
        pl: 3,
        mb: 2,
        color: textColor,
        listStyleType: 'disc',
        '& ul': { listStyleType: 'circle' },
        '& ul ul': { listStyleType: 'square' },
      }}
      {...props}
    />
  ),
  ol: (props) => (
    <Box
      component="ol"
      sx={{
        pl: 3,
        mb: 2,
        color: textColor,
        listStyleType: 'decimal',
      }}
      {...props}
    />
  ),
  li: (props) => (
    <Typography
      component="li"
      variant="body1"
      sx={{ mb: 0.5, color: textColor, display: 'list-item' }}
      {...props}
    />
  ),
  blockquote: (props) => (
    <Paper
      elevation={0}
      sx={{
        pl: 2,
        py: 1,
        my: 2,
        borderLeft: 4,
        borderColor: '#666',
        bgcolor: '#f5f5f5',
        color: mutedColor,
      }}
      {...props}
    />
  ),
  hr: () => <Divider sx={{ my: 3, borderColor: '#ddd' }} />,
  pre: (props) => (
    <Paper
      component="pre"
      elevation={0}
      sx={{
        p: 2,
        my: 2,
        overflow: 'auto',
        bgcolor: '#2c2c2c',
        color: '#e0e0e0',
        borderRadius: 1,
        border: '1px solid #444',
        '& code': {
          fontFamily: '"JetBrains Mono", monospace',
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
            bgcolor: '#e8e8e8',
            color: '#333',
            borderRadius: 0.5,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.875em',
          }}
          {...props}
        />
      )
    }
    return <code {...props} />
  },
  table: (props) => (
    <Paper
      elevation={0}
      sx={{ my: 2, overflow: 'auto', border: '1px solid #444', borderRadius: 1 }}
    >
      <Table size="small" {...props} />
    </Paper>
  ),
  thead: (props) => <TableHead {...props} />,
  tbody: (props) => <TableBody {...props} />,
  tr: (props) => (
    <TableRow sx={{ bgcolor: '#fff', '&:nth-of-type(even)': { bgcolor: '#f0f0f0' } }} {...props} />
  ),
  th: (props) => (
    <TableCell
      component="th"
      sx={{
        fontWeight: 'bold',
        color: '#fff',
        backgroundColor: '#2c2c2c',
        backgroundImage: `url("${import.meta.env.BASE_URL}assets/textures/asfalt-dark.png")`,
        borderBottom: '1px solid #444',
      }}
      {...props}
    />
  ),
  td: (props) => (
    <TableCell sx={{ color: textColor, borderBottom: '1px solid #e0e0e0' }} {...props} />
  ),
}

interface MDXProviderProps {
  children: ReactNode
}

export function MDXProvider({ children }: MDXProviderProps) {
  return <BaseMDXProvider components={components}>{children}</BaseMDXProvider>
}
