import { useState } from 'react'
import { Box, IconButton } from '@mui/material'
import { AppTooltip } from './AppTooltip'

const ICON_COPY = '\uf0c5'
const ICON_CHECK = '\uf00c'

interface CopyCodeBoxProps {
  code: string
}

export function CopyCodeBox({ code }: CopyCodeBoxProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 0.5,
        px: 1,
        py: 0.25,
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <Box
          component="code"
          sx={{
            display: 'block',
            fontFamily: '"JetBrainsMono NF", monospace',
            fontSize: '0.7rem',
            whiteSpace: 'nowrap',
            overflowX: 'auto',
            color: 'rgba(255, 255, 255, 0.5)',
            '&::-webkit-scrollbar': {
              height: 3,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: 2,
            },
          }}
        >
          {code}
        </Box>
      </Box>
      <AppTooltip title={copied ? 'Copied!' : 'Copy to clipboard'} arrow placement="top">
        <IconButton
          onClick={handleCopy}
          size="small"
          sx={{
            color: copied ? 'success.main' : 'rgba(255, 255, 255, 0.6)',
            flexShrink: 0,
            '&:hover': {
              color: copied ? 'success.main' : 'rgba(255, 255, 255, 0.9)',
            },
          }}
        >
          <Box
            component="span"
            sx={{
              fontFamily: '"JetBrainsMono NF"',
              fontSize: 12,
              lineHeight: 1,
            }}
          >
            {copied ? ICON_CHECK : ICON_COPY}
          </Box>
        </IconButton>
      </AppTooltip>
    </Box>
  )
}
