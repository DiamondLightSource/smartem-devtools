"""Repository cloning operations."""

import subprocess
from pathlib import Path

from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

from smartem_workspace.config.schema import Organization, Repository

console = Console()


def get_repo_url(repo: Repository, use_ssh: bool) -> str:
    """Get the clone URL based on preference."""
    return repo.urls.ssh if use_ssh else repo.urls.https


def get_local_dir(org: Organization) -> str:
    """Get the local directory name for an organization."""
    return org.localDir if org.localDir else org.name


def clone_repo(
    repo: Repository,
    org: Organization,
    repos_dir: Path,
    use_ssh: bool = False,
) -> bool:
    """
    Clone a single repository.

    Returns:
        True if successful or already exists, False on error
    """
    org_dir = repos_dir / get_local_dir(org)
    org_dir.mkdir(parents=True, exist_ok=True)

    repo_path = org_dir / repo.name

    if repo_path.exists():
        console.print(f"  [dim]Skipping {repo.name} (already exists)[/dim]")
        return True

    url = get_repo_url(repo, use_ssh)

    try:
        result = subprocess.run(
            ["git", "clone", url, str(repo_path)],
            capture_output=True,
            text=True,
            timeout=300,
        )
        if result.returncode != 0:
            console.print(f"  [red]Failed to clone {repo.name}: {result.stderr}[/red]")
            return False
        console.print(f"  [green]Cloned {repo.name}[/green]")
        return True
    except subprocess.TimeoutExpired:
        console.print(f"  [red]Timeout cloning {repo.name}[/red]")
        return False
    except FileNotFoundError:
        console.print("[red]Git not found. Please install git and try again.[/red]")
        return False


def clone_repos(
    repos: list[tuple[Organization, Repository]],
    workspace_path: Path,
    use_ssh: bool = False,
    devtools_first: bool = True,
) -> tuple[int, int]:
    """
    Clone multiple repositories.

    Args:
        repos: List of (org, repo) tuples to clone
        workspace_path: Root workspace directory
        use_ssh: Use SSH URLs instead of HTTPS
        devtools_first: Clone smartem-devtools first (required for config)

    Returns:
        Tuple of (success_count, failure_count)
    """
    repos_dir = workspace_path / "repos"
    repos_dir.mkdir(parents=True, exist_ok=True)

    success = 0
    failed = 0

    if devtools_first:
        devtools = None
        remaining = []
        for org, repo in repos:
            if org.name == "DiamondLightSource" and repo.name == "smartem-devtools":
                devtools = (org, repo)
            else:
                remaining.append((org, repo))

        if devtools:
            console.print()
            console.print("[bold]Cloning smartem-devtools (required)...[/bold]")
            org, repo = devtools
            if clone_repo(repo, org, repos_dir, use_ssh):
                success += 1
            else:
                failed += 1
                console.print("[red]Failed to clone smartem-devtools. Cannot continue.[/red]")
                return success, failed + len(remaining)

            repos = remaining

    console.print()
    console.print("[bold]Cloning repositories...[/bold]")

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Cloning...", total=len(repos))

        for org, repo in repos:
            progress.update(task, description=f"Cloning {org.name}/{repo.name}...")
            if clone_repo(repo, org, repos_dir, use_ssh):
                success += 1
            else:
                failed += 1
            progress.advance(task)

    return success, failed


def pull_repo(repo_path: Path) -> bool:
    """
    Pull latest changes for a repository.

    Returns:
        True if successful, False on error
    """
    try:
        result = subprocess.run(
            ["git", "-C", str(repo_path), "pull", "--ff-only"],
            capture_output=True,
            text=True,
            timeout=120,
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def get_repo_status(repo_path: Path) -> dict | None:
    """
    Get status information for a repository.

    Returns:
        Dict with status info or None if not a git repo
    """
    if not (repo_path / ".git").exists():
        return None

    try:
        branch_result = subprocess.run(
            ["git", "-C", str(repo_path), "branch", "--show-current"],
            capture_output=True,
            text=True,
        )
        branch = branch_result.stdout.strip() if branch_result.returncode == 0 else "unknown"

        status_result = subprocess.run(
            ["git", "-C", str(repo_path), "status", "--porcelain"],
            capture_output=True,
            text=True,
        )
        has_changes = bool(status_result.stdout.strip())

        return {
            "branch": branch,
            "has_changes": has_changes,
            "path": str(repo_path),
        }
    except Exception:
        return None
