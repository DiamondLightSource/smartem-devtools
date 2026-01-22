# 14. SmartEM Package Release Architecture

Date: 2026-01-21

## Status

Accepted

## Context

The smartem-decisions monorepo contains multiple Python packages that serve different deployment scenarios:

1. **smartem-agent**: Runs on Windows EPU workstations near microscopes, requires standalone executable distribution
2. **smartem-backend**: Runs in Kubernetes containers, currently built from source in Dockerfile
3. **smartem-common**: Shared schemas and utilities used by both agent and backend

The packages have a clean dependency hierarchy (established in ADR-7):

```
smartem_common (shared schemas, enums)
       |
       +-- smartem_agent (filesystem watcher, SSE client)
       |         |
       |         +-- smartem_backend.api_client (communication bridge)
       |
       +-- smartem_backend (FastAPI, DB, RabbitMQ, workers)
```

Previous challenges:
- Windows agent builds produced artifacts with 90-day retention (no permanent URLs)
- No PyPI package for pip installation
- Container builds required full source checkout
- No coordinated versioning between components

The EPUPlayer package (ADR-13) established a precedent for dual-distribution (PyPI + Windows exe) with component-specific tags in a monorepo.

## Decision

We will implement a single-package release strategy with component extras:

### Package Structure

Publish `smartem-decisions` to PyPI with optional dependency groups:

| Extra | Contents | Use Case |
|-------|----------|----------|
| `[common]` | Pydantic schemas, enums, utils | Shared dependency |
| `[client]` | API client (httpx, sseclient-py) | Agent communication layer |
| `[agent]` | Agent + common + client + watchdog | Windows workstations |
| `[backend]` | Backend + common + FastAPI + SQLAlchemy | k8s containers |
| `[all]` | Everything | Development |

### Version Strategy

- **Package version**: Derived from git tags using setuptools_scm
- **Releases**: Tagged with `smartem-decisions-v*` format (unified for all components)
- **Shared versioning**: All components share the same version for API compatibility

### Release Triggers

| Event | Condition | Result |
|-------|-----------|--------|
| Tag `smartem-decisions-v*` | Always | Stable release to GitHub + PyPI |
| Push to main | Agent paths changed | RC pre-release to GitHub only |
| Pull request | Agent paths changed | Build + test validation only |

Agent paths include:
- `src/smartem_agent/**`
- `src/smartem_common/**`
- `src/smartem_backend/api_client.py`

### Distribution Channels

1. **GitHub Releases** (stable and RC):
   - Windows executable: `smartem-agent-windows-vX.Y.Z.exe`
   - Python wheel: `smartem_decisions-X.Y.Z-py3-none-any.whl`
   - Permanent URLs, never expire

2. **PyPI** (stable releases only):
   - Package: `smartem-decisions`
   - Uses Trusted Publishers (OIDC) for secure publishing

### Installation Commands

```bash
# Agent on any OS (development/testing) - with uv (recommended)
uv pip install smartem-decisions[agent]
smartem-agent watch /path/to/epu --api-url http://backend:8000

# Agent on any OS (development/testing) - with pip
pip install smartem-decisions[agent]
smartem-agent watch /path/to/epu --api-url http://backend:8000

# Windows workstation (production)
# Download smartem-agent-windows-vX.Y.Z.exe from GitHub Releases

# Backend container (future)
pip install smartem-decisions[backend]

# Run without installation (using uvx)
uvx --with smartem-decisions[agent] smartem-agent --help
```

### CI Tooling

The release workflows adopt [uv](https://docs.astral.sh/uv/) for Python package management in CI, aligning with the ecosystem-wide uv adoption plan (smartem-devtools#15):

- **Linux jobs**: Use `astral-sh/setup-uv@v7` action with `uv sync` and `uv run`
- **Windows exe build**: Uses pip for PyInstaller compatibility (PyInstaller works best with pip-installed packages)
- **Package build**: Uses `uv build` and `uvx twine check`
- **Version detection**: Uses `uvx --with setuptools_scm` for zero-install version extraction

Benefits:
- 10-100x faster dependency installation in CI
- Consistent with EPUPlayer workflow patterns
- Leverages uv.lock for reproducible builds

### Cleanup

As part of this decision, we remove the deprecated `athena_api` package:
- Delete `src/athena_api/` directory
- Remove from pyproject.toml packages list
- Remove `mock` optional dependency group

The entry point is renamed from `smartem_agent_tools` to `smartem-agent` for consistency.

## Consequences

### Positive

- **Shared versioning**: Agent and backend always have compatible schemas
- **Permanent URLs**: Windows users can always download specific versions
- **PyPI discoverability**: Python developers can `pip install smartem-decisions[agent]`
- **Simplified containers**: Future Dockerfiles can use `pip install smartem-decisions[backend]`
- **Clean codebase**: Deprecated athena_api mock removed
- **Follows EPUPlayer precedent**: Consistent release patterns across SmartEM ecosystem
- **Fast CI**: uv adoption provides 10-100x faster dependency installation

### Negative

- **PyPI setup required**: Need to configure Trusted Publishers for the package
- **Breaking change**: Entry point renamed from `smartem_agent_tools` to `smartem-agent`
- **Complexity**: Two workflows for the same package (validation + release)

### Neutral

- Backend PyPI publishing deferred to future work (tracked in GitHub issue)
- Old Windows artifacts remain in GitHub Actions (90-day retention) until RC releases replace them
