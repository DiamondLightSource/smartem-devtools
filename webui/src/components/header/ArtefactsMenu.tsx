import { Box, ListItemText, Menu, MenuItem } from '@mui/material'
import { useState } from 'react'
import { AppTooltip } from '~/components/common'
import { webUiAppContents } from '~/config'

const ICON_DOWNLOAD = '\uf019'
const ICON_CHEVRON_DOWN = '\uf078'

export function ArtefactsMenu() {
  const { text, tooltip } = webUiAppContents.config.header.artefactsButton
  const { items } = webUiAppContents.config.artefacts
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <AppTooltip title={tooltip} arrow placement="bottom">
        <Box
          component="button"
          onClick={handleClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            textDecoration: 'none',
            color: 'inherit',
            px: 1.5,
            py: 0.75,
            borderRadius: 1,
            border: '1px solid rgba(255, 255, 255, 0.3)',
            backgroundColor: open ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)',
            transition: 'background-color 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
            },
          }}
        >
          <Box
            component="span"
            sx={{
              fontFamily: '"JetBrainsMono NF"',
              fontSize: 20,
              lineHeight: 1,
              color: 'inherit',
            }}
          >
            {ICON_DOWNLOAD}
          </Box>
          <Box component="span" sx={{ fontSize: 14 }}>
            {text}
          </Box>
          <Box
            component="span"
            sx={{
              fontFamily: '"JetBrainsMono NF"',
              fontSize: 10,
              lineHeight: 1,
              color: 'inherit',
              opacity: 0.7,
              ml: 0.25,
            }}
          >
            {ICON_CHEVRON_DOWN}
          </Box>
        </Box>
      </AppTooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          mt: 1,
          '& .MuiPaper-root': {
            backgroundColor: '#2c2c2c',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            minWidth: 220,
          },
        }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.id}
            component="a"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            sx={{
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ListItemText
              primary={item.label}
              secondary={item.description}
              primaryTypographyProps={{ fontSize: 14 }}
              secondaryTypographyProps={{
                fontSize: 12,
                sx: { color: 'rgba(255, 255, 255, 0.6)' },
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
