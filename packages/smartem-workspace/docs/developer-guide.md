# Developer Guide: smartem-workspace

This guide is for developers who want to contribute to or modify the `smartem-workspace` package.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Package Structure](#package-structure)
- [Core Components](#core-components)
- [Configuration System](#configuration-system)
- [Development Setup](#development-setup)
- [Testing Strategy](#testing-strategy)
- [CI/CD Pipeline](#cicd-pipeline)
- [Contributing Guidelines](#contributing-guidelines)
- [Troubleshooting Development](#troubleshooting-development)
- [API Reference](#api-reference)
- [Extending the Tool](#extending-the-tool)

## Architecture Overview

### Design Philosophy

`smartem-workspace` follows these principles:

1. **Network-first configuration** - Fetch latest repository metadata from GitHub, fall back to bundled config
2. **Zero permanent installation** - Designed for `uvx` (run without install)
3. **Idempotent operations** - Safe to re-run without side effects
4. **Progressive enhancement** - Core functionality works offline with graceful degradation
5. **Explicit over implicit** - Clear user prompts, no hidden magic
6. **Fail fast** - Validate early, provide actionable error messages

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                        User Invocation                       │
│                   uvx smartem-workspace init                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      CLI Entry Point                         │
│                     cli.py (Typer app)                       │
│  • Parse arguments                                           │
│  • Validate options                                          │
│  • Route to command handler                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Configuration Loading                      │
│                  config/loader.py                            │
│  1. Try: Fetch from GitHub (main branch)                    │
│  2. Fallback: Use bundled repos.json                        │
│  3. Validate with Pydantic schemas                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               Interactive Prompts (if enabled)               │
│                  interactive/prompts.py                      │
│  • Preset or custom selection                               │
│  • Repository selection (custom mode)                       │
│  • Target directory confirmation                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Setup Orchestration                       │
│                   setup/bootstrap.py                         │
│  • Create workspace directory structure                     │
│  • Clone repositories (parallel or serial)                  │
│  • Setup Claude Code configuration                          │
│  • Setup Serena MCP server                                  │
│  • Create workspace files (CLAUDE.md, etc.)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     Completion Report                        │
│  • Summary of cloned repositories                           │
│  • Total workspace size                                     │
│  • Next steps for user                                      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Configuration Loading Flow

```
User runs command
      │
      ▼
Load configuration (config/loader.py)
      │
      ├─► Try: httpx.get(GITHUB_RAW_URL/repos.json)
      │        │
      │        ├─► Success: Parse JSON → Validate with Pydantic
      │        │                              │
      │        │                              └─► Return RepoConfig
      │        │
      │        └─► Failure: Log warning
      │                     │
      │                     ▼
      └─► Fallback: Load bundled repos.json (in wheel)
                    │
                    └─► Parse JSON → Validate with Pydantic → Return RepoConfig
```

#### Repository Cloning Flow

```
For each repository in selection:
      │
      ▼
Determine clone URL (HTTPS or SSH)
      │
      ▼
Check if target directory exists
      │
      ├─► Exists: Skip (already cloned)
      │
      └─► Not exists:
            │
            ▼
          Create parent directory
            │
            ▼
          Run: git clone <url> <target>
            │
            ├─► Success: Update progress indicator
            │
            └─► Failure: Log error, continue with next repo
                         (or abort if critical)
```

### Error Handling Strategy

1. **Validation errors**: Fail immediately with clear message (e.g., invalid preset name)
2. **Network errors**: Degrade gracefully (use bundled config)
3. **Git errors**: Log and continue for individual repos, fail if all repos fail
4. **Permission errors**: Fail immediately with actionable guidance
5. **User cancellation**: Clean up partial state, exit gracefully

## Package Structure

```
packages/smartem-workspace/
├── smartem_workspace/              # Main package
│   ├── __init__.py                 # Package metadata (__version__)
│   ├── __main__.py                 # Entry point for python -m
│   ├── cli.py                      # Typer CLI application
│   │
│   ├── config/                     # Configuration system
│   │   ├── __init__.py             # Public exports
│   │   ├── loader.py               # Network-first config fetcher
│   │   ├── schema.py               # Pydantic models
│   │   └── repos.json              # Bundled fallback config
│   │
│   ├── interactive/                # User interaction
│   │   ├── __init__.py             # Public exports
│   │   └── prompts.py              # Rich prompts and menus
│   │
│   ├── setup/                      # Setup orchestration
│   │   ├── __init__.py             # Public exports
│   │   ├── bootstrap.py            # Main orchestrator
│   │   ├── repos.py                # Git cloning logic
│   │   ├── claude.py               # Claude Code setup
│   │   ├── serena.py               # Serena MCP setup
│   │   └── workspace.py            # Directory structure creation
│   │
│   └── utils/                      # Shared utilities
│       ├── __init__.py             # Public exports
│       ├── git.py                  # Git operations
│       └── paths.py                # Path helpers and validation
│
├── tests/                          # Unit tests
│   ├── __init__.py
│   ├── test_config.py              # Configuration system tests
│   └── test_utils.py               # Utility function tests
│
├── docs/                           # Developer documentation
│   ├── developer-guide.md          # This file
│   └── pypi-setup.md               # PyPI token setup
│
├── dist/                           # Build artifacts (generated)
│   ├── smartem_workspace-*.whl     # Wheel distribution
│   └── smartem_workspace-*.tar.gz  # Source distribution
│
├── pyproject.toml                  # Package metadata and build config
├── README.md                       # User-facing documentation
└── uv.lock                         # Locked dependencies
```

### Module Responsibilities

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| `cli.py` | CLI entry point | `app()`, `init()`, `sync()`, `status()`, `add()` |
| `config/loader.py` | Load configuration | `load_config()`, `fetch_remote_config()`, `load_bundled_config()` |
| `config/schema.py` | Data models | `RepoConfig`, `Repository`, `ClaudeConfig`, `Preset` |
| `interactive/prompts.py` | User prompts | `select_preset()`, `select_repositories()`, `confirm_setup()` |
| `setup/bootstrap.py` | Orchestration | `bootstrap()`, `run_setup()` |
| `setup/repos.py` | Git operations | `clone_repositories()`, `clone_single_repo()` |
| `setup/claude.py` | Claude Code | `setup_claude_config()`, `create_symlinks()` |
| `setup/serena.py` | Serena MCP | `setup_serena()`, `configure_mcp()` |
| `setup/workspace.py` | Workspace files | `create_workspace_structure()`, `create_claude_md()` |
| `utils/git.py` | Git helpers | `get_clone_url()`, `run_git_command()` |
| `utils/paths.py` | Path utilities | `resolve_workspace_path()`, `ensure_directory()` |

## Core Components

### CLI Interface (cli.py)

Built with [Typer](https://typer.tiangolo.com/) for type-safe CLI parsing.

#### Key Design Decisions

- **Rich output**: Uses `rich` library for beautiful terminal output
- **Subcommands**: Each command (`init`, `sync`, `status`, `add`) is a separate function
- **Type safety**: All arguments are type-hinted, Typer validates at runtime
- **Help text**: Extensive help strings auto-generate documentation

#### Command Structure

```python
import typer
from typing_extensions import Annotated

app = typer.Typer(
    name="smartem-workspace",
    help="CLI tool to automate SmartEM multi-repo workspace setup",
    add_completion=False,
)

@app.command()
def init(
    path: Annotated[Path, typer.Option(help="Target directory")] = Path.cwd(),
    preset: Annotated[str, typer.Option(help="Preset name")] = None,
    no_interactive: Annotated[bool, typer.Option(help="Skip prompts")] = False,
    ssh: Annotated[bool, typer.Option(help="Use SSH URLs")] = False,
    skip_claude: Annotated[bool, typer.Option(help="Skip Claude Code")] = False,
    skip_serena: Annotated[bool, typer.Option(help="Skip Serena MCP")] = False,
) -> None:
    """Initialize a new SmartEM workspace."""
    # Implementation
```

#### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error (validation, network, etc.) |
| 2 | User cancelled |
| 3 | Configuration error |
| 4 | Git operation failed |

### Configuration System (config/)

#### Network-First Loading Strategy

The configuration system prioritises fresh data from GitHub:

**Why Network-First?**
- Users get latest repository metadata without updating the package
- New repositories can be added without releasing new version
- Offline fallback ensures reliability

**Implementation (config/loader.py):**

```python
import httpx
from pathlib import Path
import json

GITHUB_RAW_URL = "https://raw.githubusercontent.com/DiamondLightSource/smartem-devtools/main/packages/smartem-workspace/smartem_workspace/config/repos.json"

def load_config() -> RepoConfig:
    """Load configuration with network-first strategy."""
    try:
        config_dict = fetch_remote_config()
        return RepoConfig.model_validate(config_dict)
    except Exception as e:
        logger.warning(f"Failed to fetch remote config: {e}. Using bundled config.")
        return load_bundled_config()

def fetch_remote_config() -> dict:
    """Fetch configuration from GitHub."""
    response = httpx.get(GITHUB_RAW_URL, timeout=10.0, follow_redirects=True)
    response.raise_for_status()
    return response.json()

def load_bundled_config() -> RepoConfig:
    """Load bundled configuration as fallback."""
    bundled_path = Path(__file__).parent / "repos.json"
    with bundled_path.open() as f:
        config_dict = json.load(f)
    return RepoConfig.model_validate(config_dict)
```

#### Pydantic Models (config/schema.py)

All configuration is validated with Pydantic for type safety and data integrity.

**Key Models:**

```python
from pydantic import BaseModel, HttpUrl, Field
from typing import List, Dict, Literal

class Repository(BaseModel):
    """Repository metadata."""
    id: str = Field(..., description="Unique identifier")
    org: str = Field(..., description="GitHub organisation")
    name: str = Field(..., description="Repository name")
    url: HttpUrl = Field(..., description="Clone URL (HTTPS)")
    description: str = Field(..., description="Short description")
    ownership: Literal["full", "reference", "mirror"] = Field(..., description="Ownership level")
    deliverable: str = Field(..., description="Work package deliverable")
    work_package: str | None = Field(None, description="ERIC work package")

class ClaudeConfigItem(BaseModel):
    """Claude Code configuration item (skill, agent, setting)."""
    id: str = Field(..., description="Unique identifier")
    type: Literal["skill", "agent", "setting"] = Field(..., description="Config type")
    path: str = Field(..., description="Source path in repository")
    target_path: str = Field(..., description="Target path in workspace")

class Preset(BaseModel):
    """Predefined repository collection."""
    name: str = Field(..., description="Display name")
    description: str = Field(..., description="Short description")
    repositories: List[str] = Field(..., description="Repository IDs")

class RepoConfig(BaseModel):
    """Root configuration model."""
    version: str = Field(..., description="Config schema version")
    repositories: List[Repository] = Field(..., description="All repositories")
    claude_config: List[ClaudeConfigItem] = Field(..., description="Claude Code items")
    presets: Dict[str, Preset] = Field(..., description="Presets by name")
```

**Validation Benefits:**
- Type errors caught at config load time
- Auto-generated JSON schema for documentation
- Clear error messages for invalid config
- IDE autocomplete for config access

#### Configuration File (repos.json)

JSON file defining all repositories and presets:

```json
{
  "version": "1.0",
  "repositories": [
    {
      "id": "smartem-decisions",
      "org": "DiamondLightSource",
      "name": "smartem-decisions",
      "url": "https://github.com/DiamondLightSource/smartem-decisions",
      "description": "Backend (FastAPI, PostgreSQL, RabbitMQ)",
      "ownership": "full",
      "deliverable": "SmartEM",
      "work_package": "WP5"
    }
  ],
  "claude_config": [
    {
      "id": "database-admin",
      "type": "skill",
      "path": "claude-code/shared/skills/database-admin",
      "target_path": ".claude/skills/database-admin"
    }
  ],
  "presets": {
    "smartem-core": {
      "name": "SmartEM Core",
      "description": "Core development repositories",
      "repositories": ["smartem-devtools", "smartem-decisions", "smartem-frontend"]
    }
  }
}
```

### Setup Orchestration (setup/bootstrap.py)

Coordinates all setup steps in the correct order.

**Orchestration Flow:**

```python
def bootstrap(config: BootstrapConfig) -> None:
    """Main orchestration function."""
    # 1. Validate inputs
    validate_configuration(config)
    
    # 2. Create workspace structure
    create_workspace_structure(config.workspace_path)
    
    # 3. Clone repositories
    if config.repositories:
        clone_repositories(config.repositories, config.workspace_path, config.use_ssh)
    
    # 4. Setup Claude Code (unless skipped)
    if not config.skip_claude:
        setup_claude_config(config.workspace_path, config.claude_config)
    
    # 5. Setup Serena MCP (unless skipped)
    if not config.skip_serena:
        setup_serena(config.workspace_path)
    
    # 6. Create workspace files
    create_workspace_files(config.workspace_path)
    
    # 7. Display completion summary
    show_completion_summary(config)
```

**Error Recovery:**

If a step fails:
1. Log detailed error with context
2. Attempt to clean up partial state (optional)
3. Provide actionable guidance for user
4. Exit with appropriate code

**Design Consideration:** No automatic rollback. Partial setup is often useful for debugging.

### Git Operations (setup/repos.py)

Handles repository cloning with progress indicators.

**Key Functions:**

```python
def clone_repositories(
    repos: List[Repository],
    workspace_path: Path,
    use_ssh: bool = False,
) -> None:
    """Clone all repositories with progress tracking."""
    console = Console()
    
    with Progress() as progress:
        task = progress.add_task(f"Cloning {len(repos)} repositories...", total=len(repos))
        
        for repo in repos:
            clone_single_repo(repo, workspace_path, use_ssh)
            progress.update(task, advance=1)

def clone_single_repo(
    repo: Repository,
    workspace_path: Path,
    use_ssh: bool = False,
) -> None:
    """Clone a single repository."""
    target_path = workspace_path / "repos" / repo.org / repo.name
    
    # Skip if already exists
    if target_path.exists():
        logger.info(f"Skipping {repo.name} (already exists)")
        return
    
    # Ensure parent directory exists
    target_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Determine clone URL
    clone_url = get_clone_url(repo, use_ssh)
    
    # Run git clone
    try:
        subprocess.run(
            ["git", "clone", clone_url, str(target_path)],
            check=True,
            capture_output=True,
            text=True,
        )
        logger.info(f"Cloned {repo.name} successfully")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to clone {repo.name}: {e.stderr}")
        raise
```

**Design Decisions:**
- **Skip existing**: Idempotent - safe to re-run
- **Create parents**: `mkdir -p` behaviour
- **Capture output**: Don't spam user with git output
- **Progress bar**: Rich progress indicator for better UX

### Claude Code Setup (setup/claude.py)

Creates `.claude/` directory with skills, settings, and permissions.

**Setup Steps:**

1. Create `.claude/` directory structure
2. Symlink skills from `claude-config/shared/skills/`
3. Copy settings and permissions JSON files
4. Create `CLAUDE.md` workspace overview

**Symlink Creation:**

Fixed in commit `2823f1e` to use absolute paths:

```python
import os

def create_skill_symlinks(workspace_path: Path, skills: List[ClaudeConfigItem]) -> None:
    """Create symlinks for Claude Code skills."""
    skills_dir = workspace_path / ".claude" / "skills"
    skills_dir.mkdir(parents=True, exist_ok=True)
    
    for skill in skills:
        source = workspace_path / skill.path  # Absolute path
        target = workspace_path / skill.target_path  # Absolute path
        
        # Use os.symlink with absolute paths (works on all platforms)
        if not target.exists():
            os.symlink(str(source), str(target))
```

**Why Symlinks?**
- Avoid duplication (skills are versioned in repositories)
- Easy updates (edit once, reflected everywhere)
- Mirrors workspace structure (clear relationship)

### Interactive Prompts (interactive/prompts.py)

Rich interactive menus for user input.

**Preset Selection:**

```python
from rich.prompt import Prompt
from rich.console import Console

def select_preset(presets: Dict[str, Preset]) -> str | None:
    """Interactive preset selection."""
    console = Console()
    
    console.print("\n[bold]Select a preset or choose custom:[/bold]\n")
    
    options = list(presets.keys()) + ["custom"]
    for i, option in enumerate(options, 1):
        if option == "custom":
            console.print(f"  {i}. [yellow]custom[/yellow] - Select repositories manually")
        else:
            preset = presets[option]
            console.print(f"  {i}. [cyan]{option}[/cyan] - {preset.description}")
    
    choice = Prompt.ask(
        "\nChoice",
        choices=[str(i) for i in range(1, len(options) + 1)],
        default="2",  # smartem-core
    )
    
    selected = options[int(choice) - 1]
    return None if selected == "custom" else selected
```

**Repository Selection (Custom Mode):**

Uses `rich.prompt.Confirm` for each repository group:

```python
def select_repositories(config: RepoConfig) -> List[str]:
    """Interactive repository selection."""
    selected = []
    
    # Group by organisation
    by_org = group_repositories_by_org(config.repositories)
    
    for org, repos in by_org.items():
        console.print(f"\n[bold]{org}[/bold]")
        
        for repo in repos:
            include = Confirm.ask(
                f"  Include {repo.name}? ({repo.description})",
                default=False,
            )
            if include:
                selected.append(repo.id)
    
    return selected
```

## Configuration System

### repos.json Schema

Full schema with all fields explained:

```json
{
  "version": "1.0",
  "repositories": [
    {
      "id": "unique-identifier",
      "org": "GitHubOrganisation",
      "name": "repository-name",
      "url": "https://github.com/Organisation/repository-name",
      "description": "Short description for selection menu",
      "ownership": "full | reference | mirror",
      "deliverable": "SmartEM | ARIA | Devtools",
      "work_package": "WP5 | WP4 | null"
    }
  ],
  "claude_config": [
    {
      "id": "config-item-id",
      "type": "skill | agent | setting",
      "path": "claude-code/path/to/source",
      "target_path": ".claude/path/to/target"
    }
  ],
  "presets": {
    "preset-name": {
      "name": "Display Name",
      "description": "Description shown in selection",
      "repositories": ["repo-id-1", "repo-id-2"]
    }
  }
}
```

### Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Config schema version (for future migrations) |
| `repositories[].id` | string | Unique identifier (used in presets) |
| `repositories[].org` | string | GitHub organisation or GitLab group |
| `repositories[].name` | string | Repository name (matches GitHub) |
| `repositories[].url` | URL | HTTPS clone URL |
| `repositories[].description` | string | Shown in selection menu |
| `repositories[].ownership` | enum | `full` (can edit), `reference` (read-only), `mirror` (DLS mirror of external) |
| `repositories[].deliverable` | string | ERIC work package deliverable |
| `repositories[].work_package` | string | ERIC WP number (or null) |
| `claude_config[].id` | string | Unique identifier |
| `claude_config[].type` | enum | `skill`, `agent`, or `setting` |
| `claude_config[].path` | string | Source path in repository |
| `claude_config[].target_path` | string | Target path in workspace |
| `presets.*.name` | string | Display name for UI |
| `presets.*.description` | string | Short description |
| `presets.*.repositories` | array | Repository IDs to include |

### Preset Definitions

Current presets in repos.json:

```json
{
  "presets": {
    "minimal": {
      "name": "Minimal",
      "description": "Just smartem-devtools (13 MB, 1 repo)",
      "repositories": ["smartem-devtools"]
    },
    "smartem-core": {
      "name": "SmartEM Core",
      "description": "Core development repos (31 MB, 3 repos)",
      "repositories": ["smartem-devtools", "smartem-decisions", "smartem-frontend"]
    },
    "aria-reference": {
      "name": "ARIA Reference",
      "description": "ARIA ecosystem (100 MB, 20+ repos)",
      "repositories": [
        "smartem-devtools",
        "fandanGO-core",
        "fandanGO-aria",
        "fandanGO-cryoem-dls",
        "data-deposition-api",
        "aria-graphql-client"
      ]
    },
    "full": {
      "name": "Full",
      "description": "Complete ecosystem (150 MB, 30+ repos)",
      "repositories": ["all-repository-ids"]
    }
  }
}
```

## Development Setup

### Prerequisites

- **Python 3.11+**: Check with `python --version`
- **uv**: Install with `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **Git**: For version control

### Local Development Environment

```bash
# Clone the repository
git clone https://github.com/DiamondLightSource/smartem-devtools
cd smartem-devtools/packages/smartem-workspace

# Create virtual environment and install dependencies
uv sync --all-extras

# Activate virtual environment
source .venv/bin/activate  # Linux/macOS
# or
.venv\Scripts\activate  # Windows

# Verify installation
uv run python -c "import smartem_workspace; print(smartem_workspace.__version__)"
```

### Running from Source

```bash
# Run module directly
uv run python -m smartem_workspace init --help

# Or use the CLI entry point
uv run smartem-workspace init --help

# For development, add --reload for auto-restart on changes (if using FastAPI CLI pattern)
# (Not applicable for this CLI, but shows the pattern)
```

### Building Locally

```bash
# Build wheel and source distribution
uv build

# Output in dist/
ls -lh dist/
# smartem_workspace-0.1.0-py3-none-any.whl
# smartem_workspace-0.1.0.tar.gz

# Inspect wheel contents
unzip -l dist/smartem_workspace-0.1.0-py3-none-any.whl
```

### Testing Local Build

```bash
# Test with uvx from local wheel
uvx --from ./dist/smartem_workspace-0.1.0-py3-none-any.whl smartem-workspace init --help

# Test installation in isolated environment
cd /tmp
python -m venv test-env
source test-env/bin/activate
pip install /path/to/smartem-devtools/packages/smartem-workspace/dist/smartem_workspace-0.1.0-py3-none-any.whl
smartem-workspace --version
deactivate
rm -rf test-env
```

### Code Quality Tools

```bash
# Run linter
uv run ruff check .

# Auto-fix linting issues
uv run ruff check --fix .

# Check formatting
uv run ruff format --check .

# Auto-format code
uv run ruff format .

# Run all checks (add to pre-commit)
uv run ruff check . && uv run ruff format --check .
```

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make changes with tests**
   ```bash
   # Edit code
   vim smartem_workspace/cli.py
   
   # Add test
   vim tests/test_cli.py
   
   # Run tests
   uv run pytest -v
   ```

3. **Check code quality**
   ```bash
   uv run ruff check .
   uv run ruff format .
   ```

4. **Build and test locally**
   ```bash
   uv build
   uvx --from ./dist/smartem_workspace-0.1.0-py3-none-any.whl smartem-workspace init --preset minimal
   ```

5. **Commit with conventional commit message**
   ```bash
   git add .
   git commit -m "feat: add support for custom preset files"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/my-new-feature
   gh pr create --title "Add custom preset file support" --body "..."
   ```

## Testing Strategy

### Unit Tests

Located in `tests/`, run with pytest:

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=smartem_workspace --cov-report=html

# Run specific test file
uv run pytest tests/test_config.py

# Run specific test
uv run pytest tests/test_config.py::test_load_bundled_config

# Verbose output
uv run pytest -v

# Very verbose (show print statements)
uv run pytest -vv -s
```

### Test Structure

```python
# tests/test_config.py

import pytest
from smartem_workspace.config import load_config, load_bundled_config
from smartem_workspace.config.schema import RepoConfig

def test_load_bundled_config():
    """Test bundled configuration loads correctly."""
    config = load_bundled_config()
    
    assert isinstance(config, RepoConfig)
    assert config.version == "1.0"
    assert len(config.repositories) > 0
    assert "smartem-devtools" in [r.id for r in config.repositories]

def test_preset_validation():
    """Test preset contains valid repository IDs."""
    config = load_bundled_config()
    
    repo_ids = {r.id for r in config.repositories}
    
    for preset_name, preset in config.presets.items():
        for repo_id in preset.repositories:
            assert repo_id in repo_ids, f"Preset '{preset_name}' references unknown repo '{repo_id}'"

@pytest.fixture
def temp_workspace(tmp_path):
    """Fixture providing temporary workspace directory."""
    workspace = tmp_path / "test-workspace"
    workspace.mkdir()
    return workspace

def test_workspace_creation(temp_workspace):
    """Test workspace directory structure creation."""
    from smartem_workspace.setup.workspace import create_workspace_structure
    
    create_workspace_structure(temp_workspace)
    
    assert (temp_workspace / "repos").is_dir()
    assert (temp_workspace / "claude-config").is_dir()
    assert (temp_workspace / "tmp").is_dir()
    assert (temp_workspace / "testdata").is_dir()
```

### Integration Tests

Manual integration tests (documented, not automated):

**Test 1: Minimal Preset**
```bash
cd /tmp/test-minimal
uvx smartem-workspace init --preset minimal --no-interactive
# Verify: 1 repo cloned, ~13 MB, Claude Code setup
```

**Test 2: smartem-core Preset**
```bash
cd /tmp/test-core
uvx smartem-workspace init --preset smartem-core --no-interactive
# Verify: 3 repos cloned, ~31 MB, skills symlinked
```

**Test 3: SSH URLs**
```bash
cd /tmp/test-ssh
uvx smartem-workspace init --preset minimal --ssh --no-interactive
# Verify: Repos cloned via SSH (git@github.com:...)
```

**Test 4: Error Recovery**
```bash
cd /tmp/test-error
# Create directory first to test error handling
mkdir -p repos/DiamondLightSource/smartem-devtools
uvx smartem-workspace init --preset minimal --no-interactive
# Verify: Skips existing repo, continues with others
```

### Test Coverage

Current coverage (as of v0.1.0):

| Module | Coverage | Notes |
|--------|----------|-------|
| `cli.py` | Manual | Tested via integration tests |
| `config/loader.py` | 85% | Network fetching not mocked |
| `config/schema.py` | 100% | Pydantic validation tests |
| `setup/bootstrap.py` | Manual | Orchestration tested end-to-end |
| `setup/repos.py` | Manual | Git operations tested manually |
| `setup/claude.py` | Manual | Symlink creation tested manually |
| `utils/git.py` | 70% | Helper functions unit tested |
| `utils/paths.py` | 90% | Path utilities unit tested |

**Goal**: Achieve 80%+ coverage with automated integration tests in CI.

### Adding New Tests

1. **Create test file**: `tests/test_<module>.py`
2. **Import module**: `from smartem_workspace.<module> import <function>`
3. **Write test**: Use `pytest` conventions, descriptive names
4. **Use fixtures**: For temporary directories, config mocking, etc.
5. **Run test**: `uv run pytest tests/test_<module>.py -v`
6. **Check coverage**: `uv run pytest --cov=smartem_workspace`

## CI/CD Pipeline

### GitHub Actions Workflow

File: `.github/workflows/publish-smartem-workspace.yml`

Automated testing, building, version bumping, and publishing to PyPI.

### Workflow Jobs

#### Job 1: Test

Runs unit tests with coverage reporting:

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - uses: astral-sh/setup-uv@v5
    - run: uv python install 3.11
    - run: uv sync --all-extras
    - run: uv run pytest -v --cov=smartem_workspace --cov-report=xml
    - uses: codecov/codecov-action@v5
```

#### Job 2: Lint

Checks code quality:

```yaml
lint:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - uses: astral-sh/setup-uv@v5
    - run: uv python install 3.11
    - run: uv sync --all-extras
    - run: uv run ruff check .
    - run: uv run ruff format --check .
```

#### Job 3: Build

Creates wheel and sdist:

```yaml
build:
  runs-on: ubuntu-latest
  needs: [test, lint]
  steps:
    - uses: actions/checkout@v6
    - uses: astral-sh/setup-uv@v5
    - run: uv build
    - uses: actions/upload-artifact@v4
      with:
        name: dist
        path: packages/smartem-workspace/dist/*
```

#### Job 4: Version Bump

Automated versioning with commitizen (main branch only):

```yaml
version-bump:
  runs-on: ubuntu-latest
  needs: [test, lint]
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  steps:
    - uses: actions/checkout@v6
      with:
        fetch-depth: 0  # Full history for commitizen
    - uses: astral-sh/setup-uv@v5
    - run: uv pip install commitizen
    - run: |
        git config user.name "github-actions[bot]"
        git config user.email "github-actions[bot]@users.noreply.github.com"
    - run: cz bump --yes || echo "No version bump needed"
    - run: git push --follow-tags
```

#### Job 5: Publish to TestPyPI

Continuous deployment to TestPyPI (main branch):

```yaml
publish-testpypi:
  runs-on: ubuntu-latest
  needs: [build, version-bump]
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  environment:
    name: testpypi
    url: https://test.pypi.org/p/smartem-workspace
  steps:
    - uses: actions/download-artifact@v4
    - run: uv pip install twine
    - run: twine upload --repository testpypi dist/*
      env:
        TWINE_USERNAME: __token__
        TWINE_PASSWORD: ${{ secrets.TEST_PYPI_API_TOKEN }}
```

#### Job 6: Publish to PyPI

Production deployment (release tags only):

```yaml
publish-pypi:
  runs-on: ubuntu-latest
  needs: [build]
  if: github.event_name == 'release' && startsWith(github.ref, 'refs/tags/smartem-workspace-v')
  environment:
    name: pypi
    url: https://pypi.org/p/smartem-workspace
  steps:
    - uses: actions/download-artifact@v4
    - run: uv pip install twine
    - run: twine upload dist/*
      env:
        TWINE_USERNAME: __token__
        TWINE_PASSWORD: ${{ secrets.PYPI_API_TOKEN }}
    - run: |
        sleep 60  # Wait for PyPI propagation
        uvx smartem-workspace --version
```

### Triggers

| Event | Condition | Jobs Run |
|-------|-----------|----------|
| **Pull Request** | `packages/smartem-workspace/**` changes | test, lint, build |
| **Push to main** | `packages/smartem-workspace/**` changes | test, lint, build, version-bump, publish-testpypi |
| **Release tag** | Tag: `smartem-workspace-v*` | test, lint, build, publish-pypi |
| **Manual** | workflow_dispatch | test, lint, build |

### Change Detection

Workflow only runs when smartem-workspace package changes:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'packages/smartem-workspace/**'
      - '.github/workflows/publish-smartem-workspace.yml'
```

This prevents unnecessary runs when other parts of the monorepo change.

### Version Bumping Strategy

Uses conventional commits with commitizen:

| Commit Prefix | Version Bump | Example |
|---------------|--------------|---------|
| `feat:` | Minor | 0.1.0 → 0.2.0 |
| `fix:` | Patch | 0.1.0 → 0.1.1 |
| `BREAKING CHANGE:` | Major | 0.1.0 → 1.0.0 |
| `docs:`, `chore:`, etc. | None | 0.1.0 → 0.1.0 |

**Example commit messages:**

```bash
# Patch bump (0.1.0 → 0.1.1)
git commit -m "fix: resolve symlink creation on Windows"

# Minor bump (0.1.0 → 0.2.0)
git commit -m "feat: add support for custom preset files"

# Major bump (0.1.0 → 1.0.0)
git commit -m "feat: redesign configuration system

BREAKING CHANGE: repos.json schema changed, old configs incompatible"
```

### Environments

GitHub Environments configured for publishing:

**testpypi**
- URL: https://test.pypi.org/p/smartem-workspace
- Secret: `TEST_PYPI_API_TOKEN`
- Protection: None (auto-deploy on main)

**pypi**
- URL: https://pypi.org/p/smartem-workspace
- Secret: `PYPI_API_TOKEN`
- Protection: Require manual approval (optional)

## Contributing Guidelines

### Code Standards

- **Line length**: 120 characters (configured in ruff)
- **Type hints**: Required for all function signatures
- **Docstrings**: Google style for public functions
- **No emojis**: Windows compatibility (avoid Unicode in code/comments)
- **British English**: For documentation (e.g., "organise", not "organize")

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `chore`: Maintenance tasks
- `test`: Test additions/changes
- `refactor`: Code restructuring
- `ci`: CI/CD changes

**Examples:**

```bash
feat: add support for shallow clones

Add --shallow flag to init command for faster cloning of large repositories.

Closes #42
```

```bash
fix: resolve symlink creation on Windows

Use os.symlink() with absolute paths instead of Path.symlink_to() which
creates relative symlinks that resolve incorrectly on Windows.

Fixes #38
```

### PR Workflow

1. **Fork or branch**: Create feature branch from `main`
2. **Implement changes**: Code + tests + documentation
3. **Run checks**: `uv run pytest && uv run ruff check .`
4. **Commit**: Use conventional commit format
5. **Push**: `git push origin feature/my-feature`
6. **Create PR**: Use GitHub PR template
7. **Address feedback**: Respond to review comments
8. **Merge**: Squash and merge to main

### Code Review Checklist

- [ ] Tests added for new functionality
- [ ] Documentation updated (README, user guide, or developer guide)
- [ ] Code follows style guide (ruff passes)
- [ ] Type hints on all functions
- [ ] No emojis in code
- [ ] Commit messages follow conventional format
- [ ] PR description explains the why, not just the what

### Release Process

1. **Merge PRs to main**: CI auto-bumps version based on commits
2. **Verify TestPyPI**: Check https://test.pypi.org/project/smartem-workspace/
3. **Create release**: Tag format: `smartem-workspace-v<version>`
   ```bash
   git tag smartem-workspace-v0.2.0
   git push origin smartem-workspace-v0.2.0
   ```
4. **CI publishes to PyPI**: Automatic on tag push
5. **Verify production**: `uvx smartem-workspace@0.2.0 --version`
6. **Create GitHub Release**: Add release notes

## Troubleshooting Development

### Import Errors

**Error:** `ModuleNotFoundError: No module named 'smartem_workspace'`

**Solutions:**
```bash
# Ensure virtual environment is activated
source .venv/bin/activate

# Re-sync dependencies
uv sync --all-extras

# Check installed packages
uv pip list | grep smartem
```

### Test Failures

**Error:** Tests fail locally but pass in CI

**Common causes:**
- Python version mismatch (CI uses 3.11)
- Missing dependencies (run `uv sync --all-extras`)
- Environment-specific paths

**Debug:**
```bash
# Run with verbose output
uv run pytest -vv -s

# Run specific failing test
uv run pytest tests/test_config.py::test_load_bundled_config -vv

# Check Python version
python --version

# Recreate venv from scratch
rm -rf .venv
uv sync --all-extras
```

### Build Issues

**Error:** `ModuleNotFoundError` when testing wheel

**Cause:** Missing files in wheel (not included by hatchling)

**Solution:**
```bash
# Inspect wheel contents
unzip -l dist/smartem_workspace-0.1.0-py3-none-any.whl

# Check pyproject.toml [tool.hatch.build.targets.wheel]
# Ensure all necessary files are included
```

**Error:** Wheel includes unwanted files

**Solution:**
```bash
# Add to .gitignore and rebuild
echo "unwanted_dir/" >> .gitignore
rm -rf dist/
uv build
```

### CI/CD Issues

**Error:** `TWINE_PASSWORD` secret not found

**Cause:** GitHub Secret not configured or workflow doesn't have access

**Solution:**
1. Go to repository settings → Secrets and variables → Actions
2. Add `PYPI_API_TOKEN` and `TEST_PYPI_API_TOKEN`
3. Ensure environment names match (pypi, testpypi)

**Error:** Version bump fails

**Cause:** No conventional commits since last tag, or git config issues

**Solution:**
```bash
# Check recent commits
git log --oneline -5

# Ensure at least one feat/fix commit exists
git commit --allow-empty -m "feat: trigger version bump"

# Check git config
git config user.name
git config user.email
```

## API Reference

### CLI Commands

#### init

```python
def init(
    path: Path = Path.cwd(),
    preset: str | None = None,
    no_interactive: bool = False,
    ssh: bool = False,
    skip_claude: bool = False,
    skip_serena: bool = False,
) -> None:
    """Initialize a new SmartEM workspace.
    
    Args:
        path: Target directory for workspace
        preset: Preset name (minimal, smartem-core, aria-reference, full)
        no_interactive: Skip all prompts (requires preset)
        ssh: Use SSH URLs instead of HTTPS
        skip_claude: Skip Claude Code configuration
        skip_serena: Skip Serena MCP setup
        
    Raises:
        typer.Exit: On validation error or user cancellation
    """
```

#### sync

```python
def sync(path: Path = Path.cwd()) -> None:
    """Sync all repositories in workspace (git pull).
    
    Args:
        path: Workspace root directory
        
    Raises:
        typer.Exit: On git operation failure
    """
```

#### status

```python
def status(path: Path = Path.cwd()) -> None:
    """Show git status for all repositories.
    
    Args:
        path: Workspace root directory
        
    Displays:
        - Current branch
        - Uncommitted changes
        - Commits ahead/behind remote
    """
```

#### add

```python
def add(
    repository: str,
    path: Path = Path.cwd(),
    ssh: bool = False,
) -> None:
    """Add a single repository to existing workspace.
    
    Args:
        repository: Repository in format "org/name"
        path: Workspace root directory
        ssh: Use SSH URL instead of HTTPS
        
    Raises:
        typer.Exit: On invalid repository or clone failure
    """
```

### Configuration API

#### load_config

```python
def load_config() -> RepoConfig:
    """Load configuration with network-first strategy.
    
    Returns:
        RepoConfig: Validated configuration
        
    Raises:
        ValidationError: If config schema is invalid
    """
```

#### load_bundled_config

```python
def load_bundled_config() -> RepoConfig:
    """Load bundled configuration from package.
    
    Returns:
        RepoConfig: Validated bundled configuration
        
    Raises:
        FileNotFoundError: If repos.json not in package
        ValidationError: If config schema is invalid
    """
```

### Setup API

#### bootstrap

```python
def bootstrap(config: BootstrapConfig) -> None:
    """Main orchestration function for workspace setup.
    
    Args:
        config: Bootstrap configuration
        
    Raises:
        SetupError: On critical setup failure
    """
```

#### clone_repositories

```python
def clone_repositories(
    repos: List[Repository],
    workspace_path: Path,
    use_ssh: bool = False,
) -> None:
    """Clone all repositories with progress tracking.
    
    Args:
        repos: List of repositories to clone
        workspace_path: Workspace root directory
        use_ssh: Use SSH URLs instead of HTTPS
        
    Raises:
        GitError: On clone failure
    """
```

## Extending the Tool

### Adding New Presets

Edit `smartem_workspace/config/repos.json`:

```json
{
  "presets": {
    "my-preset": {
      "name": "My Custom Preset",
      "description": "Repositories for my use case",
      "repositories": ["smartem-decisions", "smartem-frontend"]
    }
  }
}
```

Changes take effect immediately (network-first loading).

### Adding New Repositories

Add to `repositories` array in repos.json:

```json
{
  "repositories": [
    {
      "id": "new-repo",
      "org": "DiamondLightSource",
      "name": "new-repo",
      "url": "https://github.com/DiamondLightSource/new-repo",
      "description": "Short description",
      "ownership": "full",
      "deliverable": "SmartEM",
      "work_package": "WP5"
    }
  ]
}
```

### Adding New CLI Commands

Add to `smartem_workspace/cli.py`:

```python
@app.command()
def my_command(
    arg: Annotated[str, typer.Argument(help="My argument")],
    option: Annotated[bool, typer.Option(help="My option")] = False,
) -> None:
    """Description of my command."""
    # Implementation
    console = Console()
    console.print(f"Running my command with {arg}")
```

### Adding New Setup Steps

1. Create module: `smartem_workspace/setup/my_step.py`
2. Implement setup function:
   ```python
   def setup_my_feature(workspace_path: Path) -> None:
       """Setup my feature."""
       # Implementation
   ```
3. Add to bootstrap flow in `setup/bootstrap.py`:
   ```python
   def bootstrap(config: BootstrapConfig) -> None:
       # ... existing steps
       
       if not config.skip_my_feature:
           setup_my_feature(config.workspace_path)
   ```
4. Add CLI option in `cli.py`:
   ```python
   skip_my_feature: Annotated[bool, typer.Option(...)] = False
   ```
5. Add tests in `tests/test_my_step.py`

### Plugin System (Future)

Planned architecture for extensible setup steps:

```python
# smartem_workspace/plugins/base.py
class SetupPlugin:
    """Base class for setup plugins."""
    
    def __init__(self, workspace_path: Path):
        self.workspace_path = workspace_path
    
    def setup(self) -> None:
        """Run setup."""
        raise NotImplementedError
    
    def teardown(self) -> None:
        """Cleanup setup."""
        pass

# Example plugin
class MyPlugin(SetupPlugin):
    def setup(self) -> None:
        # Custom setup logic
        pass
```

Register plugins in config:

```json
{
  "plugins": [
    {
      "name": "my-plugin",
      "module": "my_plugin.setup",
      "class": "MySetupPlugin",
      "enabled": true
    }
  ]
}
```

---

## Summary

This developer guide covers:

- ✅ Architecture and design philosophy
- ✅ Package structure and module responsibilities
- ✅ Core components deep dive
- ✅ Configuration system
- ✅ Development setup and workflow
- ✅ Testing strategy
- ✅ CI/CD pipeline
- ✅ Contributing guidelines
- ✅ API reference
- ✅ Extension points

For user-facing documentation, see the [Setup SmartEM Workspace](../../docs/how-to/setup-smartem-workspace.md) guide.

For PyPI token setup, see [PyPI Setup Guide](pypi-setup.md).

For questions or contributions, open an issue at https://github.com/DiamondLightSource/smartem-devtools/issues.
