import { Box, Divider, ListSubheader, Menu, MenuItem, Typography } from '@mui/material'
import { useState } from 'react'
import { CopyCodeBox } from '~/components/common'
import { webUiAppContents } from '~/config'
import { RepoStatsDisplay } from './RepoStatsDisplay'

const ICON_CODEBASE = '\ue725'
const ICON_CHEVRON = '\uf078'
const ICON_GITHUB = '\uf09b'
const ICON_GITLAB = '\uf296'
const ICON_EXTERNAL_LINK = '\uf08e'

function getPlatformIcon(url: string): string {
  if (url.includes('github.com')) return ICON_GITHUB
  if (url.includes('gitlab.com')) return ICON_GITLAB
  return ''
}

export function RepoListBar() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const totalRepos = webUiAppContents.repos.repositories.reduce(
    (acc, org) => acc + org.repos.length,
    0
  )

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          minWidth: 600,
          px: 2,
          py: 0.75,
          borderRadius: 1,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            component="span"
            sx={{
              fontFamily: '"JetBrainsMono NF"',
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            {ICON_CODEBASE}
          </Box>
          <Typography variant="body2">
            {webUiAppContents.config.header.repoSelectorLabel} ({totalRepos})
          </Typography>
        </Box>
        <Box
          component="span"
          sx={{
            fontFamily: '"JetBrainsMono NF"',
            fontSize: 12,
            lineHeight: 1,
            opacity: 0.7,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          {ICON_CHEVRON}
        </Box>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 900,
              maxWidth: 1200,
              maxHeight: 500,
              overflowY: 'scroll',
              backgroundColor: '#2c2c2c',
              backgroundImage: `url("${import.meta.env.BASE_URL}assets/textures/asfalt-dark.png")`,
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            },
          },
        }}
      >
        {webUiAppContents.repos.repositories.map((orgGroup, orgIndex) => [
          orgIndex > 0 && (
            <Divider
              key={`divider-${orgGroup.org}`}
              sx={{ borderColor: 'rgba(255,255,255,0.2)' }}
            />
          ),
          <ListSubheader
            key={`header-${orgGroup.org}`}
            component="a"
            href={orgGroup.orgUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              backgroundColor: '#2c2c2c',
              backgroundImage: `url("${import.meta.env.BASE_URL}assets/textures/asfalt-dark.png")`,
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              lineHeight: 2.5,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              pb: 2,
              '&:hover': {
                color: 'white',
                textDecoration: 'underline',
              },
            }}
          >
            <Box
              component="span"
              sx={{
                fontFamily: '"JetBrainsMono NF"',
                fontSize: 28,
                lineHeight: 1,
              }}
            >
              {getPlatformIcon(orgGroup.orgUrl)}
            </Box>
            {orgGroup.orgUrl}
          </ListSubheader>,
          ...orgGroup.repos.map((repo) => (
            <MenuItem
              key={repo.name}
              disableRipple
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                py: 2,
                pl: 4,
                pr: 2,
                cursor: 'default',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.05)',
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 2,
                  mb: 0.5,
                }}
              >
                <Box
                  component="a"
                  href={repo.urls.https.replace('.git', '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    color: 'inherit',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      fontFamily: '"JetBrainsMono NF"',
                      fontSize: 14,
                      lineHeight: 1,
                      opacity: 0.7,
                    }}
                  >
                    {ICON_EXTERNAL_LINK}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {repo.name}
                  </Typography>
                </Box>
                <Box
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  sx={{ flexShrink: 0, maxWidth: 400, mt: 0.5, opacity: 0.7 }}
                >
                  <CopyCodeBox code={repo.urls.ssh} />
                </Box>
              </Box>
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}
              >
                {repo.description}
              </Typography>
              <RepoStatsDisplay
                owner={orgGroup.org}
                repo={repo.name}
                isGitHub={orgGroup.orgUrl.includes('github.com')}
              />
            </MenuItem>
          )),
        ])}
      </Menu>
    </>
  )
}
