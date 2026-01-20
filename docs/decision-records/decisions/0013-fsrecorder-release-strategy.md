# 13. FSRecorder Release Strategy

Date: 2026-01-20

## Status

Accepted

## Context

FSRecorder is a filesystem recording and replay tool used for development and testing of the SmartEM system. It records filesystem changes (file creations, modifications, deletions) and can replay them with configurable timing - essential for testing components that react to filesystem events without requiring real microscope sessions.

The tool serves two distinct audiences with different requirements:

1. **Windows users** (EPU workstation operators, facility staff): Need a standalone executable that can run without Python installation. These users operate microscope workstations and need to record EPU filesystem activity.

2. **Python developers** (SmartEM contributors, CI/CD pipelines): Need a pip-installable package for integration into development workflows, testing pipelines, and programmatic usage.

Previously, FSRecorder existed as a single script in `tools/fsrecorder/` with a manual build process for Windows executables. This created challenges:

- No permanent URLs for Windows releases (artifacts expired)
- No PyPI package for pip installation
- No automated release process
- No version tracking
- Monorepo structure required path-based change detection for releases

## Decision

We will implement a dual-distribution release strategy for FSRecorder:

### Package Location

Move FSRecorder from `tools/fsrecorder/` to `packages/smartem-fsrecorder/` as a proper Python package with:
- `pyproject.toml` using hatchling build backend
- Modular code structure (models, recorder, replayer, cli)
- Entry point: `fsrecorder` command
- Package name: `smartem-fsrecorder`

### Version Strategy

- Use semantic versioning starting at v1.0.0
- Tag format: `fsrecorder-v*` (e.g., `fsrecorder-v1.0.0`)
- RC releases: `{version}rc{run_number}` (e.g., `1.0.0rc42`)

### Release Triggers

| Event | Condition | Result |
|-------|-----------|--------|
| Tag `fsrecorder-v*` | Always | Stable release to GitHub + PyPI |
| Push to main | `packages/smartem-fsrecorder/**` changed | RC pre-release to GitHub only |
| Pull request | `packages/smartem-fsrecorder/**` changed | Build + test only |

### Distribution Channels

1. **GitHub Releases** (both stable and RC):
   - Windows executable: `fsrecorder-windows-vX.Y.Z.exe`
   - Python wheel: `smartem_fsrecorder-X.Y.Z-py3-none-any.whl`
   - Source distribution: `smartem_fsrecorder-X.Y.Z.tar.gz`
   - Permanent URLs, never expire

2. **PyPI** (stable releases only):
   - Package: `smartem-fsrecorder`
   - Uses Trusted Publishers (OIDC) for secure publishing
   - RC releases excluded to keep PyPI clean

### Release Notes

Hybrid approach for monorepo context:
1. Query PRs with `component:fsrecorder` label merged since last tag
2. Fallback to git log with path filter for any missed commits
3. Auto-labeling via `pr-admin.yml` workflow using `labeler.yml`

### Build Process

- Windows exe: PyInstaller with watchdog hidden imports
- Python package: hatchling via uv build
- Smoke tests: CLI help, record, info, and replay commands

## Consequences

### Positive

- **Permanent URLs**: Windows users can always download specific versions
- **PyPI discoverability**: Python developers can `pip install smartem-fsrecorder`
- **Clean separation**: Package structure supports future growth
- **Automated releases**: No manual steps required
- **RC testing**: Changes merged to main are automatically released as RCs for testing
- **Monorepo-aware**: Only triggers when package files change

### Negative

- **Setup required**: Need to configure PyPI Trusted Publishers
- **Project token**: PR automation needs `PROJECT_TOKEN` secret for project board access
- **Breaking change**: Old `tools/fsrecorder/` path no longer exists

### Neutral

- Old Windows artifacts will remain in GitHub Actions (90-day retention)
- Existing recordings remain compatible (format unchanged)
