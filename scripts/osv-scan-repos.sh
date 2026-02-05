#!/usr/bin/env bash
#
# Local OSV vulnerability scanner for ERIC workspace repos
# Scans specified repositories and outputs results to stdout or a file
#
# Usage:
#   ./osv-scan-repos.sh                    # Scan default repos, output to stdout
#   ./osv-scan-repos.sh -o results.md      # Output as markdown to file
#   ./osv-scan-repos.sh repo1 repo2        # Scan specific repo paths
#
# Requirements:
#   - osv-scanner binary in PATH or at ~/.asdf/installs/golang/*/bin/osv-scanner

set -euo pipefail

# Find osv-scanner binary
find_osv_scanner() {
    if command -v osv-scanner &>/dev/null; then
        echo "osv-scanner"
        return
    fi

    # Check asdf golang installations
    local asdf_bin
    asdf_bin=$(find ~/.asdf/installs/golang -name "osv-scanner" -type f 2>/dev/null | head -1)
    if [[ -n "$asdf_bin" ]]; then
        echo "$asdf_bin"
        return
    fi

    echo "ERROR: osv-scanner not found. Install with: go install github.com/google/osv-scanner/cmd/osv-scanner@latest" >&2
    exit 1
}

OSV_SCANNER=$(find_osv_scanner)

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
            echo "If no repos specified, scans all ERIC workspace repos."
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

    echo "Scanning: $repo_name"
    "$OSV_SCANNER" --recursive "$repo_path" 2>&1 || true
}

scan_repo_markdown() {
    local repo_path="$1"
    local repo_name
    repo_name=$(basename "$repo_path")

    if [[ ! -d "$repo_path" ]]; then
        echo "### $repo_name"
        echo ""
        echo "**Status:** Skipped (directory not found)"
        echo ""
        return
    fi

    echo "### $repo_name"
    echo ""

    local output
    output=$("$OSV_SCANNER" --recursive "$repo_path" 2>&1) || true

    if echo "$output" | grep -q "No issues found"; then
        echo "**Status:** Clean - no vulnerabilities found"
    elif echo "$output" | grep -q "OSV URL"; then
        echo "**Status:** Vulnerabilities found"
        echo ""
        echo '```'
        echo "$output" | grep -A1000 "OSV URL" | head -50
        echo '```'
    else
        echo "**Status:** No dependencies detected or scan error"
        echo ""
        echo '```'
        echo "$output" | tail -10
        echo '```'
    fi
    echo ""
}

# Run scans
if [[ -n "$OUTPUT_FILE" ]]; then
    {
        echo "# OSV Scanner Results"
        echo ""
        echo "**Scan date:** $(date -Iseconds)"
        echo ""
        echo "**Scanner version:** $("$OSV_SCANNER" --version 2>&1 | head -1)"
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
