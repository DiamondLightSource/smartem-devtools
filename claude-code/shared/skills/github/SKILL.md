---
name: GitHub
description: GitHub operations - PRs, issues, project boards, releases, CI/CD debugging, and gh CLI usage
version: 1.0.0
tags: [github, pr, issues, ci-cd, gh-cli, project-board]
---

# GitHub Skill

GitHub operations using the gh CLI and web interface patterns.

## When to Use

- Creating and managing pull requests
- Working with issues and project boards
- Debugging CI/CD workflow failures
- Managing releases and tags
- Repository administration

## Prerequisites

```bash
# Check gh is installed and authenticated
gh auth status

# Login if needed
gh auth login
```

## Pull Requests

### Create PR

```bash
# Create PR from current branch
gh pr create --title "feat: add atlas endpoint" --body "Description here"

# Create with template
gh pr create --fill  # Uses PR template if exists

# Create draft PR
gh pr create --draft --title "WIP: new feature"

# Create and request reviewers
gh pr create --title "fix: connection issue" --reviewer username1,username2
```

### PR Body Template

```markdown
## Summary

Brief description of changes.

## Changes

- Added X
- Modified Y
- Removed Z

## Testing

How was this tested?

## Related Issues

Closes #123
```

### View and List PRs

```bash
# List open PRs
gh pr list

# List PRs by author
gh pr list --author @me

# View specific PR
gh pr view 123
gh pr view 123 --web  # Open in browser

# View PR diff
gh pr diff 123
```

### Review PRs

```bash
# Checkout PR locally
gh pr checkout 123

# Add review comment
gh pr review 123 --comment --body "Looks good, minor suggestion..."

# Approve
gh pr review 123 --approve

# Request changes
gh pr review 123 --request-changes --body "Please fix X"
```

### Merge PRs

```bash
# Merge with merge commit
gh pr merge 123

# Squash merge
gh pr merge 123 --squash

# Rebase merge
gh pr merge 123 --rebase

# Auto-merge when checks pass
gh pr merge 123 --auto --squash
```

### PR Maintenance

```bash
# Update PR branch with base
gh pr update-branch 123

# Close without merging
gh pr close 123

# Reopen
gh pr reopen 123

# Edit PR
gh pr edit 123 --title "new title" --add-label "bug"
```

## Issues

### Create Issues

```bash
# Interactive
gh issue create

# With details
gh issue create --title "Bug: X doesn't work" --body "Description"

# With labels and assignee
gh issue create --title "Feature request" --label "enhancement" --assignee @me

# From file
gh issue create --title "Bug report" --body-file issue_body.md
```

### Issue Body Template

```markdown
## Description

Clear description of the issue.

## Steps to Reproduce (for bugs)

1. Step one
2. Step two
3. See error

## Expected Behaviour

What should happen.

## Actual Behaviour

What actually happens.

## Environment

- OS:
- Python version:
- Package version:
```

### View and List Issues

```bash
# List open issues
gh issue list

# Filter by label
gh issue list --label "bug"

# Filter by assignee
gh issue list --assignee @me

# View specific issue
gh issue view 456
gh issue view 456 --web
```

### Manage Issues

```bash
# Close issue
gh issue close 456

# Reopen
gh issue reopen 456

# Add comment
gh issue comment 456 --body "Working on this"

# Edit
gh issue edit 456 --add-label "priority" --add-assignee username

# Transfer to another repo
gh issue transfer 456 owner/other-repo
```

## Project Boards

### View Projects

```bash
# List projects
gh project list

# View project
gh project view 1 --web
```

### Manage Items

```bash
# Add issue to project
gh project item-add 1 --owner DiamondLightSource --url https://github.com/DiamondLightSource/smartem-decisions/issues/123

# List items in project
gh project item-list 1 --owner DiamondLightSource
```

### Project Field Updates

```bash
# Update item status (requires project item ID)
gh project item-edit --project-id PROJECT_ID --id ITEM_ID --field-id FIELD_ID --single-select-option-id OPTION_ID
```

## CI/CD Workflows

### View Workflow Runs

```bash
# List recent runs
gh run list

# List runs for specific workflow
gh run list --workflow ci.yml

# List failed runs
gh run list --status failure

# View specific run
gh run view 12345678

# View with logs
gh run view 12345678 --log
gh run view 12345678 --log-failed  # Only failed steps
```

### Debug CI Failures

```bash
# Get failed run details
gh run view 12345678 --log-failed

# Download artifacts
gh run download 12345678

# Watch running workflow
gh run watch 12345678
```

### Rerun Workflows

```bash
# Rerun all jobs
gh run rerun 12345678

# Rerun only failed jobs
gh run rerun 12345678 --failed

# Rerun specific job
gh run rerun 12345678 --job job_name
```

### Trigger Workflow Manually

```bash
# Trigger workflow_dispatch
gh workflow run ci.yml

# With inputs
gh workflow run ci.yml --field environment=staging
```

### View Workflow Files

```bash
# List workflows
gh workflow list

# View workflow definition
gh workflow view ci.yml
```

## Releases

### Create Release

```bash
# Create release from tag
gh release create v1.0.0 --title "Version 1.0.0" --notes "Release notes here"

# Create with auto-generated notes
gh release create v1.0.0 --generate-notes

# Create draft release
gh release create v1.0.0 --draft

# Create pre-release
gh release create v1.0.0-beta.1 --prerelease

# Upload assets with release
gh release create v1.0.0 ./dist/*.whl ./dist/*.tar.gz
```

### Manage Releases

```bash
# List releases
gh release list

# View release
gh release view v1.0.0

# Download release assets
gh release download v1.0.0

# Delete release
gh release delete v1.0.0
```

## Repository Operations

### Clone and Fork

```bash
# Clone
gh repo clone DiamondLightSource/smartem-decisions

# Fork
gh repo fork DiamondLightSource/smartem-decisions

# Fork and clone
gh repo fork DiamondLightSource/smartem-decisions --clone
```

### View Repository

```bash
# View repo info
gh repo view

# Open in browser
gh repo view --web

# View specific repo
gh repo view DiamondLightSource/smartem-decisions
```

## Notifications

```bash
# View notifications
gh status

# Mark as read
gh api notifications -X PUT
```

## API Access

For operations not covered by gh commands:

```bash
# GET request
gh api repos/DiamondLightSource/smartem-decisions

# POST request
gh api repos/DiamondLightSource/smartem-decisions/issues \
  -f title="API created issue" \
  -f body="Created via gh api"

# GraphQL query
gh api graphql -f query='
  query {
    repository(owner: "DiamondLightSource", name: "smartem-decisions") {
      issues(first: 10) {
        nodes { title number }
      }
    }
  }
'
```

## Common Workflows

### Feature Development

```bash
# 1. Create branch
git checkout -b feature/new-endpoint

# 2. Make changes, commit
git add .
git commit -m "feat: add new endpoint"

# 3. Push and create PR
git push -u origin feature/new-endpoint
gh pr create --fill

# 4. After review, merge
gh pr merge --squash
```

### Hotfix

```bash
# 1. Create from main
git checkout main
git pull
git checkout -b hotfix/critical-fix

# 2. Fix and commit
git commit -m "fix: critical issue"

# 3. Create PR with priority
git push -u origin hotfix/critical-fix
gh pr create --title "fix: critical issue" --label "priority"

# 4. Fast-track review and merge
gh pr merge --squash
```

### CI Failure Investigation

```bash
# 1. Find failed run
gh run list --status failure

# 2. View failure logs
gh run view <run-id> --log-failed

# 3. Fix locally and push
# ... make fixes ...
git push

# 4. Or rerun if flaky
gh run rerun <run-id> --failed
```

## SmartEM-Specific

### Attribution Rules

- **No Claude Code attribution** in PR descriptions, commit messages, or issue bodies
- Claude is already mentioned in the README - no need to repeat in every contribution

### Repositories

```bash
# Main repos
gh repo view DiamondLightSource/smartem-decisions
gh repo view DiamondLightSource/smartem-frontend
gh repo view DiamondLightSource/fandanGO-cryoem-dls
```

### Common Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `priority` - High priority item
- `good first issue` - Good for newcomers

## References

- gh CLI manual: https://cli.github.com/manual/
- GitHub Actions: https://docs.github.com/en/actions
- GitHub API: https://docs.github.com/en/rest
