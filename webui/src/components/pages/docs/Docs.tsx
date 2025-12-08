import { Box, Typography } from '@mui/material'

export function Docs() {
  return (
    <Box
      sx={{
        flexGrow: 1,
        p: 4,
      }}
    >
      <Typography variant="h4" gutterBottom>
        Documentation
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Documentation page placeholder.
      </Typography>
    </Box>
  )
}
