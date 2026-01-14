"""Workspace verification and repair command."""

import json
import os
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Literal

import httpx
from rich.console import Console

from smartem_workspace.config.schema import ReposConfig
from smartem_workspace.setup.repos import get_local_dir

console = Console()


class CheckScope(str, Enum):
    ALL = "all"
    CLAUDE = "claude"
    REPOS = "repos"
    SERENA = "serena"
    PREREQS = "prereqs"


@dataclass
class CheckResult:
    name: str
    status: Literal["ok", "warning", "error"]
    message: str
    fixable: bool = False
    fix_data: dict = field(default_factory=dict)


@dataclass
class CheckReport:
    scope: str
    results: list[CheckResult]

    @property
    def has_errors(self) -> bool:
        return any(r.status == "error" for r in self.results)

    @property
    def has_warnings(self) -> bool:
        return any(r.status == "warning" for r in self.results)

    @property
    def fixable_count(self) -> int:
        return sum(1 for r in self.results if r.fixable)


def check_devtools_present(workspace_path: Path) -> CheckResult:
    devtools_path = workspace_path / "repos" / "DiamondLightSource" / "smartem-devtools"
    if devtools_path.exists() and (devtools_path / ".git").exists():
        return CheckResult("smartem-devtools", "ok", "Present and valid")
    if devtools_path.exists():
        return CheckResult("smartem-devtools", "error", "Directory exists but not a git repo")
    return CheckResult(
        "smartem-devtools",
        "error",
        "Not cloned (required for configuration)",
        fixable=False,
    )


def check_symlink(link_path: Path, expected_target: Path, name: str) -> CheckResult:
    if not link_path.exists() and not link_path.is_symlink():
        return CheckResult(
            name,
            "warning",
            "Missing",
            fixable=True,
            fix_data={"link": str(link_path), "target": str(expected_target)},
        )

    if link_path.is_symlink():
        actual_target = link_path.resolve()
        if actual_target == expected_target.resolve():
            return CheckResult(name, "ok", "Valid symlink")
        return CheckResult(
            name,
            "warning",
            "Points to wrong target",
            fixable=True,
            fix_data={"link": str(link_path), "target": str(expected_target)},
        )

    if link_path.is_file():
        return CheckResult(name, "ok", "Present as file (acceptable)")

    return CheckResult(name, "warning", "Unexpected state", fixable=False)


def check_file_exists(file_path: Path, name: str) -> CheckResult:
    if file_path.exists():
        return CheckResult(name, "ok", "Present")
    return CheckResult(name, "warning", f"Missing: {file_path.name}", fixable=False)


def check_json_valid(file_path: Path, name: str) -> CheckResult:
    if not file_path.exists():
        return CheckResult(name, "warning", "File missing", fixable=False)
    try:
        json.loads(file_path.read_text())
        return CheckResult(name, "ok", "Valid JSON")
    except json.JSONDecodeError as e:
        return CheckResult(name, "error", f"Invalid JSON: {e}")


def check_git_prerequisite() -> CheckResult:
    """Check git is available and get version."""
    git_path = shutil.which("git")
    if not git_path:
        return CheckResult("git", "error", "Not found in PATH")

    try:
        result = subprocess.run(
            ["git", "--version"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode == 0:
            version = result.stdout.strip()
            return CheckResult("git", "ok", version)
        return CheckResult("git", "error", "Failed to get version")
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return CheckResult("git", "error", "Failed to execute")


def check_python_version() -> CheckResult:
    """Check Python version is 3.11+."""
    version = sys.version_info
    version_str = f"{version.major}.{version.minor}.{version.micro}"

    if version.major == 3 and version.minor >= 11:
        return CheckResult("Python", "ok", f"{version_str} (3.11+ required)")

    return CheckResult("Python", "error", f"{version_str} (3.11+ required)")


def check_uv_available() -> CheckResult:
    """Check uv is available (warning if missing, not error)."""
    uv_path = shutil.which("uv")
    if not uv_path:
        return CheckResult("uv", "warning", "Not found (recommended for installation)")

    try:
        result = subprocess.run(
            ["uv", "--version"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode == 0:
            version = result.stdout.strip()
            return CheckResult("uv", "ok", version)
        return CheckResult("uv", "warning", "Found but failed to get version")
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return CheckResult("uv", "warning", "Found but failed to execute")


def check_network_connectivity() -> CheckResult:
    """Check can reach GitHub."""
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.head("https://github.com")
            if response.status_code < 400:
                return CheckResult("Network", "ok", "GitHub reachable")
            return CheckResult("Network", "warning", f"GitHub returned {response.status_code}")
    except httpx.RequestError:
        return CheckResult("Network", "warning", "Cannot reach GitHub (offline mode available)")


def run_prereqs_checks() -> CheckReport:
    """Run all prerequisite checks."""
    results = [
        check_git_prerequisite(),
        check_python_version(),
        check_uv_available(),
        check_network_connectivity(),
    ]
    return CheckReport("prerequisites", results)


def run_claude_checks(workspace_path: Path, config: ReposConfig) -> CheckReport:
    results = []
    devtools_path = workspace_path / "repos" / "DiamondLightSource" / "smartem-devtools"

    results.append(check_devtools_present(workspace_path))

    claude_config_link = workspace_path / "claude-config"
    claude_config_target = devtools_path / "claude-code"
    results.append(check_symlink(claude_config_link, claude_config_target, "claude-config symlink"))

    claude_md_link = workspace_path / "CLAUDE.md"
    claude_md_target = devtools_path / "claude-code" / "CLAUDE.md"
    results.append(check_symlink(claude_md_link, claude_md_target, "CLAUDE.md"))

    skills_dir = workspace_path / ".claude" / "skills"
    if not skills_dir.exists():
        results.append(
            CheckResult(
                ".claude/skills directory",
                "warning",
                "Missing",
                fixable=True,
                fix_data={"mkdir": str(skills_dir)},
            )
        )
    else:
        results.append(CheckResult(".claude/skills directory", "ok", "Present"))

    for skill in config.claudeConfig.skills:
        skill_link = skills_dir / skill.name
        skill_target = devtools_path / skill.path
        results.append(check_symlink(skill_link, skill_target, f"skill: {skill.name}"))

    settings_path = workspace_path / ".claude" / "settings.local.json"
    if settings_path.exists():
        results.append(check_json_valid(settings_path, "settings.local.json"))
    else:
        results.append(CheckResult("settings.local.json", "warning", "Missing (not auto-fixable)", fixable=False))

    return CheckReport("claude", results)


def run_serena_checks(workspace_path: Path) -> CheckReport:
    results = []

    serena_dir = workspace_path / ".serena"
    if serena_dir.exists():
        results.append(CheckResult(".serena directory", "ok", "Present"))
    else:
        results.append(CheckResult(".serena directory", "warning", "Missing", fixable=False))

    project_yml = workspace_path / ".serena" / "project.yml"
    results.append(check_file_exists(project_yml, ".serena/project.yml"))

    mcp_json = workspace_path / ".mcp.json"
    if mcp_json.exists():
        results.append(check_json_valid(mcp_json, ".mcp.json"))
    else:
        results.append(CheckResult(".mcp.json", "warning", "Missing", fixable=False))

    return CheckReport("serena", results)


def run_repos_checks(workspace_path: Path, config: ReposConfig) -> CheckReport:
    results = []
    repos_dir = workspace_path / "repos"

    if not repos_dir.exists():
        results.append(CheckResult("repos directory", "error", "Missing"))
        return CheckReport("repos", results)

    results.append(CheckResult("repos directory", "ok", "Present"))

    for org in config.organizations:
        local_dir = get_local_dir(org)
        org_dir = repos_dir / local_dir

        for repo in org.repos:
            repo_path = org_dir / repo.name
            full_name = f"{org.name}/{repo.name}"

            if not repo_path.exists():
                results.append(CheckResult(full_name, "warning", "Not cloned", fixable=False))
                continue

            if not (repo_path / ".git").exists():
                results.append(CheckResult(full_name, "error", "Not a git repository"))
                continue

            results.append(CheckResult(full_name, "ok", "Cloned"))

    return CheckReport("repos", results)


def run_checks(
    workspace_path: Path | None,
    config: ReposConfig | None,
    scope: CheckScope = CheckScope.ALL,
) -> list[CheckReport]:
    reports = []

    if scope in (CheckScope.ALL, CheckScope.PREREQS):
        reports.append(run_prereqs_checks())

    if scope in (CheckScope.ALL, CheckScope.CLAUDE) and workspace_path and config:
        reports.append(run_claude_checks(workspace_path, config))

    if scope in (CheckScope.ALL, CheckScope.SERENA) and workspace_path:
        reports.append(run_serena_checks(workspace_path))

    if scope in (CheckScope.ALL, CheckScope.REPOS) and workspace_path and config:
        reports.append(run_repos_checks(workspace_path, config))

    return reports


def apply_fixes(workspace_path: Path, reports: list[CheckReport]) -> tuple[int, int]:
    fixed = 0
    failed = 0

    for report in reports:
        for result in report.results:
            if not result.fixable or result.status == "ok":
                continue

            fix_data = result.fix_data

            if "mkdir" in fix_data:
                try:
                    Path(fix_data["mkdir"]).mkdir(parents=True, exist_ok=True)
                    console.print(f"  [green]Created directory: {fix_data['mkdir']}[/green]")
                    fixed += 1
                except OSError as e:
                    console.print(f"  [red]Failed to create directory: {e}[/red]")
                    failed += 1

            elif "link" in fix_data and "target" in fix_data:
                link_path = Path(fix_data["link"])
                target_path = Path(fix_data["target"])

                try:
                    if link_path.is_symlink():
                        link_path.unlink()

                    link_path.parent.mkdir(parents=True, exist_ok=True)

                    if target_path.exists():
                        os.symlink(str(target_path.resolve()), str(link_path))
                        console.print(f"  [green]Created symlink: {link_path.name}[/green]")
                        fixed += 1
                    else:
                        console.print(f"  [yellow]Target does not exist: {target_path}[/yellow]")
                        failed += 1
                except OSError as e:
                    console.print(f"  [red]Failed to create symlink: {e}[/red]")
                    failed += 1

    return fixed, failed


def print_report(report: CheckReport) -> None:
    console.print(f"\n[bold]{report.scope.title()} Configuration:[/bold]")

    for result in report.results:
        if result.status == "ok":
            icon = "[green]\u2713[/green]"
        elif result.status == "warning":
            icon = "[yellow]![/yellow]"
        else:
            icon = "[red]\u2717[/red]"

        fixable_note = " [dim](fixable)[/dim]" if result.fixable and result.status != "ok" else ""
        console.print(f"  {icon} {result.name}: {result.message}{fixable_note}")
