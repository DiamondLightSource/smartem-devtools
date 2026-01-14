"""Repository synchronization command."""

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

from smartem_workspace.config.schema import ReposConfig
from smartem_workspace.setup.repos import get_local_dir
from smartem_workspace.utils.git import (
    fetch_remote,
    get_commits_behind,
    get_current_branch,
    has_uncommitted_changes,
    run_git_command,
)

console = Console()


@dataclass
class SyncResult:
    repo_name: str
    org_name: str
    status: Literal["updated", "up-to-date", "error", "skipped", "dry-run"]
    message: str
    commits_behind: int = 0


def sync_single_repo(repo_path: Path, dry_run: bool = False) -> SyncResult:
    repo_name = repo_path.name
    org_name = repo_path.parent.name

    if not (repo_path / ".git").exists():
        return SyncResult(repo_name, org_name, "error", "Not a git repository")

    if has_uncommitted_changes(repo_path):
        return SyncResult(repo_name, org_name, "skipped", "Has uncommitted changes")

    branch = get_current_branch(repo_path)
    if branch and branch not in ("main", "master"):
        return SyncResult(repo_name, org_name, "skipped", f"On branch '{branch}', not main/master")

    if not fetch_remote(repo_path):
        return SyncResult(repo_name, org_name, "error", "Failed to fetch from remote")

    behind = get_commits_behind(repo_path)

    if behind == 0:
        return SyncResult(repo_name, org_name, "up-to-date", "Already up to date")

    if dry_run:
        return SyncResult(repo_name, org_name, "dry-run", f"Would pull {behind} commit(s)", commits_behind=behind)

    returncode, stdout, stderr = run_git_command(["pull", "--ff-only"], cwd=repo_path)

    if returncode == 0:
        return SyncResult(repo_name, org_name, "updated", f"Pulled {behind} commit(s)", commits_behind=behind)

    if "CONFLICT" in stderr or "diverged" in stderr:
        run_git_command(["merge", "--abort"], cwd=repo_path)
        return SyncResult(repo_name, org_name, "error", "Merge conflict, aborted")

    return SyncResult(repo_name, org_name, "error", f"Pull failed: {stderr.strip()[:50]}")


def sync_all_repos(
    workspace_path: Path,
    config: ReposConfig,
    dry_run: bool = False,
) -> list[SyncResult]:
    repos_dir = workspace_path / "repos"
    results = []

    if not repos_dir.exists():
        console.print("[red]repos directory not found[/red]")
        return results

    repo_paths = []
    for org in config.organizations:
        local_dir = get_local_dir(org)
        org_dir = repos_dir / local_dir

        for repo in org.repos:
            repo_path = org_dir / repo.name
            if repo_path.exists():
                repo_paths.append((org.name, repo.name, repo_path))

    if not repo_paths:
        console.print("[yellow]No cloned repositories found[/yellow]")
        return results

    action = "Checking" if dry_run else "Syncing"
    console.print(f"\n[bold]{action} {len(repo_paths)} repositories...[/bold]\n")

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
        transient=True,
    ) as progress:
        task = progress.add_task("Starting...", total=len(repo_paths))

        for org_name, repo_name, repo_path in repo_paths:
            progress.update(task, description=f"{org_name}/{repo_name}")
            result = sync_single_repo(repo_path, dry_run=dry_run)
            results.append(result)
            progress.advance(task)

    return results


def print_sync_results(results: list[SyncResult]) -> None:
    updated = sum(1 for r in results if r.status == "updated")
    up_to_date = sum(1 for r in results if r.status == "up-to-date")
    skipped = sum(1 for r in results if r.status == "skipped")
    errors = sum(1 for r in results if r.status == "error")
    would_update = sum(1 for r in results if r.status == "dry-run")

    for result in results:
        full_name = f"{result.org_name}/{result.repo_name}"

        if result.status == "updated":
            console.print(f"  [green]\u2713[/green] {full_name}: {result.message}")
        elif result.status == "up-to-date":
            console.print(f"  [dim]\u2713 {full_name}: {result.message}[/dim]")
        elif result.status == "dry-run":
            console.print(f"  [cyan]\u2192[/cyan] {full_name}: {result.message}")
        elif result.status == "skipped":
            console.print(f"  [yellow]![/yellow] {full_name}: {result.message}")
        else:
            console.print(f"  [red]\u2717[/red] {full_name}: {result.message}")

    console.print()
    parts = []
    if updated:
        parts.append(f"[green]{updated} updated[/green]")
    if would_update:
        parts.append(f"[cyan]{would_update} would update[/cyan]")
    if up_to_date:
        parts.append(f"{up_to_date} up to date")
    if skipped:
        parts.append(f"[yellow]{skipped} skipped[/yellow]")
    if errors:
        parts.append(f"[red]{errors} errors[/red]")

    console.print(f"Summary: {', '.join(parts)}")
