import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app.css'
import { routeTree } from './routeTree.gen'

const basePath = import.meta.env.PROD ? '/smartem-devtools' : ''

// Handle GitHub Pages SPA redirect
const redirectPath = sessionStorage.getItem('spa-redirect-path')
if (redirectPath) {
  sessionStorage.removeItem('spa-redirect-path')
  const cleanPath = redirectPath.startsWith(basePath)
    ? redirectPath.slice(basePath.length) || '/'
    : redirectPath
  window.history.replaceState(null, '', cleanPath)
}

const router = createRouter({ routeTree, basepath: basePath })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
