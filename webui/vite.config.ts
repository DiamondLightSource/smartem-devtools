import mdx from '@mdx-js/rollup'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/smartem-devtools/' : '/',
  plugins: [
    mdx({
      remarkPlugins: [remarkGfm, remarkFrontmatter],
    }),
    react(),
    tailwindcss(),
    TanStackRouterVite(),
    tsconfigPaths(),
  ],
})
