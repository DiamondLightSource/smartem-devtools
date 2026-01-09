import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import react from '@vitejs/plugin-react'
import rehypePrettyCode from 'rehype-pretty-code'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import { defineConfig, type Plugin } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * Vite plugin that watches the docs/ directory and re-syncs MDX files on changes.
 * This enables hot-reload of documentation during development.
 */
function docsWatchPlugin(): Plugin {
  const docsPath = resolve(__dirname, '..', 'docs')

  return {
    name: 'docs-watch',
    configureServer(server) {
      server.watcher.add(docsPath)

      server.watcher.on('change', (file) => {
        if (file.startsWith(docsPath) && file.endsWith('.md')) {
          console.log(`\n[docs-watch] Detected change in ${file}`)
          try {
            execSync('npx tsx scripts/generate-mdx-docs.ts', {
              cwd: resolve(__dirname),
              stdio: 'inherit',
            })
            server.ws.send({ type: 'full-reload' })
          } catch (error) {
            console.error('[docs-watch] Failed to sync docs:', error)
          }
        }
      })

      server.watcher.on('add', (file) => {
        if (file.startsWith(docsPath) && file.endsWith('.md')) {
          console.log(`\n[docs-watch] Detected new file ${file}`)
          try {
            execSync('npx tsx scripts/generate-mdx-docs.ts', {
              cwd: resolve(__dirname),
              stdio: 'inherit',
            })
            server.ws.send({ type: 'full-reload' })
          } catch (error) {
            console.error('[docs-watch] Failed to sync docs:', error)
          }
        }
      })

      server.watcher.on('unlink', (file) => {
        if (file.startsWith(docsPath) && file.endsWith('.md')) {
          console.log(`\n[docs-watch] Detected deleted file ${file}`)
          try {
            execSync('npx tsx scripts/generate-mdx-docs.ts', {
              cwd: resolve(__dirname),
              stdio: 'inherit',
            })
            server.ws.send({ type: 'full-reload' })
          } catch (error) {
            console.error('[docs-watch] Failed to sync docs:', error)
          }
        }
      })
    },
  }
}

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/smartem-devtools/' : '/',
  plugins: [
    mdx({
      remarkPlugins: [remarkGfm, remarkFrontmatter],
      rehypePlugins: [
        [
          rehypePrettyCode,
          {
            theme: 'github-dark',
            keepBackground: true,
          },
        ],
      ],
      providerImportSource: '@mdx-js/react',
    }),
    react(),
    tailwindcss(),
    TanStackRouterVite(),
    tsconfigPaths(),
    docsWatchPlugin(),
  ],
})
