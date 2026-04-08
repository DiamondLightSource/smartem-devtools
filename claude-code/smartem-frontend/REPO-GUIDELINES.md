# SmartEM Frontend Guidelines

## Development Environment

- **Node.js**: 22+ (strict requirement)
- **Package Manager**: npm (with workspaces)
- **Code Style**: Biome for TS/JS, Prettier for YAML/MD
- **Git Hooks**: Lefthook (auto-installed via npm install)

## Code Standards

- **No Emojis**: Consistent with backend — no emojis in code, commits, or docs
- **British English**: Use British spelling in documentation and UI text
- **TypeScript**: Strict mode, no `any` types without justification
- **Imports**: Let Biome handle import sorting automatically

## Project Structure (Monorepo)

The repository uses npm workspaces. See [ADR-0017](../../docs/decision-records/decisions/0017-smartem-frontend-monorepo-restructure.md) for the decision record.

```
smartem-frontend/
├── apps/
│   ├── legacy/                # Existing application (@smartem/legacy)
│   │   ├── src/
│   │   │   ├── components/    # Reusable React components
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── routes/        # Route components
│   │   │   └── root.tsx       # Application root with providers
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── smartem/               # New application (@smartem/app)
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
├── packages/
│   ├── api/                   # Shared API client (@smartem/api)
│   │   ├── src/
│   │   │   ├── generated/     # Orval output (DO NOT EDIT)
│   │   │   ├── mutator.ts     # Axios configuration
│   │   │   ├── stubs.ts       # Development stubs
│   │   │   └── index.ts       # Barrel export
│   │   ├── openapi.json       # OpenAPI spec (version controlled)
│   │   └── orval.config.ts
│   └── ui/                    # Shared UI component library (@smartem/ui)
│       └── src/
├── package.json               # Workspace root
├── biome.json                 # Shared lint/format config
├── tsconfig.base.json         # Shared TS config (apps extend)
├── tsconfig.json              # Root project references
└── lefthook.yml               # Shared git hooks
```

## Common Commands

```bash
# Development
npm install                    # Install all workspace dependencies
npm run dev                    # Legacy app dev server
npm run dev:mock               # Legacy app with mock API data
npm run dev:smartem            # New app dev server
npm run dev:smartem:mock       # New app with mock API data

# API Client
npm run api:update             # Fetch OpenAPI spec + regenerate client
npm run api:fetch:local        # Fetch from local backend (localhost:8000)
npm run api:generate           # Regenerate client from current spec

# Code Quality
npm run check                  # Biome lint + format (recommended)
npm run check:fix              # Biome auto-fix all issues
npm run lint                   # Lint only
npm run format                 # Format (Biome + Prettier)
npm run typecheck              # TypeScript checking across all workspaces

# Build
npm run build                  # Build legacy app
npm run build:smartem          # Build new app
```

## API Client Workflow

The frontend uses Orval to generate a type-safe API client from the backend OpenAPI spec. The client lives in `packages/api/` and is shared across both apps as `@smartem/api`.

### When Backend API Changes

```bash
# 1. Regenerate client
npm run api:update

# 2. Check for type errors across all workspaces
npm run typecheck

# 3. Update components using changed endpoints
```

### Using Generated Hooks

```typescript
import { useGetAcquisitionsAcquisitionsGet } from '@smartem/api'

function MyComponent() {
  const { data, isLoading, error } = useGetAcquisitionsAcquisitionsGet()

  if (isLoading) return <CircularProgress />
  if (error) return <Alert severity="error">{error.message}</Alert>

  return <div>{/* render data */}</div>
}
```

### Version Mismatch Warning

If console shows API version mismatch, regenerate the client:
```bash
npm run api:update
```

## Code Quality Tools

### Biome (TS/JS/JSON)

- Linting + formatting + import sorting
- Config: `biome.json` (workspace root, shared)
- Faster than ESLint + Prettier combined

### Prettier (YAML/MD)

- Config files and documentation only
- Config: `.prettierrc`

### Lefthook (Git Hooks)

**Pre-commit:**
- Biome check + auto-fix on staged files
- Prettier on YAML/MD files

**Pre-push:**
- Full typecheck
- Full lint check
- Format verification

### Skip Hooks (Emergency Only)

```bash
LEFTHOOK=0 git commit -m "message"
# or
git commit --no-verify -m "message"
```

## Technology Stack

| Category | Technology | Notes |
|----------|------------|-------|
| Framework | React 19 | |
| Routing (legacy) | React Router 7 | Legacy app only |
| Routing (new) | TanStack Router | New app — type-safe, SPA |
| Server State | TanStack Query | Auto-generated hooks via Orval |
| Tables | TanStack Table | New app — headless, full styling control |
| UI Components | Material UI | |
| Component Library | sci-react-ui + @smartem/ui | sci-react-ui for legacy; @smartem/ui for new |
| API Client | Orval (generated) | Shared via @smartem/api package |
| Build | Vite | Per-app config |
| Linting | Biome | Workspace root config |
| Git Hooks | Lefthook | |

## Environment Configuration

| Environment | API Endpoint |
|-------------|--------------|
| Development | Vite proxy `/api` → `localhost:8000` |
| Mock | MSW (Mock Service Worker) with client-side stubs |
| Production | `VITE_API_ENDPOINT` env var or `localhost:8000` |

## Route Structure

### Legacy app (`apps/legacy`)

| Route | Page |
|-------|------|
| `/` | Session List (Home) |
| `/acquisitions/:acqId` | Session Dashboard |
| `/acquisitions/:acqId/grids/:gridId` | Grid Explorer |
| `/acquisitions/:acqId/grids/:gridId/atlas` | Atlas View |
| `/acquisitions/:acqId/grids/:gridId/gridsquares` | Grid Square Gallery |
| `/acquisitions/:acqId/grids/:gridId/workspace` | Workspace |
| `/acquisitions/:acqId/grids/:gridId/squares/:squareId` | Grid Square Detail |
| `/acquisitions/:acqId/grids/:gridId/square/:squareId/predictions` | Quality Analytics |
| `/models` | Models Overview |
| `/models/:modelName/grids/:gridId/weights` | Model Weights |

### New app (`apps/smartem`)

Uses session-anchored nesting. Route structure is under active design — see the [design specification](../../docs/decision-records/smartem-frontend-design.md) for the current plan.

## Claude Workflow

1. Make changes to components/code
2. Run `npm run check:fix` to auto-fix formatting/lint issues
3. Run `npm run typecheck` to verify types across all workspaces
4. If API-related changes, ensure `npm run api:update` was run first

## Contributing Checklist

- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Passes lint/format (`npm run check`)
- [ ] API client regenerated if backend changed
- [ ] British English in UI text and docs
- [ ] No emojis in code or commits
