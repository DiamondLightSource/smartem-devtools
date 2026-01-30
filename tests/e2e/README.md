# SmartEM E2E Tests

End-to-end tests for the SmartEM data ingestion pipeline, simulating microscope data collection using recorded EPU sessions.

## Overview

These tests validate the complete data flow:

```
EPUPlayer (replay) -> Agent (watch) -> API Server -> Database
                                    -> Consumer (RabbitMQ events)
```

The tests use pre-recorded EPU filesystem snapshots that are replayed at accelerated speed to simulate microscope output.

## Prerequisites

### 1. Local Kubernetes Cluster

A running k3s/k8s cluster with SmartEM infrastructure:

```bash
# Verify cluster is running
kubectl get pods -n smartem-decisions

# Expected services on NodePorts:
# - PostgreSQL: localhost:30432
# - RabbitMQ: localhost:30672 (AMQP), localhost:30673 (management)
# - Adminer: localhost:30808
```

### 2. Environment Configuration

Create `.env.local-test-run` in the workspace root:

```bash
# Database connection (k8s NodePort)
POSTGRES_HOST=localhost
POSTGRES_PORT=30432
POSTGRES_DB=smartem_db
POSTGRES_USER=<username>
POSTGRES_PASSWORD=<password>

# RabbitMQ connection (k8s NodePort)
RABBITMQ_HOST=localhost
RABBITMQ_PORT=30672
RABBITMQ_USER=<username>
RABBITMQ_PASSWORD=<password>

# API configuration
HTTP_API_PORT=8000
CORS_ALLOWED_ORIGINS=*
```

### 3. Test Recordings

EPU recordings in `testdata/recordings/`:

| Recording | Size | Description |
|-----------|------|-------------|
| `bi37708-42_epurecording.tar.gz` | 7.5 GB | Smaller, faster for quick tests |
| `bi37600-29_epurecording.tar.gz` | 14 GB | Larger, more comprehensive |

### 4. Dependencies

From `smartem-decisions` directory:
```bash
uv sync --all-extras
```

## Quick Start

### Automated Test (Single Microscope)

```bash
# From workspace root
./repos/DiamondLightSource/smartem-devtools/tests/e2e/run-e2e-test.sh

# With custom parameters
./repos/DiamondLightSource/smartem-devtools/tests/e2e/run-e2e-test.sh \
    testdata/recordings/bi37708-42_epurecording.tar.gz \
    tmp/epu-test-dir \
    0.1  # max delay between events (seconds)
```

### Automated Test (Multiple Microscopes)

```bash
# Simulate 3 concurrent microscopes
./repos/DiamondLightSource/smartem-devtools/tests/e2e/run-e2e-test-multi-microscope.sh 3
```

## Manual Test Execution

For debugging or when you need more control over individual components.

### 1. Load Environment

```bash
set -a && source .env.local-test-run && set +a
```

### 2. Reset Database (Optional)

```bash
cd repos/DiamondLightSource/smartem-decisions

# Reset schema
POSTGRES_DB=postgres uv run python -m smartem_backend.model.database

# Run migrations
uv run python -m alembic upgrade head
```

### 3. Start API Server

```bash
uv run python -m uvicorn smartem_backend.api_server:app \
    --host 127.0.0.1 --port 8000 --log-level debug
```

Verify: `curl http://localhost:8000/health`

### 4. Start Consumer

```bash
uv run python -m smartem_backend.consumer -vv
```

### 5. Start Agent

```bash
# Using local development install
uv run python -m smartem_agent watch \
    --api-url http://localhost:8000 \
    -vv \
    /path/to/epu-output-dir

# Using PyPI package (requires Python 3.12+)
uvx --python 3.12 --from "smartem-decisions[agent]" smartem-agent watch \
    --api-url http://localhost:8000 \
    -vv \
    /path/to/epu-output-dir
```

### 6. Run Playback

```bash
# Using local development install
uv run epuplayer replay \
    --max-delay 0.1 \
    testdata/recordings/bi37708-42_epurecording.tar.gz \
    /path/to/epu-output-dir

# Using PyPI package
uvx --from smartem-epuplayer epuplayer replay \
    --max-delay 0.1 \
    testdata/recordings/bi37708-42_epurecording.tar.gz \
    /path/to/epu-output-dir
```

## Verifying Results

### API Health Check

```bash
curl -s http://localhost:8000/health | python3 -m json.tool
```

### Database Counts

```bash
# Via API
curl -s http://localhost:8000/acquisitions

# Via direct database query
PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p 30432 \
    -U $POSTGRES_USER -d smartem_db -c "
SELECT
    (SELECT COUNT(*) FROM acquisition) as acquisitions,
    (SELECT COUNT(*) FROM grid) as grids,
    (SELECT COUNT(*) FROM gridsquare) as gridsquares,
    (SELECT COUNT(*) FROM foilhole) as foilholes,
    (SELECT COUNT(*) FROM micrograph) as micrographs;
"

# Via Python (if psql not available)
uv run python -c "
import os
from sqlalchemy import create_engine, text

url = f\"postgresql://{os.environ['POSTGRES_USER']}:{os.environ['POSTGRES_PASSWORD']}@{os.environ['POSTGRES_HOST']}:{os.environ['POSTGRES_PORT']}/{os.environ['POSTGRES_DB']}\"
engine = create_engine(url)
with engine.connect() as conn:
    for table in ['acquisition', 'grid', 'gridsquare', 'foilhole', 'micrograph']:
        count = conn.execute(text(f'SELECT COUNT(*) FROM {table}')).scalar()
        print(f'{table}: {count}')
"
```

### Expected Results (bi37708-42 Recording)

| Entity | Expected Count |
|--------|----------------|
| Acquisitions | 1 |
| Grids | 6 |
| Grid Squares | ~1500 |
| Foil Holes | ~6400 |
| Micrographs | ~150 |

## Log Analysis

Test logs are saved to `tmp/e2e-logs/<timestamp>_<test-type>/logs/`:

| Log File | Content |
|----------|---------|
| `api.log` | API server requests and responses |
| `consumer.log` | RabbitMQ message processing |
| `agent.log` | File watching and API calls |
| `playback.log` | EPUPlayer replay progress |

### Checking for Errors

```bash
# Count errors by log file
for log in tmp/e2e-logs/*/logs/*.log; do
    errors=$(grep -c "ERROR" "$log" 2>/dev/null || echo 0)
    echo "$log: $errors errors"
done

# View specific error types
grep "ERROR" tmp/e2e-logs/*/logs/agent.log | head -20
grep "ERROR" tmp/e2e-logs/*/logs/consumer.log | head -20
```

## Known Issues

### 1. RabbitMQ Heartbeat Timeout

**Symptom:** Connection reset after ~3 minutes during high-speed playback.

**Cause:** RabbitMQ closes connections that miss heartbeats for 60 seconds. During accelerated playback (45x+ speed), the API server's main thread may be too busy to send heartbeats.

**Evidence in logs:**
```
# RabbitMQ pod logs
missed heartbeats from client, timeout: 60s

# API logs
StreamLostError: Connection reset by peer
Failed to publish grid.created event
```

**Workaround:** Use slower playback (`--max-delay 0.5` or higher) for longer recordings.

**Tracking:** [Issue #151](https://github.com/DiamondLightSource/smartem-devtools/issues/151)

### 2. Orphan File Warnings

**Symptom:** Warnings about atlas files with no parent grid.

**Cause:** During accelerated playback, files may arrive before their parent entities are created.

**Example:**
```
WARNING - Atlas file .../Atlas.dm has no parent grid, registering as orphan
```

**Impact:** None - orphan files are processed correctly once parents exist. This is expected behaviour.

### 3. Motion Correction Race Condition

**Symptom:** Errors about missing micrograph records during motion correction processing.

**Cause:** Consumer receives processing events before the agent has created the micrograph record.

**Example:**
```
ERROR - Error in motion_correction for micrograph X: No row was found when one was required
```

**Impact:** Some processing events may be dropped. In production with real-time data, this is less likely.

### 4. Playback Hash Mismatches

**Symptom:** EPUPlayer reports integrity verification issues.

**Example:**
```
Integrity verification found 1903 issues:
  - Hash mismatch for .../Atlas_1594892.jpg: expected d4e27c77..., got 712fd9c6...
```

**Cause:** JPEG recompression during recording/playback produces slightly different binary output.

**Impact:** None - functional data is preserved, only binary hashes differ.

## Troubleshooting

### API Won't Start

```bash
# Check if port is in use
lsof -ti:8000

# Kill existing process
lsof -ti:8000 | xargs kill -9
```

### Database Connection Refused

```bash
# Verify PostgreSQL is running
kubectl get pods -n smartem-decisions | grep postgres

# Check NodePort is accessible
nc -zv localhost 30432
```

### No Data Ingested

1. Check agent is watching the correct directory
2. Verify API health: `curl http://localhost:8000/health`
3. Check agent logs for HTTP errors
4. Ensure playback completed (check playback.log)

### Consumer Not Processing Events

```bash
# Check RabbitMQ connection
curl -s -u $RABBITMQ_USER:$RABBITMQ_PASSWORD \
    http://localhost:30673/api/overview | python3 -m json.tool

# Check queue status
curl -s -u $RABBITMQ_USER:$RABBITMQ_PASSWORD \
    http://localhost:30673/api/queues | python3 -m json.tool
```

## Files in This Directory

| File | Purpose |
|------|---------|
| `run-e2e-test.sh` | Single microscope automated test |
| `run-e2e-test-multi-microscope.sh` | Multi-microscope concurrent test |
| `setup-test-agent-session.py` | Create test agent sessions in database |
| `README.md` | This documentation |
