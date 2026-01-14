"""Configuration loading with network-first, bundled fallback strategy."""

import json
from importlib import resources
from pathlib import Path

import httpx
from rich.console import Console

from smartem_workspace.config.schema import ReposConfig

GITHUB_RAW_URL = "https://raw.githubusercontent.com/DiamondLightSource/smartem-devtools/main/core/repos.json"
REQUEST_TIMEOUT = 10.0

console = Console()


def load_from_network() -> dict | None:
    """Attempt to load config from GitHub."""
    try:
        with httpx.Client(timeout=REQUEST_TIMEOUT) as client:
            response = client.get(GITHUB_RAW_URL)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        console.print(f"[dim]Network fetch failed: {e}[/dim]")
        return None
    except json.JSONDecodeError as e:
        console.print(f"[dim]Invalid JSON from network: {e}[/dim]")
        return None


def load_from_bundled() -> dict | None:
    """Load bundled fallback config."""
    try:
        config_path = resources.files("smartem_workspace.config").joinpath("repos.json")
        with resources.as_file(config_path) as path:
            if path.exists():
                return json.loads(path.read_text())
    except Exception as e:
        console.print(f"[dim]Bundled config load failed: {e}[/dim]")

    return None


def load_from_file(path: Path) -> dict | None:
    """Load config from a local file path."""
    try:
        return json.loads(path.read_text())
    except Exception as e:
        console.print(f"[dim]File load failed: {e}[/dim]")
        return None


def load_config(local_path: Path | None = None, offline: bool = False) -> ReposConfig | None:
    """
    Load workspace configuration.

    Strategy:
    1. If local_path provided, use that
    2. If offline, use bundled config
    3. Try network (GitHub raw)
    4. Fall back to bundled config

    Args:
        local_path: Path to local config file
        offline: Skip network fetch, use bundled config

    Returns:
        ReposConfig if successful, None otherwise
    """
    config_dict: dict | None = None

    if local_path:
        console.print(f"[dim]Loading config from: {local_path}[/dim]")
        config_dict = load_from_file(local_path)
    elif offline:
        console.print("[dim]Using bundled config (offline mode)[/dim]")
        config_dict = load_from_bundled()
    else:
        console.print("[dim]Fetching latest config from GitHub...[/dim]")
        config_dict = load_from_network()

        if config_dict is None:
            console.print("[dim]Using bundled fallback config[/dim]")
            config_dict = load_from_bundled()

    if config_dict is None:
        console.print("[red]Failed to load configuration from any source[/red]")
        return None

    try:
        return ReposConfig.model_validate(config_dict)
    except Exception as e:
        console.print(f"[red]Configuration validation failed: {e}[/red]")
        return None
