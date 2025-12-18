# smartem-workspace

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

## Development

```bash
cd packages/smartem-workspace

# Install dev dependencies
uv sync --all-extras

# Run tests
uv run pytest

# Run linter
uv run ruff check .
```

## License

Apache-2.0
