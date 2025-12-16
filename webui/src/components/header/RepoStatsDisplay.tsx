import { Box, Typography } from '@mui/material'
import { webUiAppContents } from '~/config'
import { useRepoStats } from '~/hooks/useRepoStats'

function isRepoStatsEnabled(): boolean {
  const { repoStatsInDev, repoStatsInProd } = webUiAppContents.featureFlags
  return import.meta.env.DEV ? repoStatsInDev : repoStatsInProd
}

interface RepoStatsDisplayProps {
  owner: string
  repo: string
  isGitHub: boolean
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffMonths > 0) return `${diffMonths}mo ago`
  if (diffWeeks > 0) return `${diffWeeks}w ago`
  if (diffDays > 0) return `${diffDays}d ago`
  if (diffHours > 0) return `${diffHours}h ago`
  if (diffMinutes > 0) return `${diffMinutes}m ago`
  return 'just now'
}

export function RepoStatsDisplay({ owner, repo, isGitHub }: RepoStatsDisplayProps) {
  const statsEnabled = isRepoStatsEnabled()
  const { data, isLoading, error } = useRepoStats(owner, repo, isGitHub && statsEnabled)

  const baseStyle = {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.7rem',
    fontFamily: '"JetBrainsMono NF", monospace',
    mt: 0.75,
  }

  const linkStyle = {
    color: 'inherit',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  }

  const numberStyle = {
    color: 'rgba(255,255,255,0.95)',
    fontWeight: 500,
  }

  const repoUrl = `https://github.com/${owner}/${repo}`

  if (!isGitHub || !statsEnabled) {
    return (
      <Typography variant="caption" sx={baseStyle}>
        stats: unavailable
      </Typography>
    )
  }

  if (isLoading) {
    return (
      <Typography variant="caption" sx={baseStyle}>
        stats: loading...
      </Typography>
    )
  }

  if (error) {
    return (
      <Typography variant="caption" sx={baseStyle}>
        stats: failed to load
      </Typography>
    )
  }

  if (!data) {
    return (
      <Typography variant="caption" sx={baseStyle}>
        stats: unavailable
      </Typography>
    )
  }

  const relativeTime = formatRelativeTime(data.lastCommitDate)

  return (
    <Box
      sx={{
        ...baseStyle,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
      }}
    >
      <Box
        component="a"
        href={`${repoUrl}/pulls`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        sx={linkStyle}
      >
        PRs:{' '}
        <Box component="span" sx={numberStyle}>
          {data.openPRs}
        </Box>
      </Box>
      <span>|</span>
      <Box
        component="a"
        href={`${repoUrl}/issues`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        sx={linkStyle}
      >
        Issues:{' '}
        <Box component="span" sx={numberStyle}>
          {data.openIssues}
        </Box>
      </Box>
      <span>|</span>
      <Box
        component="a"
        href={`${repoUrl}/commit/${data.lastCommitFullSha}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        sx={linkStyle}
      >
        Last pushed:{' '}
        <Box component="span" sx={numberStyle}>
          {data.lastCommitSha}
        </Box>
        {relativeTime && (
          <Box component="span" sx={numberStyle}>
            {' '}
            ({relativeTime})
          </Box>
        )}
      </Box>
    </Box>
  )
}
