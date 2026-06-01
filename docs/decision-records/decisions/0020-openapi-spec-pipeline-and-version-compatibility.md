# 20. SmartEM OpenAPI Specification Pipeline and Version Compatibility

Date: 2026-06-01

## Status

Accepted

## Context

The SmartEM OpenAPI specification exists as **three independently committed copies** with no automation keeping them in step:

1. `smartem-decisions` — the FastAPI backend, which is the only true source: `app.openapi()`. It does **not** commit or publish its own spec.
2. `smartem-frontend` — `packages/api/src/openapi.json`, the Orval input that generates the `@smartem/api` client.
3. `smartem-devtools` — `docs/api/smartem/swagger.json` and `webui/public/api/smartem/swagger.json`, served as human-facing Swagger UI on GitHub Pages and fetched by the frontend's `npm run api:update`.

Because every copy is refreshed by hand, all three drift. As observed on 2026-06-01, the Pages-served copy was ~9 months stale (25 paths, `0.1.dev276…d20250818`) while the backend served 61 paths; the two devtools copies were themselves inconsistent (25 vs 58 paths). Issue #253 (`smartem-decisions`) records the same drift. A consumer running `npm run api:update` would have regenerated a badly regressed client.

Two further facts shape the design:

- **The backend version changes on every commit.** `info.version` is `setuptools_scm`-derived (e.g. `0.1.1rc48.dev3+gcd5206327`), so the *string* changes per commit even when the API surface does not. "Has the API changed?" must therefore be answered by diffing spec **content** (paths + components), not the version field.
- **Compatibility checking exists but is unusable.** ADR 0019 specified a frontend `/version.json` manifest stamping the backend API version it was built against (`write-version-json.mjs`, shipped), plus a boot-time comparison against a backend `/version` endpoint, *observable not enforced*. But the backend `/version` endpoint was never built (only `/status` and `/health` exist), the boot check was never wired into the new app (issue #93), and the helper that does exist (`packages/api/src/version-check.ts`) compares with `serverVersion === API_VERSION` — an **exact full-string match**. Given commit-granular versions, that reports a mismatch on essentially every deployment, so it is wired only into the legacy app and is effectively inert.

The agent ships from the same repository and tag as the backend, so agent↔backend versions are locked by construction; there is no runtime check, and none is needed.

## Decision

Establish a single-source, automated pipeline with the backend as publisher, and finish ADR 0019's compatibility model.

### 1. The backend is the canonical publisher

`smartem-decisions` commits its own spec at `docs/api/openapi.json`. A CI job on push to `main` regenerates the spec from `app.openapi()` and, **only when the content has changed** (the spec compared with `info.version` and `servers` normalised out, so per-commit version churn does not trigger it), commits the refreshed file. The committed file is the canonical artefact, fetchable at a stable raw URL on `main`; it is also attached to GitHub Releases for version pinning. `smartem-frontend` and `smartem-devtools` are **downstream caches** of this artefact and are never hand-edited.

### 2. Backend → devtools sync is push-triggered, and rebuilds Pages

When the backend commits a changed spec, the same job sends a `repository_dispatch` (`event_type: openapi-spec-updated`) to `smartem-devtools`. A receiver workflow there downloads the canonical spec, writes both devtools copies, and rebuilds GitHub Pages by calling the existing deploy as a reusable job (`workflow_call`) — this side-steps the GitHub rule that a `GITHUB_TOKEN` commit does not itself trigger `on: push` workflows. The workflow also accepts `workflow_dispatch` (manual) and a low-frequency `schedule` as a fallback if a dispatch is ever missed.

The cross-repo dispatch requires one credential in `smartem-decisions` (a fine-grained token with `Contents: write` on `smartem-devtools`, or a GitHub App). This is the only new secret the design introduces; promptness across a repository boundary is not achievable without one, and a scheduled-only poll was rejected because it does not satisfy the requirement that Pages rebuild *when the backend publishes*.

### 3. The frontend refreshes from the canonical source

`smartem-frontend`'s `api:fetch` is repointed from the stale devtools Pages URL to the backend's canonical spec. `packages/api/src/openapi.json` remains committed — it is the hermetic build input for Orval and the source `write-version-json.mjs` stamps `backendApi` from, and it gives a reviewable contract diff in pull requests — but it is now a cache refreshed from the single source. The frontend keeps its own independent semantic version (ADR 0019); that is unaffected.

### 4. Compatibility is observable, semantic, and finished

- The backend gains a `GET /version` endpoint returning the API version (the ADR 0019 contract, finally built; `/status` is unchanged).
- `version-check.ts` is rewritten to compare **semantically** — the release portion only, ignoring the `dev`/`+sha` suffix — and to read the backend version from `/version`. It is wired into `apps/smartem/src/main.tsx` to run once, non-blocking, at boot (closing #93). On divergence it logs to the console always and shows a non-blocking banner in development only; production logs. Compatibility is **observed, never enforced**, so rolling updates where the two momentarily differ do not self-inflict an outage. A pinned compatibility range remains deferred, as in ADR 0019.

### 5. The agent is documented as version-locked

No runtime check is added; the shared repository and tag guarantee a matched build. This is recorded so the absence of a check is a decision, not an oversight.

## Consequences

- Three drifting copies collapse to one source plus two derived caches; the drift class is eliminated and the published Swagger UI tracks the backend automatically.
- `npm run api:update` becomes safe and canonical again.
- One new secret (`DEVTOOLS_DISPATCH_TOKEN`) is required in `smartem-decisions`; the dispatch wiring is inert until it exists, and the manual `workflow_dispatch` path covers the gap.
- This ADR supersedes the relevant surface of ADR 0019: the backend `/version` endpoint and the semantic, observe-only check are now specified and built here.
- Closes `smartem-decisions` #253 (spec sync), `smartem-frontend` #93 (wire the boot check); partially addresses `smartem-devtools` #8 (consolidate API specs).
- New releases are warranted on completion: `smartem-decisions` (new `/version` endpoint and the committed/published spec) and `smartem-frontend` (the wired compatibility check). `smartem-devtools` deploys continuously via Pages and needs no version tag for this change.
- Documentation and Claude Code configuration across the three repositories that described the hand-maintained flow are updated to describe the pipeline.
