import { AppBar, Box, Toolbar } from '@mui/material'
import { ArtefactsMenu } from './ArtefactsMenu'
import { DocsButton } from './DocsButton'
import { LogoHomeButton } from './LogoHomeButton'
import { MenuButton } from './MenuButton'
import { OmniBoxBar } from './OmniBoxBar'
import { ProjectBoardButton } from './ProjectBoardButton'
import { RepoListBar } from './RepoListBar'

export function Header() {
  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundImage: `url("${import.meta.env.BASE_URL}assets/textures/asfalt-dark.png")`,
        backgroundColor: '#2c2c2c',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LogoHomeButton />
          <DocsButton />
          <ProjectBoardButton />
          <ArtefactsMenu />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RepoListBar />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <OmniBoxBar />
          <MenuButton />
        </Box>
      </Toolbar>
    </AppBar>
  )
}
