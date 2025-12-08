# Claude Code Configuration

Centralized Claude Code configuration for the ERIC workspace. This aggregates Claude-specific config from individual repos so Claude can operate across repos with consistent tooling.

## Structure

```
claude-config/
├── ARCHITECTURE.md            # System architecture, dependencies, data flow
├── shared/                    # Cross-repo skills and config
│   └── skills/
│       ├── database-admin/    # PostgreSQL, Alembic, schema management
│       ├── devops/            # K8s, containers, CI/CD
│       ├── technical-writer/  # Docs, ADRs, British English
│       ├── git/               # Commits, branches, rebasing
│       └── github/            # PRs, issues, project boards
├── smartem-decisions/         # smartem-decisions specific config
│   ├── agents/                # Legacy agents (reference only)
│   ├── settings.json          # Permissions and allowed commands
│   └── REPO-GUIDELINES.md     # Code standards and workflow
├── smartem-frontend/          # smartem-frontend specific config
│   └── skills/
│       └── playwright-skill/  # Browser automation skill
├── fandango-cryoem-dls/       # fandanGO-cryoem-dls specific config
└── README.md

ERIC/
├── .mcp.json                  # MCP server configuration (Serena)
└── .claude/
    └── skills/                # Symlinks to claude-config skills
```

## Skill Discovery

Claude Code only discovers skills from `.claude/skills/` directories. To keep skills in claude-config as source of truth while making them discoverable:

```
ERIC/.claude/skills/
├── database-admin -> ../../claude-config/shared/skills/database-admin
├── devops -> ../../claude-config/shared/skills/devops
├── technical-writer -> ../../claude-config/shared/skills/technical-writer
├── git -> ../../claude-config/shared/skills/git
├── github -> ../../claude-config/shared/skills/github
└── playwright-skill -> ../claude-config/smartem-frontend/skills/playwright-skill
```

**Pattern**: Store skills in `claude-config/shared/skills/` or `claude-config/<repo>/skills/`, symlink from `ERIC/.claude/skills/`.

## Usage

### When working on a specific repo

Reference the repo-specific subdirectory for:
- **Agents**: Specialized personas (database-admin, devops, technical-writer, etc.)
- **Skills**: Automation tools (playwright for frontend testing)
- **Guidelines**: Code standards, workflows, common commands

### When working across repos

Use `shared/` for cross-cutting concerns and workspace-level configuration.

## Source Mapping

| claude-config path | Original location |
|--------------------|-------------------|
| `smartem-decisions/agents/` | `DiamondLightSource/smartem-decisions/.claude/agents/` |
| `smartem-decisions/settings.json` | `DiamondLightSource/smartem-decisions/.claude/settings.json` |
| `smartem-decisions/REPO-GUIDELINES.md` | `DiamondLightSource/smartem-decisions/CLAUDE.md` |
| `smartem-frontend/skills/playwright-skill/` | `DiamondLightSource/smartem-frontend/.claude/skills/playwright-skill/` |

## Available Skills

### Shared Skills (cross-repo)

| Skill | Purpose |
|-------|---------|
| **database-admin** | PostgreSQL, Alembic migrations, schema validation, psql queries |
| **devops** | Kubernetes, containers, CI/CD workflows, GitHub Actions debugging |
| **technical-writer** | Documentation, ADRs, British English standards, Markdown |
| **git** | Commits, branches, rebasing, history management |
| **github** | PRs, issues, project boards, releases, CI/CD debugging |

### Frontend Skills

| Skill | Purpose |
|-------|---------|
| **playwright-skill** | Browser automation, testing, screenshots, form validation |

### Legacy Agents (reference only)

The `smartem-decisions/agents/` directory contains legacy agent definitions. Their actionable content has been migrated to skills; the files remain for reference.

## MCP Servers

MCP (Model Context Protocol) servers extend Claude Code with additional capabilities.

### Serena - Semantic Code Navigation

[Serena](https://github.com/oraios/serena) provides LSP-powered semantic code navigation. Unlike text-based search, it understands code at a symbol level - functions, classes, references.

**Configuration**: Stored in `ERIC/.mcp.json` (project-level, shareable):
```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/oraios/serena", "serena", "start-mcp-server", "--context", "ide-assistant", "--project", "${PWD}"]
    }
  }
}
```

**Setup** (one-time):
```bash
# Requires uv: https://docs.astral.sh/uv/getting-started/installation/
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project "$(pwd)"

# Index project for optimal performance (recommended for large codebases)
uvx --from git+https://github.com/oraios/serena index-project .
```

**Key tools provided**:
- `find_symbol` - Locate symbols (functions, classes, variables)
- `find_referencing_symbols` - Find where a symbol is used
- `get_symbol_documentation` - Retrieve docstrings/comments
- `insert_after_symbol` - Add code after a specific symbol

**Note**: Uses `--context ide-assistant` to avoid duplicating Claude Code's built-in file operations.

## Architecture Documentation

See [ARCHITECTURE.md](ARCHITECTURE.md) for:
- System boundary diagram (what's in scope vs needs mocking)
- Data flow between components
- smartem-decisions internal package structure
- API client generation requirements
- Mocking requirements for E2E testing
- Dependency chains (what breaks when something changes)
- CI/CD overview
