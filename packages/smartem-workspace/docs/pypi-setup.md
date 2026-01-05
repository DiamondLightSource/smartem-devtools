# PyPI Token Setup for CI/CD

This guide explains how to set up PyPI and TestPyPI accounts and tokens for automated package publishing via GitHub Actions.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step 1: Create PyPI Accounts](#step-1-create-pypi-accounts)
- [Step 2: Generate API Tokens](#step-2-generate-api-tokens)
- [Step 3: Configure GitHub Secrets](#step-3-configure-github-secrets)
- [Step 4: First Manual Publish](#step-4-first-manual-publish-recommended)
- [Step 5: Update Token Scope](#step-5-update-token-scope-security-best-practice)
- [Token Security Best Practices](#token-security-best-practices)
- [Troubleshooting](#troubleshooting)
- [CI/CD Workflow Reference](#cicd-workflow-reference)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Emergency Procedures](#emergency-procedures)

## Overview

`smartem-workspace` uses GitHub Actions to automatically publish packages to PyPI and TestPyPI. This requires:

1. **PyPI account** - For production releases
2. **TestPyPI account** - For testing releases
3. **API tokens** - For authentication from GitHub Actions
4. **GitHub Secrets** - Secure storage of tokens

This guide walks through the complete setup process.

## Prerequisites

Before starting, ensure you have:

- **GitHub organisation admin access** - To add repository secrets
- **Team email access** - For PyPI account registration (e.g., smartem@diamond.ac.uk)
- **2FA app** - PyPI requires two-factor authentication (e.g., Google Authenticator, Authy)

## Step 1: Create PyPI Accounts

### Production PyPI Account

1. Visit https://pypi.org/account/register/

2. Fill in registration form:
   - **Username**: Choose organisational username (e.g., `diamondlightsource` or `smartem-team`)
   - **Email**: Use team email (smartem@diamond.ac.uk)
   - **Password**: Strong password (store in team password manager)

3. Verify email address:
   - Check team inbox for verification email
   - Click verification link

4. **Enable 2FA (Required for Publishing)**:
   - Go to Account Settings → Two-factor authentication
   - Scan QR code with authenticator app
   - Enter 6-digit code to verify
   - **Save recovery codes** in secure location (password manager)

### TestPyPI Account (Staging Environment)

1. Visit https://test.pypi.org/account/register/

2. Repeat registration process:
   - Use **same email** as production account
   - Use **different password** (or same via password manager)
   - **Important**: TestPyPI is a separate system - account doesn't sync with production

3. Verify email (separate verification email)

4. Enable 2FA (same process as production)

**Why TestPyPI?**
- Test package publishing before production
- Verify metadata, dependencies, installation
- Safe environment for CI/CD testing

## Step 2: Generate API Tokens

### Production PyPI Token

1. **Log in to PyPI**: https://pypi.org

2. **Navigate to API tokens**:
   - Click username (top right) → Account Settings
   - Scroll to "API tokens" section
   - Click "Add API token"

3. **Create token**:
   - **Token name**: `GitHub Actions - smartem-devtools`
   - **Scope**: 
     - For **first publish**: Select "Entire account (all projects)"
     - After first publish: Select "Project: smartem-workspace" (more secure - see Step 5)

4. **Copy token immediately**:
   ```
   pypi-AgEIcHlwaS5vcmc...
   ```
   - **Warning**: Token shown only once. If you lose it, generate a new one.
   - **Store securely**: Paste into password manager or directly into GitHub Secrets

### TestPyPI Token

1. **Log in to TestPyPI**: https://test.pypi.org

2. **Navigate to API tokens**: Same process as production

3. **Create token**:
   - **Token name**: `GitHub Actions - smartem-devtools (Test)`
   - **Scope**: "Entire account (all projects)" (TestPyPI can stay account-scoped)

4. **Copy token**:
   ```
   pypi-AgENdGVzdC5weXBpLm9yZw...
   ```
   - Store separately from production token

**Security Note**: Never commit tokens to git or share via email/chat.

## Step 3: Configure GitHub Secrets

### Add Secrets to Repository

1. **Navigate to repository secrets**:
   - Go to https://github.com/DiamondLightSource/smartem-devtools/settings/secrets/actions
   - Requires admin access

2. **Add production token**:
   - Click "New repository secret"
   - **Name**: `PYPI_API_TOKEN` (exact name - workflow expects this)
   - **Secret**: Paste production token (`pypi-AgEIcHlwaS5vcmc...`)
   - Click "Add secret"

3. **Add test token**:
   - Click "New repository secret"
   - **Name**: `TEST_PYPI_API_TOKEN`
   - **Secret**: Paste TestPyPI token (`pypi-AgENdGVzdC5weXBpLm9yZw...`)
   - Click "Add secret"

### Verify Secrets

Secrets should now appear in repository settings:

```
Repository secrets
  PYPI_API_TOKEN          Updated 5 minutes ago
  TEST_PYPI_API_TOKEN     Updated 5 minutes ago
```

**Security**: Secrets are encrypted. Even admins can't view values after creation.

## Step 4: First Manual Publish (Recommended)

### Why Manual First Publish?

1. **Establishes package on PyPI** - Package name reserved
2. **Allows project-scoped token** - More secure than account-scoped
3. **Verifies metadata** - Catch issues before automation
4. **Tests process** - Ensures build and upload work

### Manual Publish Steps

#### Build Package

```bash
cd smartem-devtools/packages/smartem-workspace

# Build wheel and source distribution
uv build

# Verify build artifacts
ls -lh dist/
# smartem_workspace-0.1.0-py3-none-any.whl (20 KB)
# smartem_workspace-0.1.0.tar.gz (48 KB)
```

#### Install Twine

```bash
# In package directory
uv pip install twine
```

Twine is the official PyPI upload tool.

#### Upload to TestPyPI First

Always test with TestPyPI before production:

```bash
# Upload to TestPyPI
twine upload --repository testpypi dist/*

# Prompts:
# Username: __token__
# Password: <paste TEST_PYPI_API_TOKEN>

# Output:
Uploading distributions to https://test.pypi.org/legacy/
Uploading smartem_workspace-0.1.0-py3-none-any.whl
100% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 20.0/20.0 kB • 00:00
Uploading smartem_workspace-0.1.0.tar.gz
100% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 48.0/48.0 kB • 00:00

View at:
https://test.pypi.org/project/smartem-workspace/0.1.0/
```

#### Verify TestPyPI Installation

Test installation from TestPyPI:

```bash
# Install in isolated environment
uvx --index-url https://test.pypi.org/simple/ smartem-workspace --version

# Or create test environment
cd /tmp
python -m venv test-env
source test-env/bin/activate
pip install --index-url https://test.pypi.org/simple/ smartem-workspace
smartem-workspace --version
deactivate
rm -rf test-env
```

**If this fails**, fix issues before proceeding to production PyPI.

#### Upload to Production PyPI

Once TestPyPI installation succeeds:

```bash
# Upload to production PyPI
twine upload dist/*

# Prompts:
# Username: __token__
# Password: <paste PYPI_API_TOKEN>

# Output:
Uploading distributions to https://upload.pypi.org/legacy/
Uploading smartem_workspace-0.1.0-py3-none-any.whl
100% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 20.0/20.0 kB • 00:00
Uploading smartem_workspace-0.1.0.tar.gz
100% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 48.0/48.0 kB • 00:00

View at:
https://pypi.org/project/smartem-workspace/0.1.0/
```

#### Verify Production Installation

Test installation from production PyPI:

```bash
# Wait 60 seconds for PyPI to propagate
sleep 60

# Test installation
uvx smartem-workspace --version
# smartem-workspace 0.1.0

# Test functionality
cd /tmp/test-workspace
uvx smartem-workspace init --preset minimal --no-interactive
```

**Success!** Package is now live on PyPI.

## Step 5: Update Token Scope (Security Best Practice)

After first publish, restrict token to project-only access.

### Why Project-Scoped Tokens?

- **Least privilege principle** - Token can only publish to smartem-workspace
- **Reduced blast radius** - If token leaks, attacker can't publish to other projects
- **Recommended by PyPI** - Best practice for production tokens

### Update Production Token

1. **Delete account-scoped token**:
   - Go to https://pypi.org → Account Settings → API tokens
   - Find `GitHub Actions - smartem-devtools`
   - Click "Remove" → Confirm

2. **Create new project-scoped token**:
   - Click "Add API token"
   - **Token name**: `GitHub Actions - smartem-devtools`
   - **Scope**: Select "Project: smartem-workspace"
   - **Copy new token**

3. **Update GitHub Secret**:
   - Go to repository secrets
   - Click "PYPI_API_TOKEN" → "Update"
   - Paste new project-scoped token
   - Click "Update secret"

### Verify New Token

Test that new token works:

```bash
# Bump version (if needed)
# Edit pyproject.toml: version = "0.1.1"

# Rebuild
uv build

# Upload with new token
twine upload dist/*
# Should succeed with project-scoped token
```

**TestPyPI token** can remain account-scoped (it's a test environment).

## Token Security Best Practices

### Do's ✅

1. **Use project-scoped tokens** when possible
2. **Enable 2FA** on PyPI accounts
3. **Rotate tokens periodically** (every 6-12 months)
4. **Use separate tokens** for test vs production
5. **Document token creation date** (in password manager or team wiki)
6. **Store tokens in GitHub Secrets only** (never in code)
7. **Use environment protection** for production deployments
8. **Monitor PyPI project** for unexpected releases

### Don'ts ❌

1. **Never commit tokens to git** (even in `.env` files)
2. **Don't share tokens via email/chat** (use secure password manager)
3. **Don't use account-scoped tokens long-term** (switch to project-scoped after first publish)
4. **Don't reuse tokens across projects** (each project gets its own token)
5. **Don't disable 2FA** (required for publishing)
6. **Don't store tokens unencrypted** (use password manager)

### Token Rotation Schedule

| Token Type | Rotation Frequency | Trigger |
|------------|-------------------|---------|
| Production PyPI | Annually | Calendar reminder |
| TestPyPI | As needed | No strict schedule |
| After leak | Immediately | Security incident |

## Troubleshooting

### Common Errors

#### "Invalid credentials"

**Error:**
```
HTTP Error 403: Invalid or non-existent authentication information.
```

**Causes:**
- Token doesn't start with `pypi-`
- Token has expired (PyPI tokens don't expire, but can be revoked)
- 2FA not enabled on account
- Wrong PyPI instance (using production token on TestPyPI or vice versa)

**Solutions:**
1. Verify token format: `pypi-AgEIcHlwaS5vcmc...`
2. Check 2FA is enabled: https://pypi.org/manage/account/
3. Verify token scope allows publishing
4. Regenerate token if needed

#### "Package already exists"

**Error:**
```
HTTP Error 400: File already exists.
```

**Cause:** Trying to upload same version twice (PyPI doesn't allow overwrites)

**Solutions:**

1. **Bump version** in `pyproject.toml`:
   ```toml
   version = "0.1.1"  # was 0.1.0
   ```

2. **Rebuild**:
   ```bash
   rm -rf dist/
   uv build
   ```

3. **Upload new version**:
   ```bash
   twine upload dist/*
   ```

**Note**: CI handles version bumping automatically with commitizen.

#### "Insufficient permissions"

**Error:**
```
HTTP Error 403: The credential associated with user '<username>' is not allowed to upload to project 'smartem-workspace'.
```

**Causes:**
- Token scope too narrow (doesn't include this project)
- Token revoked
- Account no longer has project permissions

**Solutions:**

1. **Verify token scope**:
   - Go to https://pypi.org → Account Settings → API tokens
   - Check scope includes "Project: smartem-workspace"

2. **Regenerate token with correct scope**:
   - Delete existing token
   - Create new token with "Project: smartem-workspace" scope
   - Update GitHub Secret

#### GitHub Actions: "Secret not found"

**Error:**
```
Error: Input required and not supplied: PYPI_API_TOKEN
```

**Causes:**
- Secret name mismatch (case-sensitive)
- Secret not added to repository
- Workflow running on forked repository (secrets don't sync to forks)

**Solutions:**

1. **Verify secret name** in workflow file:
   ```yaml
   TWINE_PASSWORD: ${{ secrets.PYPI_API_TOKEN }}  # Exact name
   ```

2. **Check secret exists**:
   - Go to repository settings → Secrets
   - Verify `PYPI_API_TOKEN` is listed

3. **Add secret** if missing (see Step 3)

#### GitHub Actions: Version bump fails

**Error:**
```
No version bump needed
```

**Cause:** No conventional commits since last tag, or all commits are `chore`/`docs` (don't trigger bumps)

**Solutions:**

1. **Check recent commits**:
   ```bash
   git log --oneline -10
   ```

2. **Ensure at least one bumpable commit**:
   - `feat:` → minor bump
   - `fix:` → patch bump
   - `BREAKING CHANGE:` → major bump

3. **Manually trigger bump** (if needed):
   ```bash
   git commit --allow-empty -m "feat: trigger version bump for release"
   git push
   ```

### Network Issues

#### Timeout during upload

**Error:**
```
ConnectionError: Failed to upload after 3 attempts
```

**Solutions:**
1. Check internet connection
2. Retry upload
3. Check PyPI status: https://status.python.org/
4. Try from different network

#### Slow upload

**Symptom:** Upload takes very long

**Solutions:**
1. Check file sizes: `ls -lh dist/`
2. Ensure only necessary files in wheel
3. Use wired connection instead of Wi-Fi

## CI/CD Workflow Reference

### Environment Variables

The GitHub Actions workflow uses these secrets:

```yaml
env:
  TWINE_USERNAME: __token__
  TWINE_PASSWORD: ${{ secrets.PYPI_API_TOKEN }}  # Production
  # or
  TWINE_PASSWORD: ${{ secrets.TEST_PYPI_API_TOKEN }}  # TestPyPI
```

### Workflow Triggers

| Event | Target | Token Used |
|-------|--------|------------|
| **Push to main** (with package changes) | TestPyPI | `TEST_PYPI_API_TOKEN` |
| **Release tag** (`smartem-workspace-v*`) | PyPI | `PYPI_API_TOKEN` |
| **Pull request** | No publish | N/A |
| **Manual** (workflow_dispatch) | No publish | N/A |

### Publishing Flow

#### TestPyPI (Continuous Deployment)

Triggered on every push to `main` with package changes:

```
git push origin main
    ↓
GitHub Actions runs
    ↓
Test + Lint + Build jobs
    ↓
Version bump (if feat/fix commits)
    ↓
Upload to TestPyPI
    ↓
Verify: https://test.pypi.org/project/smartem-workspace/
```

#### PyPI (Release Deployment)

Triggered on release tag:

```
git tag smartem-workspace-v0.2.0
git push origin smartem-workspace-v0.2.0
    ↓
GitHub Actions runs
    ↓
Test + Lint + Build jobs
    ↓
Upload to PyPI
    ↓
Verify installation: uvx smartem-workspace@0.2.0
    ↓
Create GitHub Release (manual)
```

### Environments

Configure GitHub Environments for additional protection:

**testpypi** (Optional)
- URL: https://test.pypi.org/p/smartem-workspace
- Reviewers: None (auto-deploy)
- Secrets: Inherits `TEST_PYPI_API_TOKEN`

**pypi** (Recommended)
- URL: https://pypi.org/p/smartem-workspace
- Reviewers: Maintainers (require approval before publish)
- Secrets: Inherits `PYPI_API_TOKEN`

To configure:
1. Go to repository settings → Environments
2. Click "New environment"
3. Name: `pypi`
4. Add protection rules (optional):
   - Required reviewers: @maintainer1, @maintainer2
   - Wait timer: 0 minutes
5. Save

## Monitoring & Maintenance

### Check Package Status

**Production PyPI:**
- Project page: https://pypi.org/project/smartem-workspace/
- Statistics: https://pypistats.org/packages/smartem-workspace

**TestPyPI:**
- Project page: https://test.pypi.org/project/smartem-workspace/

### Download Statistics

View on PyPI project page:
- Total downloads
- Downloads by version
- Downloads by Python version
- Downloads by system

Use for:
- Measuring adoption
- Identifying popular versions
- Planning deprecations

### Monitor for Issues

**Set up alerts for:**
- Failed CI/CD runs (GitHub Actions notifications)
- PyPI security advisories (email from PyPI)
- Dependency vulnerabilities (Dependabot)

**Regularly check:**
- GitHub issues mentioning installation problems
- PyPI project "Report a problem" section

### Token Rotation Schedule

| Task | Frequency | Next Due |
|------|-----------|----------|
| Review tokens | Every 6 months | [Date] |
| Rotate production token | Annually | [Date] |
| Rotate test token | As needed | N/A |
| Audit GitHub Secrets | Quarterly | [Date] |

Add to team calendar with reminders.

## Emergency Procedures

### Token Compromise

If a token is leaked (committed to git, shared publicly, etc.):

**Immediate Actions:**

1. **Revoke token on PyPI**:
   - Go to https://pypi.org → Account Settings → API tokens
   - Find compromised token
   - Click "Remove" → Confirm

2. **Generate new token**:
   - Follow Step 2 instructions
   - Use different token name to distinguish

3. **Update GitHub Secret**:
   - Go to repository secrets
   - Update `PYPI_API_TOKEN` with new token
   - Document incident in team wiki

4. **Review recent publishes**:
   - Check https://pypi.org/project/smartem-workspace/#history
   - Verify no unauthorised releases

5. **Notify team**:
   - Email: smartem@diamond.ac.uk
   - Subject: "PyPI token compromised and rotated"
   - Include actions taken

**Preventive Measures:**

- Use git-secrets or pre-commit hooks to prevent commits with tokens
- Never paste tokens in Slack/Teams
- Use password manager for sharing within team
- Regularly audit repository for secrets

### Accidental Bad Release

If a broken version is published to PyPI:

**Option 1: Yank Release (Recommended)**

Yanking prevents new installations but doesn't delete:

```bash
# Install twine if needed
uv pip install twine

# Yank the bad version
twine upload --yank "Broken release, use 0.2.1 instead" \
  --repository pypi \
  --username __token__ \
  --password $PYPI_API_TOKEN

# Or via PyPI web UI:
# 1. Go to https://pypi.org/project/smartem-workspace/
# 2. Click on bad version
# 3. Options → Yank release
# 4. Provide reason: "Broken installation, use 0.2.1"
```

**What yanking does:**
- Hides version from PyPI index
- Prevents `pip install smartem-workspace` from selecting it
- Still allows `pip install smartem-workspace==0.2.0` (if someone really wants it)
- Doesn't break existing installations

**Option 2: Publish Fixed Version**

Quickly release a patch:

```bash
# Fix the issue in code
vim smartem_workspace/cli.py

# Bump version
# Edit pyproject.toml: version = "0.2.1"

# Rebuild and publish
uv build
twine upload dist/*

# Yank broken version (optional but recommended)
# (See Option 1)
```

**Option 3: Delete Version (Not Recommended)**

PyPI allows deletion within 72 hours, but:
- ❌ Breaks existing installations
- ❌ Can't reuse version number
- ❌ Creates confusion

Only use for critical security issues.

### Security Incident Response

If a security vulnerability is found:

1. **Assess severity** (use CVSS scoring)
2. **Develop fix** in private branch
3. **Coordinate disclosure**:
   - Notify PyPI security team: security@pypi.org
   - Notify users via GitHub Security Advisory
4. **Release patched version**
5. **Yank vulnerable versions**
6. **Publish security advisory**

## Contact & Support

### PyPI Support

- **Documentation**: https://pypi.org/help/
- **Support**: https://pypi.org/help/#support
- **Security**: security@pypi.org

### GitHub Actions Support

- **Documentation**: https://docs.github.com/actions
- **Community Forum**: https://github.community/
- **Repository Issues**: https://github.com/DiamondLightSource/smartem-devtools/issues

### SmartEM Team

- **Email**: smartem@diamond.ac.uk
- **GitHub Issues**: https://github.com/DiamondLightSource/smartem-devtools/issues
- **Discussions**: https://github.com/DiamondLightSource/smartem-devtools/discussions

---

## Quick Reference

### Token Setup Checklist

- [ ] Create PyPI account with 2FA
- [ ] Create TestPyPI account with 2FA
- [ ] Generate PyPI token (account-scoped initially)
- [ ] Generate TestPyPI token
- [ ] Add `PYPI_API_TOKEN` to GitHub Secrets
- [ ] Add `TEST_PYPI_API_TOKEN` to GitHub Secrets
- [ ] First manual publish to TestPyPI
- [ ] First manual publish to PyPI
- [ ] Update PyPI token to project-scoped
- [ ] Update GitHub Secret with new token
- [ ] Test CI/CD publish to TestPyPI
- [ ] Test CI/CD publish to PyPI (release tag)
- [ ] Document tokens in team password manager
- [ ] Schedule token rotation reminders

### Useful Commands

```bash
# Build package
uv build

# Upload to TestPyPI
twine upload --repository testpypi dist/*

# Upload to PyPI
twine upload dist/*

# Test installation from TestPyPI
uvx --index-url https://test.pypi.org/simple/ smartem-workspace --version

# Test installation from PyPI
uvx smartem-workspace --version

# Yank release
twine upload --yank "Reason" dist/*
```

### Token Format

```
Production: pypi-AgEIcHlwaS5vcmc...
TestPyPI:   pypi-AgENdGVzdC5weXBpLm9yZw...
```

Always starts with `pypi-`.
