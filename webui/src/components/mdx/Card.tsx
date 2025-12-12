import { Card as MuiCard, CardActionArea, CardContent, Typography } from '@mui/material'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

interface DocCardProps {
  title: string
  href: string
  icon?: ReactNode
  children?: ReactNode
}

export function DocCard({ title, href, icon, children }: DocCardProps) {
  const isExternal = href.startsWith('http')

  const content = (
    <CardContent>
      {icon && <Typography sx={{ mb: 1 }}>{icon}</Typography>}
      <Typography variant="h6" component="div" gutterBottom>
        {title}
      </Typography>
      {children && (
        <Typography variant="body2" color="text.secondary">
          {children}
        </Typography>
      )}
    </CardContent>
  )

  if (isExternal) {
    return (
      <MuiCard variant="outlined">
        <CardActionArea component="a" href={href} target="_blank" rel="noopener noreferrer">
          {content}
        </CardActionArea>
      </MuiCard>
    )
  }

  return (
    <MuiCard variant="outlined">
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
