# Release Procedure

How to release the three packages in the SmartEM ecosystem. All releases are tag-driven via GitHub Actions.

## Release types

| Type | Trigger | Purpose |
|------|---------|---------|
| **RC (Release Candidate)** | Automatic on push to `main` (when path filters match) | Pre-release for testing |
| **Stable** | Push a version tag | Production release |
| **Manual** | `workflow_dispatch` with `rc` or `stable` choice | Emergency or ad-hoc releases |

## General flow

1. Develop on a feature branch
2. Merge PR to `main`
3. CI automatically creates an RC release (if path filters match and no stable tag exists for the current version)
4. When ready for stable: push a version tag
5. CI runs tests, builds artifacts, publishes to PyPI/GHCR, and creates a GitHub Release

## smartem-decisions

**Repository:** [DiamondLightSource/smartem-decisions](https://github.com/DiamondLightSource/smartem-decisions)
**Workflow:** `release-smartem-decisions.yml`
**Versioning:** `setuptools_scm` (version derived from git tags automatically)
**Tag prefix:** `smartem-decisions-v`

### Path filters

The workflow triggers on changes to:
- `src/smartem_agent/**`
- `src/smartem_common/**`
- `src/smartem_backend/api_client.py`

### Artifacts produced

- Python wheel (PyPI, stable only)
- Windows executable (`smartem-agent-windows-v{VERSION}.exe`)
- Docker container image (GHCR, stable only)
- GitHub Release with all artifacts

### Releasing a stable version

```bash
# Version is determined by setuptools_scm from the tag
git tag smartem-decisions-v1.2.0
git push origin smartem-decisions-v1.2.0
```

CI will:
1. Run tests on Linux and Windows
2. Lint with ruff and pyright
3. Build Python wheel and Windows exe
4. Smoke test the Windows exe
5. Publish wheel to PyPI (trusted publishing via OIDC)
6. Build and push Docker image to GHCR (`ghcr.io/DiamondLightSource/smartem-decisions:{VERSION}`)
7. Create a GitHub Release with release notes, wheel, and exe attached

## smartem-epuplayer

**Repository:** [DiamondLightSource/smartem-devtools](https://github.com/DiamondLightSource/smartem-devtools)
**Workflow:** `release-smartem-epuplayer.yml`
**Versioning:** Manual — set in both `pyproject.toml` and `smartem_epuplayer/__init__.py` (must match)
**Tag prefix:** `epuplayer-v`
**Package directory:** `packages/smartem-epuplayer/`

### Path filters

The workflow triggers on changes to:
- `packages/smartem-epuplayer/**`

### Artifacts produced

- Python wheel (PyPI, stable only)
- Windows executable (`epuplayer-windows-v{VERSION}.exe`)
- GitHub Release with all artifacts

### Bumping the version

Before tagging, update the version in both places:

```python
# packages/smartem-epuplayer/pyproject.toml
version = "0.3.0"

# packages/smartem-epuplayer/smartem_epuplayer/__init__.py
__version__ = "0.3.0"
```

The CI will fail if these don't match.

### Releasing a stable version

```bash
git tag epuplayer-v0.3.0
git push origin epuplayer-v0.3.0
```

## smartem-workspace

**Repository:** [DiamondLightSource/smartem-devtools](https://github.com/DiamondLightSource/smartem-devtools)
**Workflow:** `release-smartem-workspace.yml`
**Versioning:** Manual — set in both `pyproject.toml` and `smartem_workspace/__init__.py` (must match)
**Tag prefix:** `smartem-workspace-v`
**Package directory:** `packages/smartem-workspace/`

### Path filters

The workflow triggers on changes to:
- `packages/smartem-workspace/**`

### Artifacts produced

- Python wheel (PyPI, stable only)
- GitHub Release

### Bumping the version

Same pattern as epuplayer — update both files:

```python
# packages/smartem-workspace/pyproject.toml
version = "0.4.0"

# packages/smartem-workspace/smartem_workspace/__init__.py
__version__ = "0.4.0"
```

### Releasing a stable version

```bash
git tag smartem-workspace-v0.4.0
git push origin smartem-workspace-v0.4.0
```

### uvx cache gotcha

`smartem-workspace` is commonly run via `uvx`. After publishing a new version, users may still get the old version due
to uvx caching. They need to either:

```bash
# Force refresh the cache
uvx --refresh smartem-workspace --help

# Or pin to latest explicitly
uvx smartem-workspace@latest --help
```

## Manual / emergency releases

All three workflows support `workflow_dispatch`. Go to the Actions tab of the relevant repository, select the release
workflow, click "Run workflow", and choose `rc` or `stable`.

This is useful when:
- An RC wasn't triggered automatically (e.g. path filters didn't match)
- You need to re-release after a CI fix
- You want a stable release without pushing a tag first

## Verifying a release

### GitHub Releases

Check the Releases page of the relevant repository. Both RC and stable releases appear there (RCs are marked as
pre-release).

### PyPI (stable only)

```bash
# smartem-decisions
pip install smartem-decisions==1.2.0

# smartem-epuplayer
pip install smartem-epuplayer==0.3.0

# smartem-workspace
pip install smartem-workspace==0.4.0
```

### Docker (smartem-decisions stable only)

```bash
docker pull ghcr.io/diamondlightsource/smartem-decisions:1.2.0
```

### Windows executable

Download from the GitHub Release assets and run:

```bash
smartem-agent-windows-v1.2.0.exe --help
epuplayer-windows-v0.3.0.exe --help
```

## First-time PyPI setup

If you're setting up PyPI publishing for the first time (new package or new repository), see
[PyPI Token Setup](publish-smartem-workspace-to-pypi.md) for account creation, token generation, and GitHub Secrets
configuration.
