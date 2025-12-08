import { Box } from '@mui/material'
import { Outlet } from '@tanstack/react-router'

export function MainSection() {
  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        backgroundImage: 'url("/assets/textures/asfalt-light.png")',
        backgroundColor: '#f0f0f0',
      }}
    >
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
