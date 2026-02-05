#!/usr/bin/env bash
#
# Local pip-audit vulnerability scanner for ERIC workspace repos (Python only)
# Scans specified repositories and outputs results to stdout or a file
# Uses uvx to run pip-audit without permanent installation
#
# Usage:
#   ./pip-audit-scan-repos.sh                    # Scan default repos, output to stdout
#   ./pip-audit-scan-repos.sh -o results.md      # Output as markdown to file
#   ./pip-audit-scan-repos.sh repo1 repo2        # Scan specific repo paths
#
# Requirements:
#   - uvx (from uv package manager)

set -euo pipefail

# Default repos relative to ERIC workspace root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ERIC_ROOT="${SCRIPT_DIR}/../../../.."

# Discover all repos in ERIC workspace (repos/*/* directories with .git)
discover_repos() {
    local repos_dir="${ERIC_ROOT}/repos"
    if [[ -d "$repos_dir" ]]; then
        find "$repos_dir" -mindepth 2 -maxdepth 2 -type d -exec test -d '{}/.git' \; -print | sort
    fi
}

OUTPUT_FILE=""
REPOS=()

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [-o output.md] [repo_path ...]"
            echo ""
            echo "Options:"
            echo "  -o, --output FILE   Write results to FILE (markdown format)"
            echo "  -h, --help          Show this help"
            echo ""
            echo "If no repos specified, scans all ERIC workspace Python repos."
            echo "Note: Only scans Python repos with requirements.txt files."
            exit 0
            ;;
        *)
            REPOS+=("$1")
            shift
            ;;
    esac
done

# Use discovered repos if none specified
if [[ ${#REPOS[@]} -eq 0 ]]; then
    while IFS= read -r repo; do
        REPOS+=("$repo")
    done < <(discover_repos)
fi

scan_repo() {
    local repo_path="$1"
    local repo_name
    repo_name=$(basename "$repo_path")

    if [[ ! -d "$repo_path" ]]; then
        echo "SKIP: $repo_name (directory not found)"
        return
    fi

    if [[ ! -f "$repo_path/requirements.txt" ]]; then
        echo "SKIP: $repo_name (no requirements.txt)"
        return
    fi

    echo "Scanning: $repo_name"
    uvx pip-audit -r "$repo_path/requirements.txt" 2>&1 || true
}

scan_repo_markdown() {
    local repo_path="$1"
    local repo_name
    repo_name=$(basename "$repo_path")

    echo "### $repo_name"
    echo ""

    if [[ ! -d "$repo_path" ]]; then
        echo "**Status:** Skipped (directory not found)"
        echo ""
        return
    fi

    if [[ ! -f "$repo_path/requirements.txt" ]]; then
        echo "**Status:** Skipped (no requirements.txt - not a Python project or uses different dep format)"
        echo ""
        return
    fi

    local output
    output=$(uvx pip-audit -r "$repo_path/requirements.txt" 2>&1) || true

    if echo "$output" | grep -q "No known vulnerabilities found"; then
        echo "**Status:** Clean - no vulnerabilities found"
    elif echo "$output" | grep -q "found [0-9]* known vulnerabilit"; then
        local vuln_count
        vuln_count=$(echo "$output" | grep -oP "found \K[0-9]+" | head -1)
        echo "**Status:** $vuln_count vulnerabilities found"
        echo ""
        echo '```'
        echo "$output"
        echo '```'
    else
        echo "**Status:** Scan completed"
        echo ""
        echo '```'
        echo "$output"
        echo '```'
    fi
    echo ""
}

# Run scans
if [[ -n "$OUTPUT_FILE" ]]; then
    {
        echo "# pip-audit Scanner Results"
        echo ""
        echo "**Scan date:** $(date -Iseconds)"
        echo ""
        echo "**Scanner:** pip-audit (via uvx)"
        echo ""
        echo "**Note:** pip-audit only scans Python dependencies (requirements.txt). PHP repos are skipped."
        echo ""
        echo "---"
        echo ""

        for repo in "${REPOS[@]}"; do
            scan_repo_markdown "$repo"
        done
    } > "$OUTPUT_FILE"

    echo "Results written to: $OUTPUT_FILE"
else
    for repo in "${REPOS[@]}"; do
        echo "========================================"
        scan_repo "$repo"
        echo ""
    done
fi
