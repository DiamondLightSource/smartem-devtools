import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#666',
    },
    background: {
      default: '#121212',
      paper: '#2c2c2c',
    },
  },
  typography: {
    fontFamily: '"JetBrains Mono", monospace',
  },
})
