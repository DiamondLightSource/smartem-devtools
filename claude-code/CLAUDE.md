# CLAUDE.md

This file provides guidance to Claude Code when working with code in this workspace.

## Workspace Overview

ERIC is a multi-repo workspace for cryo-electron microscopy (cryo-EM) research software development. It aggregates repositories from multiple GitHub organizations to support automation and optimization of data collection and processing workflows for structural biology at Diamond Light Source.

### Work Packages

- **SmartEM**: Cryo-EM smart automation system for DLS
- **ARIA**: Deposition system for microscopy sessions and acquisition data to a central repository, collecting from multiple facilities

## Vocabulary

- **DLS**: Diamond Light Source - a research facility with a GitHub org under the same name
- **SmartEM**: Cryo-EM smart automation system for Diamond Light Source
- **ARIA**: Central metadata repository for structural biology data from multiple facilities (FragmentScreen/WP4)
- **FandanGO**: Plugin framework for facility-specific metadata extraction and ARIA deposition
- **Agent** (SmartEM): Bidirectional bridge between microscope workstations and backend. Ingests EPU output via filesystem watching, writes to backend API (HTTP/REST/CRUD). Receives ML recommendations via SSE from backend, converts to microscope instructions.
- **EPU**: Proprietary desktop software from ThermoFisher shipped with microscopes. Runs on EPU workstations. Users interact with EPU directly; SmartEM is an optional enhancement alongside it.
- **EPU Workstation**: Windows machine running EPU software, located near the microscope.
- **AthenaAPI**: REST API exposed by ThermoFisher microscopes. Agent is the client; microscope is the server. Used to relay recommendations as instructions to the microscope.
- **FSRecorder**: Tool that records/simulates EPU filesystem output for dev/test purposes.

## Top-Level Structure

```
ERIC/
├── repos/                # All repository clones organised by source
│   ├── DiamondLightSource/   # GitHub org - varying ownership levels
│   ├── FragmentScreen/       # GitHub org - read-only reference
│   └── GitlabAriaPHP/        # GitLab org - ARIA backend ecosystem (read-only)
├── aria-mock/            # ARIA GraphQL mock server for local dev
├── testdata/             # Unversioned test datasets (read unless instructed otherwise)
├── tmp/                  # Scratchpad for simulations, logs, volume mounts, etc.
├── claude-config/        # Claude Code customizations (skills, hooks, agents, commands)
└── CLAUDE.md
```

### Directory Purposes

- **repos/**: Container for all repository clones, organised by source organisation.
  - **DiamondLightSource/**: Clones from the DiamondLightSource GitHub org. Ownership and edit permissions vary per repo (detailed below).
  - **FragmentScreen/**: Clones from the FragmentScreen GitHub org. Read-only reference for understanding dependencies and integration points.
  - **GitlabAriaPHP/**: Clones from the aria-php GitLab org (https://gitlab.com/aria-php/). Read-only reference for the ARIA backend ecosystem.
- **aria-mock/**: GraphQL mock server for ARIA deposition API. Run with `npx graphql-faker schema.graphql`. See `claude-config/ARCHITECTURE.md` for details.
- **testdata/**: Test datasets needed for tests and e2e simulations. Not version controlled. Do not write here unless explicitly instructed.
- **tmp/**: Use instead of /tmp for scratchpad needs - e2e simulation outputs, EPU output directories, logs, volume mounts, temporary files.
- **claude-config/**: Persistent Claude Code configuration - skills, hooks, agents, commands, and other customizations that don't need to be at workspace root.

---

## repos/DiamondLightSource/

### smartem-decisions

**Ownership**: Full (DLS GitHub org)
**Deliverable**: SmartEM
**Role**: Central system controller - backbone, messaging router, persistence, auth

The primary repo of the workspace. Originally the only repo, now the hub of a multi-repo system. ARIA-agnostic (works with or without depositions).

**Contains:**
- Multiple Python packages (backend, agent, common, athena_api, and others - see sub-repo structure)
- Development documentation (auto-publishes to GitHub Pages)
- Kubernetes manifests for dev/stage/prod
- CI/CD pipelines and tooling

**Key concepts:**
- RabbitMQ serves as integration surface - some pub/sub is in-scope, other pub/sub connects to out-of-scope plugins (ML recommendations, data processing, motion correction, CTF, etc.)
- Decision-making happens outside system boundary via plugins; SmartEM routes/relays but does not decide
- Agent runs on Windows workstations near microscopes (built as .exe via CI/CD), but can run on Linux for dev/test

**Tech**: Python 3.12+, FastAPI, PostgreSQL, RabbitMQ, Pydantic

### smartem-frontend

**Ownership**: Full (DLS GitHub org, originally created by Dan Hatton)
**Deliverable**: SmartEM
**Role**: Web UI for SmartEM - user-facing view of acquisition sessions and ML decisions

Pure SPA that talks to smartem-decisions backend API. Hosted in proximity to backend.

- Auto-generated API client from backend OpenAPI spec
- Models route for viewing ML prediction models

**Tech**: React 19, TanStack Router, Material-UI, Node.js 22+, Biome, Lefthook

### cryoem-services

**Ownership**: Reference-only (DLS-owned)
**Role**: Processing execution layer for cryo-EM data pipelines

Integrates with SmartEM via RabbitMQ - sends live processing metrics (motion correction, CTF, particle picking) to the "smartem" queue. SmartEM routes these metrics to decision-making plugins and relays recommendations back.

Not in scope for modification - reference only to understand the integration surface.

**Tech**: Python 3.10+, python-workflows, STOMP/RabbitMQ

### fandanGO-cryoem-dls

**Ownership**: Full (DLS GitHub org)
**Deliverable**: ARIA
**Role**: DLS facility plugin for FandanGO - bridges SmartEM to ARIA

Extracts cryo-EM metadata from SmartEM API, transforms to ARIA schema, deposits to ARIA repository. This connects the SmartEM and ARIA deliverables.

- DLS is authoritative source; FragmentScreen has mirror for ecosystem visibility
- Depends on fandanGO-core and fandanGO-aria (FragmentScreen)
- Analogous to other facility plugins (CNB cryo-EM, CERM NMR, GUF NMR)

**Tech**: Python 3.8+, FandanGO plugin architecture

### smartem-devtools

**Ownership**: Full (DLS GitHub org)
**Deliverable**: Developer tooling
**Source**: https://github.com/DiamondLightSource/smartem-devtools

Developer tooling, documentation, and workspace configuration for the SmartEM ecosystem.

**Contains:**
- Developer documentation (how-to guides, tutorials, ADRs)
- Claude Code configuration for AI-assisted development
- Developer WebUI for workspace management
- Core TypeScript config for multi-repo management
- API specs (SmartEM, Athena)

**Key directories:**
- `docs/` - Markdown documentation, ADRs, how-to guides (synced to webui as MDX)
- `claude-code/` - Skills, repo guidelines, architecture docs
- `webui/` - React developer dashboard
- `core/` - Repository and workspace config definitions

**Tech**: Python 3.11+, Node.js, React 19, Vite, TypeScript

---

## repos/FragmentScreen/

**Ownership**: Read-only reference (FragmentScreen org)
**Deliverable**: ARIA ecosystem

Dependencies and peer references for fandanGO-cryoem-dls. Do not modify.

- **fandanGO-core**: Plugin framework foundation (Python 3.12, conda)
- **fandanGO-aria**: ARIA integration (auth, token management, metadata submission)
- **fandanGO-cryoem-cnb**: CNB-CSIC Madrid cryo-EM plugin (peer reference)
- **fandanGO-nmr-cerm**: CERM Florence NMR plugin (peer reference)
- **fandanGO-nmr-guf**: GUF Frankfurt NMR plugin (peer reference)
- **Samples**: Sample metadata/datasets for community reference

---

## repos/GitlabAriaPHP/ (GitLab)

**Ownership**: Read-only reference (aria-php GitLab org)
**Deliverable**: ARIA ecosystem
**Source**: https://gitlab.com/aria-php/
**Author**: Marcus Povey (marcus@instruct-eric.org)

The ARIA backend ecosystem - PHP libraries and microservices that power the ARIA platform. FandanGO plugins deposit to these APIs. These repos are cloned for reference and historical analysis; some are legacy/ancient.

### data-deposition-api (Primary)

**Source**: https://gitlab.com/aria-php/data-deposition-api
**Role**: ARIA GraphQL/REST API for metadata deposition
**Status**: Active - this is the main API FandanGO deposits to

The production API that receives depositions from FandanGO plugins across all facilities. Understanding this API is essential for debugging deposition issues and ensuring FandanGO clients conform to expected schemas.

**Key concepts:**
- GraphQL API with mutations for creating buckets, records, and fields
- Record schema handlers: mmCIF, Scipion, OSCEM, LOGS, Generic
- Field handlers for various data types: XML, JSON, YAML, CSV, DOI, UniProt, SMILES, InChI, etc.
- Bucket types: proposal, visit
- Uses FAE framework (fae/graphql, fae/schema, fae/rest, etc.)
- Keycloak for auth (OIDC)
- Elasticsearch for search indexing

**Dependencies:**
- aria-graphql-client, aria-elasticsearch-client
- FAE framework components (schema, graphql, rest, user, auth_oidc)

**Integration:**
- fandanGO-aria is the Python client that talks to this API
- aria-mock/ provides a local mock for dev/test without hitting production

**Tech**: PHP 8+, FAE framework, Keycloak, Elasticsearch, Redis

### Supporting Libraries

| Repository | Purpose |
|------------|---------|
| **aria-graphql-client** | PHP library for communicating with ARIA GraphQL API |
| **aria-elasticsearch-client** | Elasticsearch client for ARIA search records |
| **aria-rest** | REST API framework for defining versioned APIs |
| **aria-webhooks** | Standard webhook payload format for ARIA platform |
| **aria-mailer** | Email wrapper (PHPMailer + Swiftmailer) |
| **aria-mailgun-webhooks** | Mailgun webhook event parser |
| **aria-incoming-email** | Incoming email message routing |
| **aria-invite-users** | User invitation framework |
| **aria-data-subscription** | Data source subscription framework for feeds |
| **aria-stats** | Performance statistics monitoring |
| **aria-storage-interface** | Storage provider interface |
| **aria-site-logger** | Monolog plugin for ARIA site logging |
| **aria-service-ai** | Service AI library |

### External Integrations

| Repository | Purpose |
|------------|---------|
| **keycloak-api** | PHP bindings for Keycloak Account API |
| **molgenis-php-client** | PHP client for Molgenis database |
| **doi-package** | DOI microservice client |

### Infrastructure

| Repository | Purpose |
|------------|---------|
| **shibboleth-idp-dockerized** | Dockerized Shibboleth IdP (identity federation) |
| **rtd-compiler** | ReadTheDocs compiler for ARIA documentation |

---

## Code Navigation

This workspace has Serena MCP server configured for semantic code navigation. Use the appropriate tool based on the query type:

**Use Serena (`mcp__serena__*` tools) for semantic queries:**
- "Where is function X defined?" → `mcp__serena__find_symbol`
- "What calls this method?" → `mcp__serena__find_referencing_symbols`
- "Show all usages of class Y" → `mcp__serena__find_referencing_symbols`
- "Get the docstring for Z" → `mcp__serena__get_symbol_documentation`

**Use built-in Grep/Glob for text pattern queries:**
- "Find files containing 'TODO'" → Grep
- "Search for error message 'connection failed'" → Grep
- "Find all *.test.ts files" → Glob

Serena understands code structure (functions, classes, imports) while Grep/Glob search raw text. Prefer Serena when looking for code relationships.

---

## Claude Code Configuration

Centralized in `claude-config/` - see `claude-config/README.md` for full details.

```
claude-config/
├── ARCHITECTURE.md            # System architecture, dependencies, data flow, mocking requirements
├── shared/                    # Cross-repo config
├── smartem-decisions/         # Agents, settings, repo guidelines
│   ├── agents/                # database-admin, devops, software-engineer, technical-writer, project-owner
│   ├── settings.json          # Permissions
│   └── REPO-GUIDELINES.md     # Code standards and workflow
├── smartem-frontend/          # Skills
│   └── skills/playwright-skill/
└── fandango-cryoem-dls/       # (to be populated)
```

See `claude-config/ARCHITECTURE.md` for system architecture, dependency chains, and E2E testing requirements.

### When working on smartem-decisions

Refer to `claude-config/smartem-decisions/REPO-GUIDELINES.md` for:
- Code standards (120 char lines, Python 3.12 typing, no comments, no emojis/unicode)
- Mandatory pre-commit workflow
- Common commands (pytest, pyright, ruff, alembic, k8s tools)
- Available agents and when to use them

### When working on smartem-frontend

- Use playwright-skill for browser automation testing
- Biome for TS/JS linting, Lefthook for git hooks

### When working on fandanGO-cryoem-dls

- Follow FandanGO plugin conventions
- Reference peer plugins in repos/FragmentScreen/ for patterns

---

## Git Commit Guidelines

- **No Claude attribution**: Do NOT add `Co-Authored-By: Claude` or any similar attribution lines to commit messages. Commits should appear as normal developer commits.
- Write clear, concise commit messages following conventional commits format when appropriate (feat, fix, docs, refactor, etc.)
- Focus on the "why" not the "what" in commit body
