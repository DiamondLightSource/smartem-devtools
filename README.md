[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-6366f1?logo=claude)](https://claude.ai/code)
[![PyPI - smartem-workspace](https://img.shields.io/pypi/v/smartem-workspace?label=smartem-workspace)](https://pypi.org/project/smartem-workspace/)

# smartem-devtools

Developer tooling, documentation, and workspace configuration for the SmartEM multi-repo ecosystem.

## Quick Links

Source          | <https://github.com/DiamondLightSource/smartem-devtools>
:---:           | :---:
Documentation   | <https://DiamondLightSource.github.io/smartem-devtools>
Project Board   | <https://github.com/orgs/DiamondLightSource/projects/51/views/1>

## What's Included

- **docs/**: Central documentation for all SmartEM repositories
- **webui/**: Developer dashboard (React/Vite)
- **claude-code/**: AI-assisted development configuration
- **core/**: Shared TypeScript configuration
- **packages/smartem-workspace/**: CLI tool for workspace setup

## Quick Start

```bash
# Set up complete development environment
uvx smartem-workspace init --preset smartem-core

# Run developer dashboard
cd webui
npm install
npm run dev
```

Opens at http://localhost:5173

## Related Repositories

| Repository | Purpose |
|------------|---------|
| [smartem-decisions](https://github.com/DiamondLightSource/smartem-decisions) | Backend API, agent, database |
| [smartem-frontend](https://github.com/DiamondLightSource/smartem-frontend) | User-facing web interface |
| [fandanGO-cryoem-dls](https://github.com/DiamondLightSource/fandanGO-cryoem-dls) | ARIA deposition plugin |
| [cryoem-services](https://github.com/DiamondLightSource/cryoem-services) | Processing pipeline (reference) |

## Documentation

Full documentation: <https://DiamondLightSource.github.io/smartem-devtools>

## Contributing

See the [contribution guide](https://diamondlightsource.github.io/smartem-devtools/docs/development/contributing) for development workflow and code standards.

## Licence

Apache-2.0
