"""MCP server configuration setup."""

import json
from pathlib import Path

import yaml
from rich.console import Console

from smartem_workspace.config.schema import ClaudeCodeConfig

console = Console()


def setup_mcp_config(
    config: ClaudeCodeConfig,
    workspace_path: Path,
    project_name: str = "smartem-workspace",
) -> bool:
    """
    Set up MCP server configuration.

    Creates:
    - .serena/project.yml (Serena-specific config)
    - .mcp.json (all MCP servers from config)

    Returns:
        True if successful
    """
    console.print()
    console.print("[bold]Setting up MCP configuration...[/bold]")

    serena_dir = workspace_path / ".serena"
    serena_dir.mkdir(parents=True, exist_ok=True)

    project_yml_path = serena_dir / "project.yml"
    if not project_yml_path.exists():
        serena_config = {
            "languages": config.serenaConfig.languages,
            "encoding": config.serenaConfig.encoding,
            "ignore_all_files_in_gitignore": config.serenaConfig.ignoreAllFilesInGitignore,
            "project_name": project_name,
        }

        with open(project_yml_path, "w") as f:
            yaml.dump(serena_config, f, default_flow_style=False)

        console.print(f"  [green]Created {project_yml_path.name}[/green]")
    else:
        console.print(f"  [dim]{project_yml_path.name} already exists[/dim]")

    mcp_json_path = workspace_path / ".mcp.json"
    if not mcp_json_path.exists():
        mcp_servers = {}
        for name, server_config in config.mcpConfig.model_dump().items():
            if not isinstance(server_config, dict) or "command" not in server_config:
                continue
            mcp_servers[name] = {
                "command": server_config["command"],
                "args": [arg.replace("${PWD}", str(workspace_path)) for arg in server_config.get("args", [])],
            }

        mcp_json_path.write_text(json.dumps({"mcpServers": mcp_servers}, indent=2))
        console.print(f"  [green]Created {mcp_json_path.name} ({len(mcp_servers)} servers)[/green]")
    else:
        console.print(f"  [dim]{mcp_json_path.name} already exists[/dim]")

    console.print("[green]MCP configuration complete[/green]")
    return True
