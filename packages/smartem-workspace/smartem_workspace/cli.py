"""CLI commands for smartem-workspace."""

from pathlib import Path
from typing import Annotated

import typer
from rich.console import Console

from smartem_workspace.commands.check import (
    CheckScope,
    apply_fixes,
    print_report,
    run_checks,
)
from smartem_workspace.commands.sync import print_sync_results, sync_all_repos
from smartem_workspace.config.loader import load_config
from smartem_workspace.setup.bootstrap import bootstrap_workspace
from smartem_workspace.utils.paths import find_workspace_root

app = typer.Typer(
    name="smartem-workspace",
    help="CLI tool to automate SmartEM multi-repo workspace setup",
    no_args_is_help=True,
)
console = Console()


@app.command()
def init(
    path: Annotated[
        Path | None,
        typer.Option("--path", "-p", help="Target directory for workspace"),
    ] = None,
    preset: Annotated[
        str | None,
        typer.Option("--preset", help="Use preset: smartem-core, full, aria-reference, minimal"),
    ] = None,
    interactive: Annotated[
        bool,
        typer.Option("--interactive/--no-interactive", help="Enable/disable interactive prompts"),
    ] = True,
    ssh: Annotated[
        bool,
        typer.Option("--ssh", help="Use SSH URLs instead of HTTPS"),
    ] = False,
    skip_claude: Annotated[
        bool,
        typer.Option("--skip-claude", help="Skip Claude Code setup"),
    ] = False,
    skip_serena: Annotated[
        bool,
        typer.Option("--skip-serena", help="Skip Serena MCP setup"),
    ] = False,
) -> None:
    """Initialize a new SmartEM workspace."""
    workspace_path = path or Path.cwd()

    console.print("[bold blue]SmartEM Workspace Setup[/bold blue]")
    console.print(f"Target: {workspace_path.absolute()}")

    config = load_config()
    if config is None:
        console.print("[red]Failed to load configuration[/red]")
        raise typer.Exit(1)

    bootstrap_workspace(
        config=config,
        workspace_path=workspace_path,
        preset=preset,
        interactive=interactive,
        use_ssh=ssh,
        skip_claude=skip_claude,
        skip_serena=skip_serena,
    )


@app.command()
def check(
    scope: Annotated[
        str | None,
        typer.Option("--scope", "-s", help="Check scope: claude, repos, serena, or all"),
    ] = None,
    fix: Annotated[
        bool,
        typer.Option("--fix", help="Attempt to fix issues"),
    ] = False,
    path: Annotated[
        Path | None,
        typer.Option("--path", "-p", help="Workspace path (auto-detected if not specified)"),
    ] = None,
    offline: Annotated[
        bool,
        typer.Option("--offline", help="Use bundled config instead of fetching from GitHub"),
    ] = False,
) -> None:
    """Verify workspace setup and optionally repair issues."""
    workspace_path = path or find_workspace_root()
    if workspace_path is None:
        console.print("[red]Could not find workspace root. Run from within a workspace or specify --path.[/red]")
        raise typer.Exit(1)

    config = load_config(offline=offline)
    if config is None:
        console.print("[red]Failed to load configuration[/red]")
        raise typer.Exit(1)

    check_scope = CheckScope.ALL
    if scope:
        try:
            check_scope = CheckScope(scope.lower())
        except ValueError:
            console.print(f"[red]Invalid scope: {scope}. Use: claude, repos, serena, or all[/red]")
            raise typer.Exit(1) from None

    console.print(f"[bold]Checking workspace at {workspace_path}...[/bold]")
    reports = run_checks(workspace_path, config, check_scope)

    for report in reports:
        print_report(report)

    total_errors = sum(r.has_errors for r in reports)
    total_warnings = sum(r.has_warnings for r in reports)
    total_fixable = sum(r.fixable_count for r in reports)

    console.print()
    if total_errors or total_warnings:
        parts = []
        if total_errors:
            parts.append(f"[red]{total_errors} error(s)[/red]")
        if total_warnings:
            parts.append(f"[yellow]{total_warnings} warning(s)[/yellow]")
        console.print(f"Summary: {', '.join(parts)}")

        if fix and total_fixable:
            console.print("\n[bold]Applying fixes...[/bold]")
            fixed, failed = apply_fixes(workspace_path, reports)
            console.print(f"\nFixed {fixed} issue(s), {failed} failed")
            if failed:
                raise typer.Exit(1)
        elif total_fixable and not fix:
            console.print(f"\n[dim]{total_fixable} issue(s) can be fixed with --fix[/dim]")
            raise typer.Exit(1)
        else:
            raise typer.Exit(1)
    else:
        console.print("[green]All checks passed![/green]")


@app.command()
def sync(
    dry_run: Annotated[
        bool,
        typer.Option("--dry-run", "-n", help="Show what would be done without making changes"),
    ] = False,
    path: Annotated[
        Path | None,
        typer.Option("--path", "-p", help="Workspace path (auto-detected if not specified)"),
    ] = None,
) -> None:
    """Pull latest changes from all cloned repositories."""
    workspace_path = path or find_workspace_root()
    if workspace_path is None:
        console.print("[red]Could not find workspace root. Run from within a workspace or specify --path.[/red]")
        raise typer.Exit(1)

    config = load_config()
    if config is None:
        console.print("[red]Failed to load configuration[/red]")
        raise typer.Exit(1)

    console.print("[bold blue]SmartEM Workspace Sync[/bold blue]")
    console.print(f"Workspace: {workspace_path}")

    results = sync_all_repos(workspace_path, config, dry_run=dry_run)
    print_sync_results(results)

    errors = sum(1 for r in results if r.status == "error")
    if errors:
        raise typer.Exit(1)

    if dry_run:
        would_update = sum(1 for r in results if r.status == "dry-run")
        if would_update:
            console.print("\n[dim]Run without --dry-run to apply changes[/dim]")


@app.command()
def status(
    path: Annotated[
        Path | None,
        typer.Option("--path", "-p", help="Workspace path"),
    ] = None,
) -> None:
    """Show workspace status (alias for check --scope all)."""
    workspace_path = path or find_workspace_root()
    if workspace_path is None:
        console.print("[red]Could not find workspace root.[/red]")
        raise typer.Exit(1)

    config = load_config()
    if config is None:
        console.print("[red]Failed to load configuration[/red]")
        raise typer.Exit(1)

    console.print(f"[bold]Workspace Status: {workspace_path}[/bold]")
    reports = run_checks(workspace_path, config, CheckScope.ALL)

    for report in reports:
        print_report(report)


@app.command()
def add(
    repo: Annotated[str, typer.Argument(help="Repository to add (e.g., DiamondLightSource/smartem-frontend)")],
) -> None:
    """Add a single repository to the workspace."""
    console.print(f"[yellow]Not implemented yet: {repo}[/yellow]")
    raise typer.Exit(1)


if __name__ == "__main__":
    app()
