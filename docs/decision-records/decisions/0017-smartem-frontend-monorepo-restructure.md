# 17. SmartEM Frontend Monorepo Restructure

Date: 2026-02-13

## Status

Accepted

## Context

The smartem-frontend repository was a single-app React project with all source code under `src/`. This layout created several problems:

1. **Parallel development blocked**: Building a redesigned frontend alongside the existing application was impractical within a single `src/` tree. Shared dependencies (API client, UI components) had no clean separation from application-specific code.
2. **API client coupling**: The auto-generated API client (Orval + React Query hooks) lived inside the application source, making it impossible to share between applications without circular imports or copy-paste.
3. **UI component isolation**: The planned `smartem-ui` component library (a local complement to sci-react-ui) needed its own package boundary to enforce clean interfaces and enable future extraction.

A frontend design specification identified the monorepo restructure as a prerequisite for all further development. The existing application needed to remain fully functional during and after the transition, with the new application developed in parallel.

## Decision

Restructure smartem-frontend into an npm workspaces monorepo with the following layout:

```
smartem-frontend/
├── apps/
│   ├── legacy/           # Existing application (moved from src/)
│   │   ├── src/
│   │   ├── package.json  # @smartem/legacy
│   │   └── vite.config.ts
│   └── smartem/          # New application (fresh scaffold)
│       ├── src/
│       ├── package.json  # @smartem/app
│       └── vite.config.ts
├── packages/
│   ├── api/              # Shared API client
│   │   ├── src/
│   │   │   ├── generated/    # Orval output (DO NOT EDIT)
│   │   │   ├── mutator.ts    # Axios configuration
│   │   │   ├── stubs.ts      # Development stubs
│   │   │   └── index.ts      # Barrel export
│   │   ├── orval.config.ts
│   │   └── package.json      # @smartem/api
│   └── ui/               # Shared UI component library
│       ├── src/
│       └── package.json      # @smartem/ui
├── package.json          # Workspace root (npm workspaces config)
├── biome.json            # Shared lint/format config
├── tsconfig.base.json    # Shared TypeScript config (apps extend)
├── tsconfig.json         # Root project references
└── lefthook.yml          # Shared git hooks
```

### Workspace packages

| Package | Name | Purpose |
|---------|------|---------|
| `apps/legacy` | `@smartem/legacy` | Existing application, moved from `src/` |
| `apps/smartem` | `@smartem/app` | New application with redesigned shell and routes |
| `packages/api` | `@smartem/api` | Auto-generated API client (Orval config, hooks, mutator, types, stubs) |
| `packages/ui` | `@smartem/ui` | SmartEM UI component library (local, eventually syncs with sci-react-ui) |

### Key patterns

- **One app runs at a time**: `npm run dev` for legacy, `npm run dev:smartem` for new
- **Barrel exports**: `@smartem/api` re-exports all generated hooks via `index.ts`, so consumers import from `'@smartem/api'` rather than reaching into generated internals
- **Shared tooling at root**: Biome, Lefthook, Prettier, and TypeScript base config live at the workspace root. Each app extends `tsconfig.base.json`.
- **SPA-only**: Both applications are pure client-side SPAs (no SSR, no server components)
- **sci-react-ui**: Remains a dependency of the legacy app. `packages/ui` is the new local library that will eventually sync with sci-react-ui (take from and contribute back).

### Root-level scripts

```bash
npm run dev              # Legacy app dev server
npm run dev:smartem      # New app dev server
npm run typecheck        # TypeScript checking across all workspaces
npm run api:update       # Fetch OpenAPI spec + regenerate client
npm run check            # Biome lint + format
npm run check:fix        # Biome auto-fix
```

## Consequences

### Positive

- **Parallel development**: Legacy and redesigned applications coexist cleanly, sharing the API client and UI components without interference
- **Shared packages**: `@smartem/api` is imported identically from both apps, eliminating duplication and ensuring API client changes propagate automatically
- **Clean separation**: Application-specific code, shared libraries, and tooling configuration each have clear boundaries
- **Incremental migration**: Users can continue using the legacy app while the new application is developed; switching requires only changing which app is built/deployed
- **Future extraction**: `@smartem/ui` has a clean package boundary from day one, simplifying eventual contribution back to sci-react-ui

### Negative

- **CI complexity**: Build, lint, and typecheck workflows must be updated to handle workspaces (workspace-aware scripts, potentially per-app build matrix)
- **Workspace learning curve**: Contributors unfamiliar with npm workspaces may need guidance on hoisting, cross-package imports, and workspace-specific commands
- **Dockerfile updates**: The container build needs updating to handle the monorepo layout (separate concern, tracked separately)

### Neutral

- Node.js minimum version raised from 20 to 22 (aligns with current LTS)
- React Router 7 (legacy) and TanStack Router (new app) coexist in separate workspaces without conflict
