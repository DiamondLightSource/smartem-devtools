# smartem-workspace

[![PyPI version](https://badge.fury.io/py/smartem-workspace.svg)](https://pypi.org/project/smartem-workspace/)
[![Python Versions](https://img.shields.io/pypi/pyversions/smartem-workspace.svg)](https://pypi.org/project/smartem-workspace/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![CI](https://github.com/DiamondLightSource/smartem-devtools/actions/workflows/publish-smartem-workspace.yml/badge.svg)](https://github.com/DiamondLightSource/smartem-devtools/actions/workflows/publish-smartem-workspace.yml)

CLI tool to automate SmartEM multi-repo workspace setup.

## Installation

```bash
# Run directly with uvx (recommended)
uvx smartem-workspace init

# Or install globally
uv tool install smartem-workspace
```

## Usage

### Initialize a new workspace

```bash
# Interactive setup in current directory
smartem-workspace init

# Specify target directory
smartem-workspace init --path ~/dev/smartem

# Use a preset (skip repo selection)
smartem-workspace init --preset smartem-core

# Non-interactive with preset
smartem-workspace init --preset full --no-interactive
```

### Available presets

| Preset | Description |
|--------|-------------|
| `smartem-core` | Core SmartEM repos (decisions, frontend, devtools) |
| `full` | All 30+ repos including ARIA reference |
| `aria-reference` | ARIA ecosystem repos for reference |
| `minimal` | Just smartem-devtools (workspace setup only) |

### Other commands

```bash
# Sync existing repos (git pull)
smartem-workspace sync

# Show workspace status
smartem-workspace status

# Add a single repo
smartem-workspace add DiamondLightSource/smartem-frontend
```

### Options

```
--path PATH         Target directory (default: current directory)
--preset NAME       Use preset: smartem-core, full, aria-reference, minimal
--no-interactive    Skip prompts, use preset only
--ssh               Use SSH URLs (default: HTTPS)
--skip-claude       Skip Claude Code setup
--skip-serena       Skip Serena MCP setup
```

## What it sets up

1. **Repository clones** - Organized by organization (DiamondLightSource, FragmentScreen, GitlabAriaPHP)
2. **Claude Code configuration** - Skills, settings, permissions
3. **Serena MCP server** - Semantic code navigation
4. **Workspace structure** - CLAUDE.md, tmp/, testdata/ directories

## Documentation

- **User Guide**: [Setup SmartEM Workspace](https://diamondlightsource.github.io/smartem-devtools/how-to/setup-smartem-workspace.html)
- **Developer Guide**: [Contributing to smartem-workspace](https://diamondlightsource.github.io/smartem-devtools/explanations/smartem-workspace-developer-guide.html)
- **PyPI Setup**: [Publishing to PyPI](https://diamondlightsource.github.io/smartem-devtools/how-to/publish-smartem-workspace-to-pypi.html)
- **API Documentation**: [SmartEM Devtools Docs](https://diamondlightsource.github.io/smartem-devtools/)

## Development

```bash
cd packages/smartem-workspace

# Install dev dependencies
uv sync --all-extras

# Run tests
uv run pytest

# Run linter
uv run ruff check .

# Build package
uv build
```

See [Developer Guide](../../docs/explanations/smartem-workspace-developer-guide.md) for detailed development instructions.

## Links

- **PyPI**: https://pypi.org/project/smartem-workspace/
- **Repository**: https://github.com/DiamondLightSource/smartem-devtools
- **Issues**: https://github.com/DiamondLightSource/smartem-devtools/issues
- **Changelog**: [GitHub Releases](https://github.com/DiamondLightSource/smartem-devtools/releases?q=smartem-workspace)

## License

Apache-2.0
