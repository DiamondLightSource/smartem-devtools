import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import react from '@vitejs/plugin-react'
import rehypePrettyCode from 'rehype-pretty-code'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

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
  ],
})
