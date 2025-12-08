# SmartEM Frontend Guidelines

## Development Environment

- **Node.js**: 20+ (strict requirement)
- **Package Manager**: npm
- **Code Style**: Biome for TS/JS, Prettier for YAML/MD
- **Git Hooks**: Lefthook (auto-installed via npm install)

## Code Standards

- **No Emojis**: Consistent with backend - no emojis in code, commits, or docs
- **British English**: Use British spelling in documentation and UI text
- **TypeScript**: Strict mode, no `any` types without justification
- **Imports**: Let Biome handle import sorting automatically

## Common Commands

```bash
# Development
npm install                 # Install dependencies
npm run dev                 # Start dev server (port 5174)
npm run dev:mock            # Dev with mock API data

# API Client
npm run api:update          # Fetch OpenAPI spec + regenerate client
npm run api:fetch:local     # Fetch from local backend (localhost:8000)
npm run api:generate        # Regenerate client from current spec

# Code Quality
npm run check               # Format + lint + imports (recommended)
npm run check:fix           # Auto-fix all issues
npm run lint                # Lint only
npm run format              # Format only
npm run typecheck           # TypeScript checking

# Build
npm run build               # Production build
npm start                   # Run production server
```

## Project Structure

```
app/
├── api/
│   ├── generated/       # Auto-generated API client (DO NOT EDIT)
│   ├── mutator.ts       # Axios configuration
│   └── openapi.json     # OpenAPI spec (version controlled)
├── components/          # Reusable React components
├── hooks/               # Custom React hooks
├── routes/              # Route components
└── root.tsx             # Application root with providers
```

## API Client Workflow

The frontend uses Orval to generate a type-safe API client from the backend OpenAPI spec.

### When Backend API Changes

```bash
# 1. Regenerate client
npm run api:update

# 2. Check for type errors
npm run typecheck

# 3. Update components using changed endpoints
```

### Using Generated Hooks

```typescript
import { useGetAcquisitionsAcquisitionsGet } from '../api/generated/default/default'

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
- Config: `biome.json`
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

| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Routing | React Router 7 (SSR) |
| State | TanStack Query |
| UI Components | Material-UI |
| Styling | Tailwind CSS |
| API Client | Orval (generated) |
| Build | Vite |
| Linting | Biome |
| Git Hooks | Lefthook |

## Environment Configuration

| Environment | API Endpoint |
|-------------|--------------|
| Development | Vite proxy `/api` -> `localhost:8000` |
| Production | `VITE_API_ENDPOINT` env var or `localhost:8000` |

## Claude Workflow

1. Make changes to components/code
2. Run `npm run check:fix` to auto-fix formatting/lint issues
3. Run `npm run typecheck` to verify types
4. If API-related changes, ensure `npm run api:update` was run first

## Routes

- `/` - Main application (acquisition view)
- `/admin` - System administration (separate concerns, may be split later)

## Contributing Checklist

- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Passes lint/format (`npm run check`)
- [ ] API client regenerated if backend changed
- [ ] British English in UI text and docs
- [ ] No emojis in code or commits
