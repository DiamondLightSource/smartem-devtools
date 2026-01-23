# How to Sync GitHub Labels

This guide explains how to manage GitHub labels across SmartEM repositories using the label sync tool.

## Overview

The SmartEM ecosystem uses a standardised set of GitHub labels across four repositories:

- `DiamondLightSource/smartem-decisions`
- `DiamondLightSource/smartem-frontend`
- `DiamondLightSource/smartem-devtools`
- `DiamondLightSource/fandanGO-cryoem-dls`

Labels are defined in `core/github-labels-config.ts` and synced using `scripts/github/sync-labels.ts`.

## Prerequisites

- Node.js 18+
- Authentication via one of:
  - GitHub CLI (`gh`) installed and authenticated (`gh auth login`)
  - `GITHUB_TOKEN` environment variable with repo scope
- For sync operations: write access to target repositories

## Label Categories

### Types of Work

Labels that categorise the nature of work being done:

| Label | Colour | Purpose |
|-------|--------|---------|
| documentation | teal | Improvements or additions to project documentation |
| testing | green | Writing, updating, or fixing automated tests |
| bugfixing | red | Fixing defects or unexpected behavior |
| development | purple | New features or functionality implementation |
| refactoring | orange | Code restructuring without changing behavior |
| research | cyan | Investigation, spikes, or proof-of-concept work |
| devops | slate | CI/CD, deployment, infrastructure, or tooling |
| security | maroon | Security fixes, audits, or vulnerability remediation |
| admin | brown | Project maintenance, dependency updates |
| enhancement | dark cyan | Minor improvements to existing functionality |

### System Components

Labels that identify which part of the system is affected:

| Label | Colour Family | Purpose |
|-------|---------------|---------|
| smartem-backend | Blue (dark) | Core backend services |
| smartem-backend:db | Blue (mid) | Database and data layer |
| smartem-backend:api | Blue (light) | REST API endpoints |
| smartem-agent | Gold | EPU workstation agent |
| smartem-frontend | Green | User-facing web UI |
| smartem-aria-connector | Purple | ARIA/FandanGO integration |
| smartem-devtools | Pink (dark) | Developer tooling |
| smartem-devtools:webui | Pink (mid) | Developer dashboard |
| smartem-devtools:claude | Pink (light) | Claude Code configuration |
| smartem-devtools:e2e-test | Pink (lightest) | E2E testing infrastructure |

### Per-Repository Configuration

Not all repos need all labels. The config defines which label sets each repo receives:

| Mode | Labels Applied | Use Case |
|------|----------------|----------|
| `all` | Types of work + system components | Index repo (smartem-devtools) |
| `types-only` | Types of work only | Individual repos |

Current assignments in `core/github-labels-config.ts`:

| Repository | Mode |
|------------|------|
| smartem-devtools | `all` |
| smartem-decisions | `types-only` |
| smartem-frontend | `types-only` |
| fandanGO-cryoem-dls | `types-only` |

System component labels are only relevant in the devtools index repo where cross-repo issues are tracked.

## Usage

### Check Label Conformity

To check if all repositories have the correct labels without making changes:

```bash
npm run labels:check
```

Or directly:

```bash
npx tsx scripts/github/sync-labels.ts --check
```

This will:
1. Fetch existing labels from each repository
2. Compare against the defined labels in `core/github-labels-config.ts`
3. Report any discrepancies (missing, extra, or outdated labels)
4. Exit with code 1 if any repository is non-conforming

### Sync Labels

To synchronise labels across all repositories:

```bash
npm run labels:sync
```

Or directly:

```bash
npx tsx scripts/github/sync-labels.ts --sync
```

This will:
1. Delete labels not in the definition (extra labels)
2. Create labels that are missing
3. Update labels where description or colour has changed

### Target Specific Repositories

To sync only specific repositories:

```bash
npx tsx scripts/github/sync-labels.ts --sync --repo smartem-decisions
npx tsx scripts/github/sync-labels.ts --sync --repo smartem-frontend --repo smartem-devtools
```

### Verbose Output

For detailed output including conforming labels:

```bash
npx tsx scripts/github/sync-labels.ts --check --verbose
```

## CI/CD Integration

The `gitflow.yml` workflow automates label management:

- **On push to main**: Runs `--check` mode when `core/github-labels-config.ts` or `scripts/github/**` changes
- **Manual dispatch**: Can trigger `--sync` mode via GitHub Actions UI

### Running Sync via CI/CD

1. Go to Actions tab in smartem-devtools repository
2. Select "Gitflow" workflow
3. Click "Run workflow"
4. Select `sync` mode
5. Click "Run workflow"

## Modifying Labels

To add, remove, or modify labels:

1. Edit `core/github-labels-config.ts`
2. Run `npm run labels:check` to verify changes
3. Run `npm run labels:sync` to apply changes
4. Commit and push changes

The CI/CD workflow will verify conformity on push.

## Authentication Backends

The sync script supports two authentication backends with automatic fallback:

### Primary: GitHub CLI

The preferred method uses `gh` CLI for shell-based operations:

```bash
gh auth login
gh auth status  # verify authentication
```

### Fallback: GitHub REST API

If `gh` CLI is unavailable or not authenticated, the script falls back to the GitHub REST API using a personal access token:

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

Generate a token at https://github.com/settings/tokens with `repo` scope.

The script automatically selects the best available backend and displays which one is in use:

```
GitHub Labels Sync
Mode: check
Repos: smartem-devtools, smartem-decisions, smartem-frontend, fandanGO-cryoem-dls
Backend: gh CLI
```

## Troubleshooting

### Authentication Errors

Ensure `gh` CLI is authenticated:

```bash
gh auth status
gh auth login  # if not authenticated
```

Or set `GITHUB_TOKEN` environment variable as fallback.

### Permission Denied

For sync operations, you need write access to all target repositories. The CI/CD workflow uses a PAT stored as `LABEL_SYNC_TOKEN` secret.

### Label Already Exists

If a label creation fails because it already exists, the script will continue. Run with `--verbose` to see details.
