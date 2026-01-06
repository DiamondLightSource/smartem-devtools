# Setup SmartEM Workspace

This guide explains how to use `smartem-workspace` to set up a complete SmartEM development environment.

## Overview

`smartem-workspace` is a command-line tool that automates the setup of a multi-repository workspace for SmartEM development. It handles repository cloning, Claude Code configuration, Serena MCP setup, and workspace structure creation.

### What Gets Set Up

When you run `smartem-workspace init`, the tool creates:

1. **Repository clones** - Organised by GitHub organisation (DiamondLightSource, FragmentScreen, GitlabAriaPHP)
2. **Claude Code configuration** - Skills, agents, settings, and permissions for AI-assisted development
3. **Serena MCP server** - Semantic code navigation and symbol search
4. **Workspace structure** - CLAUDE.md, tmp/, testdata/ directories
5. **Development tools** - Pre-configured for the SmartEM ecosystem

### When to Use This Tool

Use `smartem-workspace` when you need to:

- Set up a new SmartEM development environment
- Clone multiple related repositories at once
- Configure Claude Code for SmartEM development
- Standardise workspace layout across team members
- Quickly bootstrap a dev environment on a new machine

### Prerequisites

Before using `smartem-workspace`, ensure you have:

- **Python 3.11 or later** - Check with `python --version` or `python3 --version`
- **Git** - For repository cloning
- **uv or uvx** - Modern Python package installer ([install guide](https://docs.astral.sh/uv/))
- **Internet connection** - For cloning repositories and fetching configuration
- **GitHub access** - Public repos work without authentication; private repos need credentials

### Installation Methods

#### Method 1: Run Directly with uvx (Recommended)

No installation needed. `uvx` downloads and runs the tool in an isolated environment:

```bash
uvx smartem-workspace init
```

This is the recommended method because:
- No permanent installation clutters your system
- Always uses the latest version from PyPI
- Isolated environment prevents dependency conflicts
- Works immediately without setup

#### Method 2: Install Globally with uv

Install once, use repeatedly:

```bash
uv tool install smartem-workspace
smartem-workspace init
```

Use this method if:
- You'll run the tool frequently
- You want tab completion for the command
- You prefer traditional installed tools

#### Method 3: Install with pipx

Alternative to uv for those who prefer pipx:

```bash
pipx install smartem-workspace
smartem-workspace init
```

### Troubleshooting Installation

#### "uvx: command not found"

Install uv first:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.bashrc  # or ~/.zshrc
```

#### "No module named smartem_workspace"

Ensure you're using the correct command:
- With uvx: `uvx smartem-workspace init` (not `python -m`)
- With installed tool: `smartem-workspace init`

#### "Cannot find package smartem-workspace on PyPI"

The package might not be published yet. Contact the SmartEM team or use a development build.

## Quick Start

The simplest way to get started:

```bash
# Interactive setup in current directory
uvx smartem-workspace init
```

This launches an interactive wizard that:
1. Asks which preset you want (or custom selection)
2. Confirms the target directory
3. Shows what will be cloned
4. Clones repositories with progress indicators
5. Sets up Claude Code configuration
6. Sets up Serena MCP server
7. Creates workspace structure

### Non-Interactive Quick Start

For automated setups or scripts:

```bash
# Use smartem-core preset without prompts
uvx smartem-workspace init --preset smartem-core --no-interactive
```

## Presets Explained

Presets are predefined collections of repositories optimised for different use cases.

### minimal

**Size**: ~13 MB  
**Repositories**: 1  
**Use Case**: Workspace setup and documentation only

Contains only `smartem-devtools` repository. Use this if you:
- Want to explore the documentation
- Need workspace configuration without code repositories
- Are setting up a minimal environment for testing

**Included:**
- `DiamondLightSource/smartem-devtools`

### smartem-core

**Size**: ~31 MB  
**Repositories**: 3  
**Use Case**: Core SmartEM development

Contains the essential repositories for SmartEM development. Use this if you:
- Work on SmartEM backend or frontend
- Need the core system for development and testing
- Want a lightweight but functional development environment

**Included:**
- `DiamondLightSource/smartem-devtools` - Developer tooling and documentation
- `DiamondLightSource/smartem-decisions` - Backend (FastAPI, PostgreSQL, RabbitMQ)
- `DiamondLightSource/smartem-frontend` - Web UI (React, TanStack Router)

### aria-reference

**Size**: ~100 MB  
**Repositories**: 20+  
**Use Case**: ARIA ecosystem exploration and integration work

Contains ARIA backend and FandanGO plugin repositories. Use this if you:
- Work on FandanGO-cryoem-dls (ARIA deposition)
- Need to understand ARIA integration
- Are developing facility plugins

**Included:**
- All `FragmentScreen/fandanGO-*` repositories
- All `GitlabAriaPHP/aria-*` repositories (PHP libraries)
- Peer facility plugins (CNB, CERM, GUF)

### full

**Size**: ~150 MB  
**Repositories**: 30+  
**Use Case**: Complete ecosystem development

Contains all repositories across all organisations. Use this if you:
- Work across multiple SmartEM components
- Need complete context for architectural work
- Are doing cross-repository refactoring
- Want all reference code available

**Included:**
- All DiamondLightSource repositories
- All FragmentScreen repositories
- All GitlabAriaPHP repositories

## Configuration Options

### --path: Target Directory

Specify where to create the workspace:

```bash
# Create in ~/dev/smartem
uvx smartem-workspace init --path ~/dev/smartem

# Create in specific project directory
uvx smartem-workspace init --path /projects/cryo-em/smartem
```

**Default**: Current directory (`.`)

**Behaviour**:
- Creates directory if it doesn't exist
- Fails if directory exists and is not empty (safety measure)
- Creates `repos/`, `claude-config/`, `tmp/`, `testdata/` subdirectories

### --preset: Skip Repository Selection

Use a predefined preset instead of interactive selection:

```bash
# Core development repositories
uvx smartem-workspace init --preset smartem-core

# Complete ecosystem
uvx smartem-workspace init --preset full

# Minimal setup
uvx smartem-workspace init --preset minimal

# ARIA reference
uvx smartem-workspace init --preset aria-reference
```

**Default**: None (interactive selection)

**Behaviour**:
- Skips repository selection prompts
- Shows summary of what will be cloned
- Still prompts for confirmation unless `--no-interactive` is used

### --no-interactive: Fully Automated Mode

Skip all prompts for scripted/automated setups:

```bash
# Completely non-interactive
uvx smartem-workspace init --preset smartem-core --no-interactive
```

**Requirements**:
- Must specify `--preset` (no default)
- Uses defaults for all other options
- Fails immediately on any error

**Use Cases**:
- CI/CD pipelines
- Docker image builds
- Automated testing environments
- Team onboarding scripts

### --ssh: Use SSH URLs for Git

Clone repositories using SSH instead of HTTPS:

```bash
uvx smartem-workspace init --preset smartem-core --ssh
```

**Default**: HTTPS

**When to use SSH**:
- You have SSH keys configured with GitHub
- You need write access to repositories
- Your network blocks HTTPS Git traffic
- You prefer SSH authentication

**Requirements**:
- SSH key added to GitHub account
- SSH agent running with key loaded
- Network allows SSH (port 22) to github.com

**URL Examples**:
- HTTPS: `https://github.com/DiamondLightSource/smartem-decisions.git`
- SSH: `git@github.com:DiamondLightSource/smartem-decisions.git`

### --skip-claude: Skip Claude Code Setup

Don't configure Claude Code:

```bash
uvx smartem-workspace init --preset smartem-core --skip-claude
```

**Use Cases**:
- You don't use Claude Code
- You want to configure Claude Code manually
- Testing workspace setup without AI tools

**What gets skipped**:
- `.claude/` directory creation
- Skills symlinking
- Settings and permissions configuration
- CLAUDE.md creation

### --skip-serena: Skip Serena MCP Setup

Don't configure Serena MCP server:

```bash
uvx smartem-workspace init --preset smartem-core --skip-serena
```

**Use Cases**:
- You don't use Serena for code navigation
- You prefer other code navigation tools
- Minimal setup for resource-constrained environments

**What gets skipped**:
- Serena MCP server configuration
- Symbol index setup

## Interactive Walkthrough

When you run `smartem-workspace init` without `--no-interactive`, you'll go through this flow:

### Step 1: Preset or Custom Selection

```
? Select a preset or choose custom:
  ○ minimal - Just smartem-devtools (13 MB, 1 repo)
  ○ smartem-core - Core development repos (31 MB, 3 repos)
  ○ aria-reference - ARIA ecosystem (100 MB, 20+ repos)
  ○ full - Complete ecosystem (150 MB, 30+ repos)
  ● custom - Select repositories manually
```

**Preset**: Proceed to confirmation  
**Custom**: Continue to repository selection

### Step 2: Repository Selection (Custom Only)

```
? Select repositories to clone:
  
  DiamondLightSource
  ☑ smartem-devtools - Developer tooling and documentation
  ☑ smartem-decisions - Backend (FastAPI, PostgreSQL, RabbitMQ)
  ☑ smartem-frontend - Web UI (React, TanStack Router)
  ☐ cryoem-services - Data processing pipelines
  
  FragmentScreen
  ☐ fandanGO-core - Plugin framework foundation
  ☐ fandanGO-aria - ARIA integration
  ☐ fandanGO-cryoem-dls - DLS facility plugin
  
  [Space to toggle, Enter to continue]
```

### Step 3: Target Directory Confirmation

```
? Create workspace in: /home/user/dev/smartem
  
  This will create:
  - repos/DiamondLightSource/
  - repos/FragmentScreen/
  - claude-config/
  - tmp/
  - testdata/
  - CLAUDE.md
  
? Continue? (Y/n)
```

### Step 4: Cloning Progress

```
Cloning repositories...

✓ DiamondLightSource/smartem-devtools [1/3]
  → repos/DiamondLightSource/smartem-devtools
  
⣾ DiamondLightSource/smartem-decisions [2/3]
  Cloning... 50%
```

### Step 5: Configuration Setup

```
Setting up Claude Code...
✓ Created .claude/ directory
✓ Linked 7 skills
✓ Configured settings and permissions
✓ Created CLAUDE.md

Setting up Serena MCP...
✓ Configured Serena server
✓ Indexed repositories
```

### Step 6: Completion Summary

```
✓ Workspace setup complete!

Summary:
  Repositories cloned: 3
  Total size: 31 MB
  Location: /home/user/dev/smartem

Next steps:
  1. cd /home/user/dev/smartem
  2. Review CLAUDE.md for workspace overview
  3. See docs/how-to/ for development guides

Happy coding!
```

## What Gets Set Up

### Repository Structure

After running `smartem-workspace init`, your workspace will have this structure:

```
/home/user/dev/smartem/
├── repos/                          # All repository clones
│   ├── DiamondLightSource/         # DLS GitHub organisation
│   │   ├── smartem-devtools/       # Developer tooling
│   │   ├── smartem-decisions/      # Backend
│   │   └── smartem-frontend/       # Web UI
│   ├── FragmentScreen/             # FragmentScreen GitHub organisation
│   │   ├── fandanGO-core/          # Plugin framework
│   │   └── fandanGO-aria/          # ARIA integration
│   └── GitlabAriaPHP/              # ARIA PHP ecosystem (GitLab)
│       ├── data-deposition-api/    # ARIA GraphQL API
│       └── aria-graphql-client/    # PHP client library
├── claude-config/                  # Claude Code configuration
│   ├── shared/                     # Cross-repo config
│   │   └── skills/                 # Shared skills
│   ├── smartem-decisions/          # Repo-specific config
│   │   ├── agents/                 # Custom agents
│   │   └── REPO-GUIDELINES.md      # Development standards
│   └── ARCHITECTURE.md             # System architecture
├── .claude/                        # Claude Code runtime
│   ├── skills/                     # Symlinked skills
│   ├── settings.json               # IDE settings
│   └── permissions.json            # Security permissions
├── tmp/                            # Scratchpad directory
│   ├── logs/                       # Application logs
│   └── simulations/                # Test data outputs
├── testdata/                       # Test datasets (not in git)
│   └── epu-output/                 # Sample EPU output
├── CLAUDE.md                       # Workspace overview for AI
└── README.md                       # Getting started guide
```

### Claude Code Configuration

The tool sets up Claude Code with:

#### Skills (7 total)
- **database-admin** - PostgreSQL and Alembic migrations
- **devops** - Kubernetes, Docker, CI/CD
- **technical-writer** - Documentation and ADRs
- **git** - Git operations and workflows
- **github** - GitHub PRs, issues, workflows
- **ascii-art** - Diagram generation
- **playwright-skill** - Browser automation testing

#### Settings
- Python type checking enabled
- Line length: 120 characters
- British English for documentation
- No emojis in code (Windows compatibility)

#### Permissions
- Read access to all repository files
- Write access to appropriate directories
- Execute access for development scripts

### Serena MCP Server

Enables semantic code navigation:
- Symbol search across all repositories
- Find references and definitions
- Jump to implementation
- Documentation lookup

### Workspace Files

#### CLAUDE.md

AI-readable workspace overview containing:
- Repository structure and ownership
- Vocabulary and terminology
- Code navigation guide
- Development conventions
- Architecture overview

#### tmp/

Scratchpad directory for:
- E2E simulation outputs
- EPU output directories
- Application logs
- Volume mounts for containers
- Temporary build artifacts

#### testdata/

Test datasets for development:
- EPU output samples
- Microscope session data
- Reference images
- Not version controlled (read-only reference)

## Post-Setup Steps

After workspace initialization completes:

### 1. Navigate to Workspace

```bash
cd /path/to/workspace
```

### 2. Verify Repository Clones

```bash
ls -la repos/DiamondLightSource/
# Should show: smartem-devtools, smartem-decisions, smartem-frontend (for smartem-core preset)
```

### 3. Check Git Status

```bash
cd repos/DiamondLightSource/smartem-decisions
git status
git branch
```

All repositories are cloned on the `main` branch by default.

### 4. Review Workspace Overview

```bash
cat CLAUDE.md
```

Read this file to understand:
- What each repository does
- Ownership and edit permissions
- Development workflows
- Architecture and dependencies

### 5. Explore Documentation

Documentation is in `repos/DiamondLightSource/smartem-devtools/docs/`:

```bash
cd repos/DiamondLightSource/smartem-devtools
ls docs/how-to/
```

Key guides:
- `run-backend.md` - Running the SmartEM backend
- `run-e2e-dev-simulation.md` - End-to-end testing
- `database-migrations.md` - Database schema changes
- `deploy-kubernetes.md` - Kubernetes deployment

### 6. Set Up Development Environment

For smartem-decisions (backend):

```bash
cd repos/DiamondLightSource/smartem-decisions
uv sync --all-extras
source .venv/bin/activate
./tools/k8s/dev-k8s.sh up  # Starts PostgreSQL, RabbitMQ
```

For smartem-frontend:

```bash
cd repos/DiamondLightSource/smartem-frontend
npm install
npm run dev
```

### 7. Verify Claude Code Setup

If using Claude Code:

```bash
ls -la .claude/skills/
# Should show symlinks to all 7 skills
```

Test Claude Code can access skills and repository context.

### 8. Run Tests

Verify repositories are working:

```bash
# Backend tests
cd repos/DiamondLightSource/smartem-decisions
uv run pytest

# Frontend tests
cd repos/DiamondLightSource/smartem-frontend
npm test
```

## Advanced Usage

### Adding Repositories After Init

To add a single repository to an existing workspace:

```bash
smartem-workspace add DiamondLightSource/cryoem-services
```

This clones the repository into the appropriate organisation directory.

### Removing Repositories

Simply delete the directory:

```bash
rm -rf repos/DiamondLightSource/cryoem-services
```

The tool doesn't manage repository removal (standard `rm` is safer).

### Syncing Existing Repositories

Pull latest changes for all repositories:

```bash
smartem-workspace sync
```

This runs `git pull` on each repository. Uncommitted changes are preserved.

### Checking Workspace Status

See git status for all repositories:

```bash
smartem-workspace status
```

Shows:
- Current branch
- Uncommitted changes
- Commits ahead/behind remote

### Custom Presets

Currently, custom presets are defined in the package configuration. To request a new preset, open an issue at:

https://github.com/DiamondLightSource/smartem-devtools/issues

Future versions may support user-defined preset files.

### Integration with Existing Workflows

#### Docker Containers

Mount the workspace as a volume:

```bash
docker run -v ~/dev/smartem:/workspace -w /workspace python:3.12
```

#### VS Code Workspaces

Create a multi-root workspace file (`.code-workspace`) to open all repositories:

```json
{
  "folders": [
    { "path": "repos/DiamondLightSource/smartem-decisions" },
    { "path": "repos/DiamondLightSource/smartem-frontend" },
    { "path": "repos/DiamondLightSource/smartem-devtools" }
  ]
}
```

#### CI/CD Pipelines

Use `--no-interactive` for automated environments:

```yaml
- name: Setup SmartEM workspace
  run: uvx smartem-workspace init --preset smartem-core --no-interactive --path /workspace
```

## Troubleshooting

### Common Errors

#### "Directory not empty"

**Error:**
```
Error: Target directory /home/user/dev/smartem is not empty
```

**Cause**: Safety check prevents overwriting existing files

**Solutions**:
1. Use a different directory: `--path ~/dev/smartem-new`
2. Remove existing directory: `rm -rf ~/dev/smartem`
3. Use existing workspace: `cd ~/dev/smartem && smartem-workspace sync`

#### "Repository already exists"

**Error:**
```
Error: Repository repos/DiamondLightSource/smartem-decisions already exists
```

**Cause**: Partial previous setup or manual clone

**Solutions**:
1. Remove existing repository: `rm -rf repos/DiamondLightSource/smartem-decisions`
2. Skip this repository in custom selection
3. Use a fresh directory

#### "Git clone failed: authentication required"

**Error:**
```
Error: Could not clone DiamondLightSource/smartem-decisions
Permission denied (publickey)
```

**Cause**: Trying to use SSH without configured keys, or private repository without credentials

**Solutions**:
1. Use HTTPS instead: Remove `--ssh` flag
2. Configure SSH keys:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ssh-add ~/.ssh/id_ed25519
   # Add key to GitHub: Settings → SSH and GPG keys
   ```
3. Configure Git credentials for HTTPS:
   ```bash
   git config --global credential.helper store
   # Next git operation will prompt for credentials
   ```

#### "Network error: Failed to fetch configuration"

**Error:**
```
Error: Failed to fetch repository configuration from GitHub
Falling back to bundled configuration
```

**Cause**: Network issues or GitHub API rate limit

**Impact**: Tool uses bundled configuration instead (may be slightly outdated)

**Solutions**:
1. Check internet connection
2. Wait for GitHub API rate limit reset (1 hour)
3. Configure GitHub token to increase rate limit:
   ```bash
   export GITHUB_TOKEN=ghp_your_token_here
   ```
4. Continue with bundled config (usually fine)

#### "Symlink creation failed"

**Error:**
```
Error: Failed to create symlink .claude/skills/database-admin
```

**Cause**: Windows without developer mode, or permission issues

**Solutions**:
1. **Windows**: Enable Developer Mode (Settings → Update & Security → For developers)
2. **Windows**: Run as Administrator
3. **Linux/macOS**: Check directory permissions
4. Skip Claude Code setup: `--skip-claude`

### Performance Issues

#### Slow Cloning

**Symptoms**: Repository cloning takes very long

**Causes**:
- Large repository size
- Slow network connection
- GitHub rate limiting

**Solutions**:
1. Use wired connection instead of Wi-Fi
2. Choose smaller preset (`minimal` or `smartem-core` instead of `full`)
3. Clone repositories incrementally with `smartem-workspace add`
4. Check network speed: `curl -o /dev/null https://github.com/DiamondLightSource/smartem-devtools/archive/refs/heads/main.zip`

#### Disk Space

**Symptoms**: Setup fails partway through

**Cause**: Insufficient disk space

**Solutions**:
1. Check available space: `df -h`
2. Free up space or use different partition
3. Use smaller preset
4. Use shallow clones (future feature)

### Permission Issues

#### Cannot Write to Directory

**Error:**
```
Error: Permission denied: '/opt/smartem'
```

**Solutions**:
1. Use directory in your home folder: `--path ~/dev/smartem`
2. Change directory ownership: `sudo chown -R $USER /opt/smartem`
3. Use sudo (not recommended): `sudo uvx smartem-workspace init`

#### Git Permission Denied

**Error:**
```
Permission denied (publickey)
```

See "Git clone failed: authentication required" above.

### Configuration Issues

#### Skills Not Found

**Symptoms**: Claude Code can't find skills

**Diagnosis**:
```bash
ls -la .claude/skills/
# Check if symlinks are broken (red in ls output)
```

**Solutions**:
1. Re-run setup: `uvx smartem-workspace init --preset smartem-core`
2. Manually fix symlinks:
   ```bash
   cd .claude/skills
   ln -sf ../../claude-config/shared/skills/database-admin database-admin
   ```

#### Serena MCP Not Working

**Symptoms**: Symbol search doesn't work

**Solutions**:
1. Check Serena configuration exists
2. Re-index repositories (Serena documentation)
3. Verify MCP server is running

## Getting Help

### Documentation

- **SmartEM Devtools**: https://diamondlightsource.github.io/smartem-devtools/
- **API Documentation**: https://diamondlightsource.github.io/smartem-devtools/reference/
- **How-to Guides**: `repos/DiamondLightSource/smartem-devtools/docs/how-to/`

### Community

- **GitHub Issues**: https://github.com/DiamondLightSource/smartem-devtools/issues
- **Discussions**: https://github.com/DiamondLightSource/smartem-devtools/discussions

### Contact

- **Email**: smartem@diamond.ac.uk
- **Bug Reports**: https://github.com/DiamondLightSource/smartem-devtools/issues/new

## Next Steps

After setting up your workspace:

1. **Read CLAUDE.md** for workspace overview and conventions
2. **Explore docs/how-to/** for development guides
3. **Run the backend** with `./tools/k8s/dev-k8s.sh up`
4. **Run the frontend** with `npm run dev`
5. **Run tests** to verify everything works
6. **Join discussions** on GitHub for questions

For contributing to SmartEM:

1. Read `.github/CONTRIBUTING.md` in smartem-devtools
2. Review `claude-config/smartem-decisions/REPO-GUIDELINES.md` for code standards
3. Check open issues for good first contributions
4. Set up pre-commit hooks with Lefthook

Happy developing!
