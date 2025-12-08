---
name: Git
description: Git operations - commits, branches, rebasing, history management, and workflow best practices
version: 1.0.0
tags: [git, version-control, commits, branches, rebase]
---

# Git Skill

Git version control operations and workflow management.

## When to Use

- Creating commits with proper messages
- Branch management and merging
- Rebasing and history cleanup
- Resolving merge conflicts
- Investigating history and blame

## Commit Messages

### Format

```
<type>: <short description>

<optional body - explain why, not what>

<optional footer - references, breaking changes>
```

### Types

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

### Examples

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

### SmartEM-Specific Rules

- **No emojis** in commit messages (Windows build compatibility)
- **No Claude Code attribution** - do not add "Generated with Claude Code" or similar footers (already mentioned in README)
- Keep subject line under 72 characters
- Use imperative mood ("add" not "added")

## Branch Operations

### Create and Switch

```bash
# Create and switch to new branch
git checkout -b feature/add-atlas-endpoint

# Create from specific commit/branch
git checkout -b hotfix/db-connection origin/main

# Switch to existing branch
git checkout main
git switch main  # newer syntax
```

### Branch Naming

```
feature/<description>    # New features
fix/<description>        # Bug fixes
hotfix/<description>     # Urgent production fixes
refactor/<description>   # Code refactoring
docs/<description>       # Documentation updates
```

### List and Clean

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

## Rebasing

### Interactive Rebase (Clean History)

```bash
# Rebase last N commits
git rebase -i HEAD~3

# Rebase onto main
git rebase -i main
```

### Rebase Commands

In the editor:
- `pick` - keep commit as is
- `reword` - keep commit, edit message
- `squash` - combine with previous commit
- `fixup` - combine with previous, discard message
- `drop` - remove commit

### Rebase Workflow

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

### Force Push After Rebase

```bash
# Only for branches you own (not shared branches!)
git push --force-with-lease origin feature/my-branch
```

## Merging

### Merge Strategies

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

### Resolve Conflicts

```bash
# See conflicted files
git status

# After fixing conflicts
git add <resolved-files>
git commit  # or git merge --continue
```

## History Investigation

### View History

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

### Blame

```bash
# Who changed each line
git blame path/to/file

# Ignore whitespace
git blame -w path/to/file

# Show specific lines
git blame -L 10,20 path/to/file
```

### Diff

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

## Stashing

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

## Undoing Changes

### Unstage Files

```bash
git restore --staged path/to/file
git reset HEAD path/to/file  # older syntax
```

### Discard Working Changes

```bash
git restore path/to/file
git checkout -- path/to/file  # older syntax
```

### Undo Last Commit

```bash
# Keep changes staged
git reset --soft HEAD~1

# Keep changes unstaged
git reset HEAD~1

# Discard changes entirely
git reset --hard HEAD~1
```

### Revert (Safe Undo)

```bash
# Create new commit that undoes changes
git revert <commit-hash>

# Revert merge commit
git revert -m 1 <merge-commit-hash>
```

## Tags

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

## Configuration

### Useful Aliases

```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all"
```

### Check Config

```bash
git config --list
git config user.name
git config user.email
```

## Troubleshooting

### Recover Deleted Branch

```bash
# Find the commit
git reflog

# Recreate branch
git checkout -b recovered-branch <commit-hash>
```

### Fix Wrong Commit Message

```bash
# Last commit only
git commit --amend -m "correct message"

# Older commits - use interactive rebase
git rebase -i HEAD~3
# Change 'pick' to 'reword' for target commit
```

### Remove File from Git (Keep Local)

```bash
git rm --cached path/to/file
echo "path/to/file" >> .gitignore
git commit -m "chore: stop tracking file"
```

## References

- Pro Git book: https://git-scm.com/book/en/v2
- Git documentation: https://git-scm.com/docs
