---
name: Git
description: Git and GitHub operations - commits, branches, rebasing, PRs, issues, CI/CD, and gh CLI
version: 1.1.0
tags: [git, github, version-control, commits, branches, rebase, pr, issues, ci-cd, gh-cli]
---

# Git Skill

Git version control and GitHub operations using the gh CLI.

## When to Use

- Creating commits with proper messages
- Branch management and merging
- Rebasing and history cleanup
- Resolving merge conflicts
- Investigating history and blame
- Creating and managing pull requests
- Working with issues and project boards
- Debugging CI/CD workflow failures
- Managing releases and tags
- Repository administration

---

## Part 1: Git Operations

### Commit Messages

#### Format

```
<type>: <short description>

<optional body - explain why, not what>

<optional footer - references, breaking changes>
```

#### Types

| Type | Use For |
|------|---------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation only |
| refactor | Code change that neither fixes nor adds |
| test | Adding or correcting tests |
| chore | Maintenance, dependencies, tooling |
| style | Formatting, no code change |
| perf | Performance improvement |

#### Examples

```bash
# Simple fix
git commit -m "fix: correct database connection retry logic"

# Feature with body
git commit -m "feat: add SSE endpoint for agent recommendations

Agents need real-time updates when ML models produce new
recommendations. SSE chosen over WebSocket for simpler
client implementation."

# Breaking change
git commit -m "feat!: change API response format for gridsquares

BREAKING CHANGE: gridsquare endpoint now returns nested
foilhole data. Clients must update parsing logic."
```

### Branch Operations

#### Create and Switch

```bash
# Create and switch to new branch
git checkout -b feature/add-atlas-endpoint

# Create from specific commit/branch
git checkout -b hotfix/db-connection origin/main

# Switch to existing branch
git checkout main
git switch main  # newer syntax
```

#### Branch Naming

```
feature/<description>    # New features
fix/<description>        # Bug fixes
hotfix/<description>     # Urgent production fixes
refactor/<description>   # Code refactoring
docs/<description>       # Documentation updates
```

#### List and Clean

```bash
# List branches
git branch -a           # All branches
git branch --merged     # Merged into current
git branch --no-merged  # Not yet merged

# Delete local branch
git branch -d feature/old-branch      # Safe delete (must be merged)
git branch -D feature/old-branch      # Force delete

# Delete remote branch
git push origin --delete feature/old-branch

# Prune stale remote tracking branches
git fetch --prune
```

### Rebasing

#### Interactive Rebase (Clean History)

```bash
# Rebase last N commits
git rebase -i HEAD~3

# Rebase onto main
git rebase -i main
```

#### Rebase Commands

In the editor:
- `pick` - keep commit as is
- `reword` - keep commit, edit message
- `squash` - combine with previous commit
- `fixup` - combine with previous, discard message
- `drop` - remove commit

#### Rebase Workflow

```bash
# Update feature branch with main
git checkout feature/my-branch
git fetch origin
git rebase origin/main

# If conflicts:
# 1. Fix conflicts in files
# 2. git add <fixed-files>
# 3. git rebase --continue

# Abort if needed
git rebase --abort
```

#### Force Push After Rebase

```bash
# Only for branches you own (not shared branches!)
git push --force-with-lease origin feature/my-branch
```

### Merging

#### Merge Strategies

```bash
# Standard merge (creates merge commit)
git checkout main
git merge feature/branch

# Squash merge (single commit, no merge commit)
git merge --squash feature/branch
git commit -m "feat: add new feature"

# Fast-forward only (fails if not possible)
git merge --ff-only feature/branch
```

#### Resolve Conflicts

```bash
# See conflicted files
git status

# After fixing conflicts
git add <resolved-files>
git commit  # or git merge --continue
```

### History Investigation

#### View History

```bash
# Compact log
git log --oneline -20

# With graph
git log --oneline --graph --all

# File history
git log --oneline -- path/to/file

# Search commits
git log --grep="database"
git log -S "function_name"  # Search code changes
```

#### Blame

```bash
# Who changed each line
git blame path/to/file

# Ignore whitespace
git blame -w path/to/file

# Show specific lines
git blame -L 10,20 path/to/file
```

#### Diff

```bash
# Working directory vs staged
git diff

# Staged vs last commit
git diff --staged

# Between branches
git diff main..feature/branch

# Specific file
git diff main..feature/branch -- path/to/file
```

### Stashing

```bash
# Stash changes
git stash
git stash push -m "work in progress on X"

# List stashes
git stash list

# Apply and keep stash
git stash apply

# Apply and remove stash
git stash pop

# Apply specific stash
git stash apply stash@{2}

# Drop stash
git stash drop stash@{0}
```

### Undoing Changes

#### Unstage Files

```bash
git restore --staged path/to/file
git reset HEAD path/to/file  # older syntax
```

#### Discard Working Changes

```bash
git restore path/to/file
git checkout -- path/to/file  # older syntax
```

#### Undo Last Commit

```bash
# Keep changes staged
git reset --soft HEAD~1

# Keep changes unstaged
git reset HEAD~1

# Discard changes entirely
git reset --hard HEAD~1
```

#### Revert (Safe Undo)

```bash
# Create new commit that undoes changes
git revert <commit-hash>

# Revert merge commit
git revert -m 1 <merge-commit-hash>
```

### Tags

```bash
# List tags
git tag

# Create annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Create tag at specific commit
git tag -a v1.0.0 <commit-hash> -m "Release version 1.0.0"

# Push tags
git push origin v1.0.0
git push origin --tags  # All tags

# Delete tag
git tag -d v1.0.0
git push origin --delete v1.0.0
```

### Configuration

#### Useful Aliases

```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all"
```

#### Check Config

```bash
git config --list
git config user.name
git config user.email
```

### Troubleshooting

#### Recover Deleted Branch

```bash
# Find the commit
git reflog

# Recreate branch
git checkout -b recovered-branch <commit-hash>
```

#### Fix Wrong Commit Message

```bash
# Last commit only
git commit --amend -m "correct message"

# Older commits - use interactive rebase
git rebase -i HEAD~3
# Change 'pick' to 'reword' for target commit
```

#### Remove File from Git (Keep Local)

```bash
git rm --cached path/to/file
echo "path/to/file" >> .gitignore
git commit -m "chore: stop tracking file"
```

---

## Part 2: GitHub Operations

### Prerequisites

```bash
# Check gh is installed and authenticated
gh auth status

# Login if needed
gh auth login
```

### Pull Requests

#### Create PR

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

#### PR Body Template

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

#### View and List PRs

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

#### Review PRs

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

#### Merge PRs

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

#### PR Maintenance

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

### Issues

#### Create Issues

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

#### Issue Body Template

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

#### View and List Issues

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

#### Manage Issues

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

### Project Boards

#### View Projects

```bash
# List projects
gh project list

# View project
gh project view 1 --web
```

#### Manage Items

```bash
# Add issue to project
gh project item-add 1 --owner DiamondLightSource --url https://github.com/DiamondLightSource/smartem-decisions/issues/123

# List items in project
gh project item-list 1 --owner DiamondLightSource
```

#### Project Field Updates

```bash
# Update item status (requires project item ID)
gh project item-edit --project-id PROJECT_ID --id ITEM_ID --field-id FIELD_ID --single-select-option-id OPTION_ID
```

### CI/CD Workflows

#### View Workflow Runs

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

#### Debug CI Failures

```bash
# Get failed run details
gh run view 12345678 --log-failed

# Download artifacts
gh run download 12345678

# Watch running workflow
gh run watch 12345678
```

#### Rerun Workflows

```bash
# Rerun all jobs
gh run rerun 12345678

# Rerun only failed jobs
gh run rerun 12345678 --failed

# Rerun specific job
gh run rerun 12345678 --job job_name
```

#### Trigger Workflow Manually

```bash
# Trigger workflow_dispatch
gh workflow run ci.yml

# With inputs
gh workflow run ci.yml --field environment=staging
```

#### View Workflow Files

```bash
# List workflows
gh workflow list

# View workflow definition
gh workflow view ci.yml
```

### Releases

#### Create Release

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

#### Manage Releases

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

### Repository Operations

#### Clone and Fork

```bash
# Clone
gh repo clone DiamondLightSource/smartem-decisions

# Fork
gh repo fork DiamondLightSource/smartem-decisions

# Fork and clone
gh repo fork DiamondLightSource/smartem-decisions --clone
```

#### View Repository

```bash
# View repo info
gh repo view

# Open in browser
gh repo view --web

# View specific repo
gh repo view DiamondLightSource/smartem-decisions
```

### Notifications

```bash
# View notifications
gh status

# Mark as read
gh api notifications -X PUT
```

### API Access

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

---

## Part 3: Common Workflows

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

---

## Part 4: SmartEM Project Context

### Attribution Rules

- **No Claude Code attribution** in commit messages, PR descriptions, or issue bodies
- Claude is already mentioned in the README - no need to repeat in every contribution
- **No emojis** in commit messages (Windows build compatibility)
- Keep subject line under 72 characters
- Use imperative mood ("add" not "added")

### Project Board

- **Project Board ID:** 51 (DiamondLightSource organisation)

### Labels

Labels are defined in `core/github-labels.json` and vary by repository:

| Repository | Labels |
|------------|--------|
| smartem-devtools | All labels (types of work + system components) |
| smartem-decisions | Types of work only |
| smartem-frontend | Types of work only |
| fandanGO-cryoem-dls | Types of work only |

**Types of work labels:** documentation, testing, bugfixing, development, refactoring, research, devops, security, admin, enhancement

**System component labels (smartem-devtools only):** smartem-backend, smartem-backend:db, smartem-backend:api, smartem-agent, smartem-frontend, smartem-aria-connector, smartem-devtools, smartem-devtools:webui, smartem-devtools:claude, smartem-devtools:e2e-test

See `core/github-labels.json` for the full list with descriptions and colours.

### Repositories

```bash
# Main repos
gh repo view DiamondLightSource/smartem-decisions
gh repo view DiamondLightSource/smartem-frontend
gh repo view DiamondLightSource/smartem-devtools
gh repo view DiamondLightSource/fandanGO-cryoem-dls
```

---

## References

- Pro Git book: https://git-scm.com/book/en/v2
- Git documentation: https://git-scm.com/docs
- gh CLI manual: https://cli.github.com/manual/
- GitHub Actions: https://docs.github.com/en/actions
- GitHub API: https://docs.github.com/en/rest
