"""CLI commands for smartem-workspace."""

from pathlib import Path
from typing import Annotated

import typer
from rich.console import Console

from smartem_workspace.config.loader import load_config
from smartem_workspace.setup.bootstrap import bootstrap_workspace

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

    console.print(f"[bold blue]SmartEM Workspace Setup[/bold blue]")
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
def sync() -> None:
    """Sync existing repos (git pull)."""
    console.print("[yellow]Not implemented yet[/yellow]")
    raise typer.Exit(1)


@app.command()
def status() -> None:
    """Show workspace status."""
    console.print("[yellow]Not implemented yet[/yellow]")
    raise typer.Exit(1)


@app.command()
def add(
    repo: Annotated[str, typer.Argument(help="Repository to add (e.g., DiamondLightSource/smartem-frontend)")],
) -> None:
    """Add a single repository to the workspace."""
    console.print(f"[yellow]Not implemented yet: {repo}[/yellow]")
    raise typer.Exit(1)


if __name__ == "__main__":
    app()
