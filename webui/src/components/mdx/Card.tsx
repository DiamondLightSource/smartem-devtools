import { CardActionArea, CardContent, Card as MuiCard, Typography } from '@mui/material'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

interface DocCardProps {
  title: string
  href: string
  icon?: ReactNode
  children?: ReactNode
}

const cardStyles = {
  card: {
    backgroundColor: '#2c2c2c',
    backgroundImage: 'url("/assets/textures/asfalt-dark.png")',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 1,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    },
  },
}

export function DocCard({ title, href, icon, children }: DocCardProps) {
  const isExternal = href.startsWith('http')

  const content = (
    <CardContent>
      {icon && <Typography sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.6)' }}>{icon}</Typography>}
      <Typography variant="h6" component="div" gutterBottom sx={{ color: '#fff' }}>
        {title}
      </Typography>
      {children && (
        <Typography
          variant="body2"
          component="div"
          sx={{
            mt: 1,
            fontWeight: 500,
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            '& p': { color: 'rgba(255, 255, 255, 0.8)', margin: 0 },
            '& *': { color: 'rgba(255, 255, 255, 0.8)' },
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          {children}
        </Typography>
      )}
    </CardContent>
  )

  if (isExternal) {
    return (
      <MuiCard sx={cardStyles.card}>
        <CardActionArea component="a" href={href} target="_blank" rel="noopener noreferrer">
          {content}
        </CardActionArea>
      </MuiCard>
    )
  }

  return (
    <MuiCard sx={cardStyles.card}>
      <CardActionArea component={Link} to={href}>
        {content}
      </CardActionArea>
    </MuiCard>
  )
}

interface CardGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
}

export function CardGrid({ children, columns = 2 }: CardGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '1rem',
        marginTop: '1rem',
        marginBottom: '1rem',
      }}
    >
      {children}
    </div>
  )
}
