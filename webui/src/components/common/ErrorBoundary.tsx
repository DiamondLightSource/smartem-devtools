import { Box, Button, Typography } from '@mui/material'
import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  name?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`ErrorBoundary [${this.props.name || 'unnamed'}] caught error:`, error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Box
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            minHeight: 100,
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            borderRadius: 1,
            border: '1px solid rgba(244, 67, 54, 0.3)',
          }}
        >
          <Typography variant="body2" color="error" fontWeight="bold">
            {this.props.name ? `Error in ${this.props.name}` : 'Something went wrong'}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'error.main',
              fontFamily: 'monospace',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {this.state.error?.message || 'Unknown error'}
          </Typography>
          <Button size="small" variant="outlined" color="error" onClick={this.handleReset}>
            Try Again
          </Button>
        </Box>
      )
    }

    return this.props.children
  }
}
