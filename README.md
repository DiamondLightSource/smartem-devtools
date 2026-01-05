# smartem-devtools

Developer tooling, documentation, and workspace configuration for the SmartEM multi-repo ecosystem.

## Overview

This repository serves as the **index repo** for SmartEM development at Diamond Light Source. It aggregates:

- Developer documentation and how-to guides
- Architecture Decision Records (ADRs)
- Claude Code configuration for AI-assisted development
- Developer WebUI for workspace management
- Core configuration for the multi-repo ecosystem

## Repository Structure

```
smartem-devtools/
├── docs/                    # Developer documentation
│   ├── how-to/              # Step-by-step guides
│   ├── tutorials/           # Getting started tutorials
│   ├── explanations/        # Architecture and design docs
│   │   └── decisions/       # ADRs (Architecture Decision Records)
│   ├── reference/           # CLI and API reference
│   └── api/                 # OpenAPI specs (SmartEM, Athena)
├── core/                    # TypeScript workspace config
│   ├── repos-and-refs.ts    # Repository definitions and URLs
│   ├── microscope-list.ts   # Microscope configuration
│   ├── webui-config.ts      # WebUI configuration
│   └── github-tags-config.ts
├── webui/                   # Developer dashboard (React/Vite)
├── claude-code/             # Claude Code configuration
│   ├── ARCHITECTURE.md      # System architecture overview
│   ├── shared/skills/       # Cross-repo skills
│   ├── smartem-decisions/   # Backend repo config
│   ├── smartem-frontend/    # Frontend repo config
│   └── fandango-cryoem-dls/ # FandanGO plugin config
└── README.md
```

## Related Repositories

| Repository | Purpose |
|------------|---------|
| [smartem-decisions](https://github.com/DiamondLightSource/smartem-decisions) | Backend API, agent, database |
| [smartem-frontend](https://github.com/DiamondLightSource/smartem-frontend) | User-facing web interface |
| [fandanGO-cryoem-dls](https://github.com/DiamondLightSource/fandanGO-cryoem-dls) | ARIA deposition plugin |
| [cryoem-services](https://github.com/DiamondLightSource/cryoem-services) | Processing pipeline (reference) |

## Quick Start

### smartem-workspace CLI

Automated workspace setup for SmartEM development:

```bash
# Set up complete development environment
uvx smartem-workspace init --preset smartem-core

# Or just this repository and docs
uvx smartem-workspace init --preset minimal
```

See [smartem-workspace documentation](packages/smartem-workspace/README.md) for details.

### Developer WebUI

```bash
cd webui
npm install
npm run dev
```

Opens at http://localhost:5173

### Documentation

Documentation is built with Sphinx and published to GitHub Pages from smartem-decisions.

```bash
# Build locally (requires sphinx)
cd docs
sphinx-build -E . ../build/html
```

View at: https://diamondlightsource.github.io/smartem-decisions/

## Claude Code Configuration

The `claude-code/` directory contains configuration for AI-assisted development across the SmartEM workspace:

- **Skills**: Reusable capabilities (database-admin, devops, git, github, technical-writer)
- **Repo guidelines**: Code standards and workflows per repository
- **Architecture docs**: System design and integration points

### Setting up Claude Code

When working in the ERIC multi-repo workspace:

1. Symlink skills to `.claude/skills/` at workspace root
2. Reference `claude-code/ARCHITECTURE.md` for system context
3. Use repo-specific guidelines for code standards

## Documentation Structure

Following the [Diataxis](https://diataxis.fr/) framework:

| Type | Purpose | Location |
|------|---------|----------|
| **Tutorials** | Learning-oriented | `docs/tutorials/` |
| **How-to guides** | Task-oriented | `docs/how-to/` |
| **Explanations** | Understanding-oriented | `docs/explanations/` |
| **Reference** | Information-oriented | `docs/reference/` |

## Architecture Decision Records

ADRs document significant technical decisions:

| ADR | Title |
|-----|-------|
| 0001 | Record architecture decisions |
| 0002 | Switched to python-copier-template (superseded by ADR-0011) |
| 0003 | Message queue message grouping |
| 0004 | Zocalo dependency-free |
| 0005 | detect-secrets for secret scanning |
| 0006 | Sealed secrets for Kubernetes |
| 0007 | Eliminate SmartEM API circular dependency |
| 0008 | Backend to agent communication architecture |
| 0009 | Commit generated route tree (smartem-frontend) |
| 0011 | Remove python-copier-template |

## Contributing

- Use British English in documentation
- No emojis in code or docs (Windows build compatibility)
- Follow existing patterns in `claude-code/` for new skills
- ADRs for significant architectural decisions

## Links

- [Documentation](https://diamondlightsource.github.io/smartem-decisions/)
- [Project Board](https://github.com/orgs/DiamondLightSource/projects/51/views/1)
- [SmartEM Backend](https://github.com/DiamondLightSource/smartem-decisions)

## Licence

Apache-2.0
