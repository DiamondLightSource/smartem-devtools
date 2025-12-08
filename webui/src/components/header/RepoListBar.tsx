import { useState } from 'react'
import { Box, Menu, MenuItem, ListSubheader, Typography, Divider } from '@mui/material'
import { webUiAppContents } from '~/config'

const ICON_REPO = '\uf1d3'
const ICON_CHEVRON = '\uf078'

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
            {ICON_REPO}
          </Box>
          <Typography variant="body2">Repositories ({totalRepos})</Typography>
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
              minWidth: 400,
              maxHeight: 500,
              backgroundColor: '#2c2c2c',
              backgroundImage: 'url("/assets/textures/asfalt-dark.png")',
              color: 'white',
            },
          },
        }}
      >
        {webUiAppContents.repos.repositories.map((orgGroup, orgIndex) => [
          orgIndex > 0 && <Divider key={`divider-${orgGroup.org}`} sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />,
          <ListSubheader
            key={`header-${orgGroup.org}`}
            component="a"
            href={orgGroup.orgUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              backgroundColor: 'transparent',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              lineHeight: 2.5,
              textDecoration: 'none',
              '&:hover': {
                color: 'white',
              },
            }}
          >
            {orgGroup.org}
          </ListSubheader>,
          ...orgGroup.repos.map((repo) => (
            <MenuItem
              key={repo.name}
              component="a"
              href={repo.urls.https.replace('.git', '')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                py: 1,
                px: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {repo.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>
                {repo.description}
              </Typography>
            </MenuItem>
          )),
        ])}
      </Menu>
    </>
  )
}
