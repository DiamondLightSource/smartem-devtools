# ERIC Architecture Overview

## System Boundary

SmartEM is the core system. Everything inside the boundary is in scope; everything outside needs mocking for dev/test.

### Outside (mock for dev/test)

| Component | Interface | Mock Strategy |
|-----------|-----------|---------------|
| Microscope | AthenaAPI (server) | Mock server from OpenAPI spec |
| EPU Desktop | Filesystem output (.xml, .dm, .mrc) | EPUPlayer + testdata/ |
| ARIA | Deposition REST API (aria-php/data-deposition-api) | Mock server (aria-mock/) |
| cryoem-services | RabbitMQ events | Mock MQ publisher |
| ML plugins | RabbitMQ events | Mock MQ publisher |

### Inside (our code)

| Component | Role |
|-----------|------|
| smartem-agent | EPU file watcher, backend client, microscope client |
| smartem-backend | API server, DB, MQ router |
| smartem-frontend | Web UI |
| fandanGO-cryoem-dls | Metadata extraction and ARIA deposition |
| RabbitMQ | Message queue (infrastructure) |

## Connections

### smartem-agent (all connections initiated by agent)

| Direction | Target | Protocol | Purpose |
|-----------|--------|----------|---------|
| reads | EPU filesystem | FS watch | Data intake (.xml, .dm, .mrc) |
| pushes | smartem-backend | HTTP REST | Parsed acquisition data |
| receives | smartem-backend | SSE | Recommendations stream |
| sends | Microscope | AthenaAPI | Instructions to hardware |

### smartem-backend

| Direction | Target | Protocol | Purpose |
|-----------|--------|----------|---------|
| serves | smartem-agent | HTTP REST + SSE | Data intake, recommendations |
| serves | smartem-frontend | HTTP REST | UI data |
| serves | fandanGO-cryoem-dls | HTTP REST | Metadata extraction |
| publishes/subscribes | RabbitMQ | AMQP | Processing events, ML recommendations |

### fandanGO-cryoem-dls

| Direction | Target | Protocol | Purpose |
|-----------|--------|----------|---------|
| reads | smartem-backend | HTTP REST | Metadata extraction |
| writes | ARIA | HTTP REST | Deposition |

### RabbitMQ routing

| Publisher | Subscriber | Event Type |
|-----------|------------|------------|
| smartem-backend | cryoem-services | Processing requests |
| cryoem-services | smartem-backend | Processing results |
| smartem-backend | ML plugins | Decision requests |
| ML plugins | smartem-backend | Recommendations |

## smartem-decisions Internal Architecture

### Package Dependencies

| Package | Imports |
|---------|---------|
| smartem_common | (none - leaf) |
| smartem_backend | smartem_common |
| smartem_agent | smartem_common, smartem_backend.api_client |
| smartem_mcp | smartem_common, smartem_backend, smartem_agent |
| athena_api | (independent - no smartem imports) |

### Package Summaries

| Package | Purpose | Key Components |
|---------|---------|----------------|
| `smartem_common` | Shared schemas, enums, utils | Pydantic models, EntityStatus enums |
| `smartem_backend` | API server, DB, MQ consumer | FastAPI, PostgreSQL, RabbitMQ, Alembic |
| `smartem_agent` | EPU file watcher, parser | Watchdog, lxml, Typer CLI |
| `athena_api` | Microscope hardware client | HTTP client + mock server |
| `smartem_mcp` | Natural language querying | FastMCP server |

## API Client Generation

smartem-backend API serves multiple consumers with different needs:

| Client | SSE Support | Consumer | Notes |
|--------|-------------|----------|-------|
| Agent client | Yes | smartem-agent | Bidirectional: REST for data intake, SSE for recommendations |
| Frontend client | TBD | smartem-frontend | May need SSE for live updates |
| Deposition client | No | fandanGO-cryoem-dls | REST only |

## Mocking Requirements for E2E Testing

| External Dependency | Mock Strategy | Status |
|---------------------|---------------|--------|
| EPU filesystem output | EPUPlayer + testdata/ | Exists |
| AthenaAPI (microscope) | Mock server from OpenAPI spec | Partial (athena_api/mock/) |
| cryoem-services MQ events | Mock MQ publisher | Needs work |
| ARIA deposition endpoint | aria-mock/ (graphql-faker) | Ready |

## E2E Test Stack (Target)

Components needed for full E2E testing in tmp/ or containers:

| Component | Type | Feeds |
|-----------|------|-------|
| EPUPlayer | Mock | smartem-agent (EPU simulation) |
| AthenaAPI Mock | Mock | smartem-agent (microscope simulation) |
| ARIA Mock | Mock | fandanGO-cryoem-dls |
| MQ Event Simulator | Mock | RabbitMQ (simulates cryoem-services) |
| smartem-agent | Real | smartem-backend |
| smartem-backend | Real | - |
| smartem-frontend | Real | smartem-backend |
| fandanGO-cryoem-dls | Real | smartem-backend |
| RabbitMQ | Real | - |

## Running Mocks

### ARIA Mock (aria-mock/)

GraphQL mock server for the ARIA Data Deposition API (https://gitlab.com/aria-php/data-deposition-api). Schema derived from fandanGO-aria client queries. Uses graphql-faker for automatic response generation.

```bash
cd aria-mock/

# Basic mock (random data)
npx graphql-faker schema.graphql

# With realistic fake data (cryo-EM schemas, visit statuses)
npx graphql-faker --extend schema.faker.graphql schema.graphql
```

**Endpoints (default port 9002):**
- GraphQL: `http://localhost:9002/graphql`
- GraphiQL IDE: `http://localhost:9002/editor`
- Schema visualiser: `http://localhost:9002/voyager`

**Configure fandanGO-aria to use mock:**
```bash
export DEV=LOCAL
export ARIA_GQL_LOCAL=http://localhost:9002/graphql
```

**Limitations:** No persistence, no auth (OAuth bypassed), random IDs on mutations.

## Dependency Chains

### When smartem-backend API changes

| Affected | Action Required |
|----------|-----------------|
| smartem-frontend | Regenerate OpenAPI client |
| smartem-agent | Update api_client imports |
| fandanGO-cryoem-dls | Update SmartEMAPIClient |
| Docs | Regenerate OpenAPI spec |
| Containers | Rebuild images |

### When smartem-backend MQ schema changes

| Affected | Action Required |
|----------|-----------------|
| cryoem-services | Must match event format |
| MQ mock publishers | Update e2e tests |

### When smartem_common schemas change

| Affected | Action Required |
|----------|-----------------|
| smartem-backend | Rebuild |
| smartem-agent | Rebuild |
| smartem_mcp | Rebuild |

## CI/CD Overview

| Repo | Key Workflows | Release Strategy |
|------|---------------|------------------|
| smartem-decisions | CI, security scan, docs, Windows builds | Git tags (setuptools_scm) |
| smartem-frontend | TBD | TBD |
| cryoem-services | Test, publish, version bump | PyPI + Sigstore |
| fandanGO-cryoem-dls | None configured | None |

### smartem-decisions CI Features

- Schema drift checking (Alembic vs SQLModel)
- Security scanning (detect-secrets)
- Versioned docs to GitHub Pages
- Windows .exe builds (PyInstaller) for agent and epuplayer

## Infrastructure

### Kubernetes Services (smartem-decisions namespace)

- `smartem-http-api-service:8000` - Backend API
- `smartem-worker` - RabbitMQ consumer
- `rabbitmq-service:5672` - Message queue
- `postgres-service:5432` - Database

### Deployment Environments

- development
- staging
- production

## Recommendations vs Instructions (Separation of Concerns)

### Principle

Backend and Agent have distinct responsibilities that must not be conflated:

| Component | Responsibility | Data Type |
|-----------|---------------|-----------|
| Backend | Store predictions, route via SSE | Recommendations |
| Agent | User confirm, convert, execute | Instructions |

### Why This Matters

1. **Human-in-the-loop**: Agent presents recommendations to user who can:
   - Auto-accept all (forward as instructions)
   - Manually confirm each one
   - Just observe (manual action outside system)

2. **Microscope abstraction**: Different microscopes have different APIs (Athena, others). Agent handles this, not backend.

3. **Locality**: Agent runs on EPU workstation near microscope. Backend is remote.

### Implications

- Backend must NOT import athena_api or know about microscope internals
- athena_api is used by Agent only (see package dependencies)
- Recommendations flow: ML Plugin → MQ → Backend → SSE → Agent
- Instructions flow: Agent → AthenaAPI → Microscope
