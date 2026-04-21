# Generate Documentation

## Overview

Documentation lives as Markdown files in the `docs/` directory. During build, these are automatically converted to MDX
and copied into the webui for rendering. The webui is deployed to GitHub Pages.

## How it works

1. **Source**: Markdown files in `docs/` (this is what you edit)
2. **Sync**: `webui/scripts/generate-mdx-docs.ts` converts `.md` to `.mdx` and copies them into `webui/src/docs/` (gitignored)
3. **Build**: The sync runs automatically as part of `npm run prebuild` and is watched during `npm run dev`
4. **Deploy**: The `deploy-webui.yml` workflow builds and publishes to GitHub Pages on push to `main` when `docs/**` changes

## Local preview

```bash
cd webui
npm install
npm run dev
```

This starts the Vite dev server with live reload. Changes to `docs/*.md` files are picked up automatically.

## Building for production

```bash
cd webui
npm install
npm run build
```

The built output goes to `webui/dist/`.

## Navigation structure

The `index.md` files in each `docs/` subdirectory contain `toctree` directives that define navigation order and
grouping. The webui reads these during build to generate the sidebar navigation. When adding a new page, add its
filename (without extension) to the relevant `index.md` toctree.

## Deployment

Deployment is automatic via the `deploy-webui.yml` GitHub Actions workflow. It triggers on pushes to `main` that
modify files in `webui/`, `core/`, or `docs/`. Manual deployment is also available via `workflow_dispatch`.
