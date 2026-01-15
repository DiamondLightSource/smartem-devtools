import { Box, Menu, MenuItem, Typography } from '@mui/material'
import { useState } from 'react'
import { AppTooltip, CopyCodeBox } from '~/components/common'
import { webUiAppContents } from '~/config'

const ICON_DOWNLOAD = '\uf019'
const ICON_CHEVRON_DOWN = '\uf078'
const ICON_EXTERNAL_LINK = '\uf08e'

export function ArtefactsMenu() {
  const { text, tooltip } = webUiAppContents.config.header.artefactsButton
  const { items } = webUiAppContents.artefacts
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
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
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
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 320,
              backgroundColor: '#2c2c2c',
              backgroundImage: `url("${import.meta.env.BASE_URL}assets/textures/asfalt-dark.png")`,
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            },
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
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              py: 1.5,
              px: 2,
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
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
                {item.label}
              </Typography>
            </Box>
            {item.description && (
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem', mt: 0.5, pl: 2.5 }}
              >
                {item.description}
              </Typography>
            )}
            {item.command && (
              <Box
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                sx={{ mt: 1, opacity: 0.7 }}
              >
                <CopyCodeBox code={item.command} />
              </Box>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
