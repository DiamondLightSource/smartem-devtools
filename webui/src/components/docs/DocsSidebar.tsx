import {
  Collapse,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import { Link, useLocation } from '@tanstack/react-router'
import { useState } from 'react'
import type { NavItem } from '~/docs/navigation'

interface NavItemComponentProps {
  item: NavItem
  depth?: number
}

function NavItemComponent({ item, depth = 0 }: NavItemComponentProps) {
  const location = useLocation()
  const isActive = location.pathname === item.href
  const hasChildren = item.children && item.children.length > 0
  const [open, setOpen] = useState(() => {
    if (!hasChildren) return false
    return item.children!.some(
      (child) =>
        location.pathname === child.href ||
        child.children?.some((c) => location.pathname === c.href)
    )
  })

  const isExternal = item.href.startsWith('/api')

  if (hasChildren) {
    return (
      <>
        <ListItemButton
          onClick={() => setOpen(!open)}
          sx={{ pl: 2 + depth * 2 }}
        >
          <ListItemText
            primary={item.title}
            primaryTypographyProps={{
              variant: 'body2',
              fontWeight: depth === 0 ? 600 : 400,
            }}
          />
          {open ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children!.map((child) => (
              <NavItemComponent key={child.href} item={child} depth={depth + 1} />
            ))}
          </List>
        </Collapse>
      </>
    )
  }

  if (isExternal) {
    return (
      <ListItemButton
        component="a"
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ pl: 2 + depth * 2 }}
      >
        <ListItemText
          primary={item.title}
          primaryTypographyProps={{
            variant: 'body2',
            color: 'primary',
          }}
        />
      </ListItemButton>
    )
  }

  return (
    <ListItemButton
      component={Link}
      to={item.href}
      selected={isActive}
      sx={{ pl: 2 + depth * 2 }}
    >
      <ListItemText
        primary={item.title}
        primaryTypographyProps={{
          variant: 'body2',
          fontWeight: isActive ? 600 : 400,
        }}
      />
    </ListItemButton>
  )
}

interface DocsSidebarProps {
  navigation: NavItem[]
}

export function DocsSidebar({ navigation }: DocsSidebarProps) {
  return (
    <List component="nav" dense>
      {navigation.map((item) => (
        <NavItemComponent key={item.href} item={item} />
      ))}
    </List>
  )
}
