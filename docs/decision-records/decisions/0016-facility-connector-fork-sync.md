# 16. Facility Connector Fork Synchronization

Date: 2026-01-30

## Status

Proposed (pending ARIA stakeholder input)

## Context

ARIA maintains a network of ~24 facility connectors (fandanGO plugins). Each facility owns their connector; FragmentScreen hosts forks for ecosystem visibility. Changes flow bidirectionally but asymmetrically.

### The Dependency Chain

```
Facility Connector (e.g., fandanGO-cryoem-dls)
    |
    +-- depends on: fandanGO-aria (PyPI)    <- API client, ARIA-maintained
    +-- depends on: fandanGO-core (PyPI)    <- Plugin framework, ARIA-maintained
```

**Key insight**: API compatibility is handled through pip dependencies (`fandanGO-aria` client), NOT through repo sync. When ARIA updates their API:

1. They update `fandanGO-aria` on PyPI
2. Facilities run `pip install --upgrade fandanGO-aria`
3. No repo sync needed for API compatibility

This simplifies the problem to code visibility and occasional code contributions.

### What Repo Sync Actually Solves

| Purpose | Direction | Urgency |
|---------|-----------|---------|
| Ecosystem visibility for ARIA | Facility -> ARIA | Low |
| Code contributions from ARIA | ARIA -> Facility | Medium |
| Release tracking | Facility -> ARIA | Low |
| Issue awareness | Bidirectional | Low |

### Actors and Ownership

```
+-------------------------------------------------------------+
|                    ARIA / FragmentScreen                     |
|  - API owner (via fandanGO-aria PyPI package)               |
|  - Wants visibility into all facility connectors            |
|  - Occasionally contributes code back to facilities         |
|  - Does NOT want PR overhead for every facility change      |
+-------------------------------------------------------------+
                              ^
                              | forks
        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
+--------------+      +--------------+      +--------------+
|  DLS (owns)  |      |  CNB (owns)  |      |  ... x 24    |
|  Connector   |      |  Connector   |      |  Facilities  |
+--------------+      +--------------+      +--------------+
        |                                           |
        +--------- Capability spectrum -------------+
          "Well-resourced" <----------> "Resource-constrained"
```

**Facility spectrum**:

- Some facilities are well-resourced and proactive
- Some have limited dev resources; ARIA may need to maintain their connector directly
- Solution must accommodate both extremes

### Constraints

| Constraint | Rationale |
|------------|-----------|
| No external paid services | Self-hosted, GitHub-native only |
| No satellite repos | Over-engineering |
| Must scale to ~24 connectors | DLS is pilot; solution benefits ARIA |
| Efficient CI minutes | Avoid excessive GitHub Actions usage |
| Graceful degradation | Quota limits delay sync, don't break it |
| Simple handover | Straightforward for any developer to inherit |

## Decision

We will implement a configurable GitHub Actions workflow for bidirectional sync between facility connectors and ARIA forks.

### Sync Direction: Facility -> ARIA (DLS Pilot)

Three configurable modes (facility chooses via `.github/fandango-sync.yml`):

| Mode | Mechanism | Use Case |
|------|-----------|----------|
| **direct-push** | GitHub Action pushes commits to fork | Lowest overhead, fork always mirrors upstream |
| **per-commit-pr** | GitHub Action creates PR for each push | Maximum visibility, ARIA can review if desired |
| **buffered-pr** | Aggregate commits over N hours/days into single PR | Balance between visibility and noise |

The workflow:

1. Triggers on push to main branch
2. Reads configuration from `.github/fandango-sync.yml`
3. Executes the configured sync mode
4. Handles failures gracefully (warn, don't error)

### Sync Direction: ARIA -> Facility

Always through standard GitHub fork workflow:

- PR to facility repo
- Always requires human review from facility
- Facility controls merge timing

No special automation needed for this direction.

### Configuration Schema

```yaml
# .github/fandango-sync.yml
sync:
  enabled: true
  target:
    org: FragmentScreen
    repo: fandanGO-cryoem-dls
  mode: direct-push  # Options: direct-push, per-commit-pr, buffered-pr
  branches:
    - main
  buffer_hours: 24  # Only used for buffered-pr mode
```

### Access Model Options (Pending ARIA Input)

| Option | Mechanism | Requirements |
|--------|-----------|--------------|
| **Deploy key** | SSH key with write access to fork | ARIA adds DLS deploy key to fork |
| **PR-only** | All syncs create PRs | ARIA enables auto-merge or reviews |

### Issues Strategy

Issues live on facility side (canonical location):

- Facilities use their own labels, workflows, boards
- ARIA fork has issues disabled or redirects to facility

### Implementation Phases

**Phase 1: DLS Pilot**

1. Confirm ARIA access model (deploy key vs PR-only)
2. Implement sync workflow in fandanGO-cryoem-dls
3. Test sync flow end-to-end
4. Document setup for other facilities

**Phase 2: Template & Docs**

1. Extract reusable workflow template
2. Write onboarding guide for facilities
3. Create configuration schema

**Phase 3: Scaling (if needed)**

1. Roll out to additional facilities
2. Build connector registry (if ARIA wants it)
3. Build dashboard (if ARIA wants it)

## Consequences

### Positive

- **Clear ownership**: Facilities own connectors, ARIA maintains forks
- **API compat via pip**: No repo sync needed for API changes
- **Configurable modes**: Facilities choose their sync style
- **GitHub-native**: No external services, easy maintenance
- **Scalable**: Template-based approach for all connectors
- **Graceful degradation**: Rate limits delay sync, don't break it

### Negative

- **Setup overhead**: Each facility needs to configure sync
- **Access coordination**: Need to coordinate deploy keys or PR permissions with ARIA
- **Monitoring gap**: No centralised dashboard for sync status (deferred)

### Open Questions for ARIA

**Governance**:

1. What level of access can ARIA grant to facility CI workflows? (Deploy key? PAT? None - PRs only?)
2. For resource-constrained facilities - is ARIA willing to maintain their connector directly?
3. Should there be a formal onboarding process for new facility connectors?

**Sync Mechanics**:

4. Preferred sync mode for facility -> ARIA? (Direct push / PR / Buffered PR)
5. If PRs: auto-merge acceptable, or does someone need to review?
6. Any branches besides `main` that should sync?

**Visibility**:

7. Is watching facility repos sufficient, or do you want a centralised dashboard?
8. Interest in a connector registry/manifest?
9. How should release events be communicated to ARIA?

**Issues**:

10. Should ARIA fork disable issues entirely, or redirect to facility?
11. Any cross-repo issue visibility requirements?
12. Label taxonomy: leave to facilities, or suggest conventions?

## References

- ADR-13: EPUPlayer Release Strategy (established dual-distribution precedent)
- ADR-15: SmartEM Package Release Architecture (established uv-based CI patterns)
- [fandanGO-aria](https://github.com/FragmentScreen/fandanGO-aria): ARIA Python client
- [fandanGO-core](https://github.com/FragmentScreen/fandanGO-core): Plugin framework
