#!/usr/bin/env bash
set -euo pipefail

# E2E Test Runner for SmartEM Decisions
# This script automates the e2e test execution for the SmartEM Agent
#
# Run from workspace root:
#   ./repos/DiamondLightSource/smartem-devtools/tools/e2e/run-e2e-test.sh
#
# Or with arguments:
#   ./repos/DiamondLightSource/smartem-devtools/tools/e2e/run-e2e-test.sh <recording> <epu_dir> <max_delay>

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"

# smartem-decisions repo location
SMARTEM_DECISIONS_DIR="$WORKSPACE_ROOT/repos/DiamondLightSource/smartem-decisions"

# Defaults assume multi-repo workspace structure:
#   <workspace>/testdata/recordings/                   (test recordings)
#   <workspace>/tmp/                                   (scratch space)
# Override with env vars: SMARTEM_TEST_RECORDING, SMARTEM_EPU_DIR
DEFAULT_RECORDING="$WORKSPACE_ROOT/testdata/recordings/bi37708-42_fsrecord.tar.gz"
DEFAULT_EPU_DIR="$WORKSPACE_ROOT/tmp/epu-test-dir"

RECORDING="${1:-${SMARTEM_TEST_RECORDING:-$DEFAULT_RECORDING}}"
EPU_DIR="${2:-${SMARTEM_EPU_DIR:-$DEFAULT_EPU_DIR}}"
MAX_DELAY="${3:-0.1}"
TEST_DIR="$WORKSPACE_ROOT/tmp/e2e-logs/$(date +%Y-%m-%d_%H%M%S)_pre-acquisition-test"

echo "===== SmartEM E2E Test Runner ====="
echo "Recording: $RECORDING"
echo "EPU Directory: $EPU_DIR"
echo "Max Delay: ${MAX_DELAY}s"
echo "Test Results: $TEST_DIR"
echo "smartem-decisions: $SMARTEM_DECISIONS_DIR"
echo "===================================="

cleanup() {
    echo ""
    echo "Cleaning up background processes..."
    pkill -f "smartem_backend|smartem_agent|fsrecorder|uvicorn" || true
    echo "Cleaning up playback data directory..."
    rm -rf "$EPU_DIR" || true
    echo "Cleanup complete"
}

trap cleanup EXIT

echo ""
echo "[1/9] Setting up test environment..."
mkdir -p "$TEST_DIR/logs"
mkdir -p "$EPU_DIR"
rm -rf "$EPU_DIR"/*

echo "[2/9] Activating virtual environment..."
source "$SMARTEM_DECISIONS_DIR/.venv/bin/activate"

echo "[3/9] Loading environment variables..."
set -a
source "$WORKSPACE_ROOT/.env.local-test-run"
set +a

echo "[4/9] Resetting database..."
cd "$SMARTEM_DECISIONS_DIR"
python -m smartem_backend.model.database

echo "[5/10] Running database migrations..."
python -m alembic upgrade head

echo "[6/10] Checking if port 8000 is free..."
if lsof -ti:8000 >/dev/null 2>&1; then
    echo "ERROR: Port 8000 is already in use!"
    echo "Killing process on port 8000..."
    lsof -ti:8000 | xargs kill -9
    sleep 2
fi

python -m uvicorn smartem_backend.api_server:app \
    --host 127.0.0.1 --port 8000 --log-level debug \
    > "$TEST_DIR/logs/api.log" 2>&1 &
API_PID=$!
sleep 3

if ! curl -s http://127.0.0.1:8000/health >/dev/null 2>&1; then
    echo "ERROR: API failed to start! Check $TEST_DIR/logs/api.log"
    tail -20 "$TEST_DIR/logs/api.log"
    exit 1
fi
echo "API started successfully"

python -m smartem_backend.consumer -vv \
    > "$TEST_DIR/logs/consumer.log" 2>&1 &
CONSUMER_PID=$!
sleep 2

python -m smartem_agent watch \
    --api-url http://localhost:8000 \
    -vv \
    "$EPU_DIR" \
    > "$TEST_DIR/logs/agent.log" 2>&1 &
AGENT_PID=$!
sleep 2

python "$TOOLS_DIR/fsrecorder/fsrecorder.py" replay \
    --max-delay "$MAX_DELAY" \
    "$RECORDING" \
    "$EPU_DIR" \
    > "$TEST_DIR/logs/playback.log" 2>&1

echo "Playback complete. Waiting for agent to finish processing (60 seconds)..."
sleep 60

echo ""
echo "===== Test Results ====="

echo "Filesystem Counts:"
EPU_SESSIONS=$(find "$EPU_DIR" -name "EpuSession.dm" 2>/dev/null | wc -l)
GRIDSQUARES=$(find "$EPU_DIR" -type d -name "GridSquare_*" 2>/dev/null | wc -l)
echo "  EPU Sessions: $EPU_SESSIONS"
echo "  GridSquare directories: $GRIDSQUARES"

echo ""
echo "Database Counts:"
python -c "
import requests
try:
    acq_response = requests.get('http://127.0.0.1:8000/acquisitions')
    acquisitions = acq_response.json()
    if acquisitions:
        acq_uuid = acquisitions[0]['uuid']
        stats_response = requests.get(f'http://127.0.0.1:8000/acquisitions/{acq_uuid}/stats')
        stats = stats_response.json()
        print(f'  Acquisitions: {len(acquisitions)}')
        print(f'  Grids: {stats.get(\"grids\", 0)}')
        print(f'  Grid Squares: {stats.get(\"gridsquares\", 0)}')
        print(f'  Foil Holes: {stats.get(\"foilholes\", 0)}')
    else:
        print('  No acquisitions found')
except Exception as e:
    print(f'  Error: {e}')
"

echo ""
echo "Test completed. Results saved to: $TEST_DIR"
echo "Agent log: $TEST_DIR/logs/agent.log"
echo ""

AGENT_LOG_SIZE=$(wc -c < "$TEST_DIR/logs/agent.log")
if [ "$AGENT_LOG_SIZE" -lt 1000 ]; then
    echo "WARNING: Agent log is very small ($AGENT_LOG_SIZE bytes) - agent may have failed to start!"
    echo "Check $TEST_DIR/logs/agent.log for errors"
fi
