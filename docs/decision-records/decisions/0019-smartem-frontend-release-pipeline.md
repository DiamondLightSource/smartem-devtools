# 19. SmartEM Frontend Release and Deployment Pipeline

Date: 2026-05-20

## Status

Accepted

## Context

The smartem-frontend repository has no release pipeline. CI runs only security scanners (`osv-scanner`, leaked-secrets). There are no version tags, no published artefacts, and no Kubernetes manifest deploying the frontend in any environment (dev, staging, production). A `Dockerfile` exists from earlier scaffolding but nothing in CI builds or pushes it, and its current form layers a Node 25 runtime that is unnecessary for a pure SPA.

Two related changes make this the right moment to define a release strategy:

1. **Monorepo restructure complete** (ADR 0017). `apps/smartem` (`@smartem/app`) is now the build target. `apps/legacy` will be retired shortly after the first successful production deploy of the new application.
2. **Backend release ecosystem is established.** `smartem-decisions`, `smartem-workspace`, and `smartem-epuplayer` all follow a consistent tag-driven pattern (RC on push to `main`, stable on version tag, optional `workflow_dispatch`). The frontend is the missing piece in the ecosystem.

The frontend has one distinctive property the existing release ADRs (0013, 0015) did not need to address: it is coupled to the backend through an auto-generated API client (`@smartem/api`, produced by Orval from the backend OpenAPI specification). This creates a versioning question — should the frontend version mirror the backend it was built against, or can it move independently?

No DLS-wide pattern exists for serving SPAs from Kubernetes. The only nginx reference in `smartem-devtools/k8s` is the cluster ingress; sci-react-ui publishes to npm rather than serving an application; webui is hosted on GitHub Pages. The choice of serving container has to be defended on its own merits.

## Decision

Introduce a CI release pipeline for smartem-frontend that mirrors the structure of `release-smartem-decisions.yml`, packaged as a single GHCR container image, with independent frontend versioning and a backend-compatibility stamp captured at build time. The container is `nginx:1.30-alpine`. The build target is `apps/smartem` only; legacy is excluded.

### Tagging and release types

| Type | Trigger | Purpose |
|------|---------|---------|
| RC | Push to `main` (path filters match, no stable tag exists for current version) | Pre-release for staging validation |
| Stable | Push a `smartem-frontend-v{semver}` tag | Production release |
| Manual | `workflow_dispatch` with `rc` or `stable` choice | Ad hoc or recovery releases |

Tag prefix `smartem-frontend-v` matches the workspace convention (`smartem-decisions-v`, `smartem-workspace-v`, `epuplayer-v`). Costs nothing now and disambiguates if `packages/ui` later becomes releasable from the same repo.

### Versioning strategy: independent semver with backend-compatibility stamp

The frontend has its own semantic version, declared manually in `apps/smartem/package.json` and validated against `apps/smartem/src/version.ts` (or equivalent) — the same dual-file pattern enforced for `smartem-epuplayer` and `smartem-workspace`.

At build time, the pipeline captures the backend OpenAPI `info.version` from the spec used to generate `@smartem/api` and embeds it alongside the frontend version, the Git SHA, and the build timestamp into a single static asset served from `/version`:

```json
{
  "frontend": "0.3.0",
  "backendApi": "0.1.0",
  "gitSha": "a1b2c3d",
  "buildTime": "2026-05-20T10:15:00Z"
}
```

On application boot, the frontend fetches the backend `/version` endpoint and compares its declared `backendApi` against the live backend's reported version. A mismatch produces a console warning and a non-blocking banner in development; production logs only. Compatibility is **observable, not enforced** — this avoids a hard dependency between deployment ordering, which is important during rolling updates.

A stricter compatibility-range enforcement (e.g. declared `bePinned: "0.1.x"` asserted in deploy CI) is deferred until the simple stamp proves insufficient.

### Artefacts

- Docker image published to GHCR: `ghcr.io/diamondlightsource/smartem-frontend:{VERSION}`, plus `:latest` for stable releases
- GitHub Release with build manifest attached (no wheel, no exe, no npm publish)

PyPI, npm, and Windows executable artefacts are not produced. `packages/ui` may eventually publish to npm; that decision is deferred and would warrant its own ADR.

### Container image: `nginx:1.30-alpine`

Static SPA assets are served by nginx with a one-line history-mode fallback (`try_files $uri /index.html`) so that client-side routing works on direct deep links and hard refreshes.

- **Why nginx OSS, not NGINX Plus**: The 2026 F5 licensing changes (JWT-based licensing, usage reporting, F5 endpoint validation) apply only to the commercial NGINX Plus product. nginx OSS remains BSD-2-Clause and the `nginx:alpine` official Docker image is actively maintained.
- **Why a pinned minor version**: `nginx:1.30-alpine` gives reproducible builds; the project's existing Renovate configuration handles deliberate bumps.
- **Why not freenginx**: The community fork created in 2024 over an F5/CVE-handling dispute remains active and is a viable drop-in replacement. There is no current operational pressure to adopt it. Worth revisiting if F5 governance becomes a concern.
- **Why not Node-runtime serving**: A pure SPA does not need a JavaScript runtime in production. Removing Node from the runtime image shrinks both the image size and the attack surface.

### Build target and Dockerfile

The existing `Dockerfile` (Node 25 multi-stage) is replaced. The new Dockerfile builds `apps/smartem` and copies the static output into an `nginx:1.30-alpine` image. Build command is `npm run build:smartem`. The legacy app is not built by the release pipeline; it remains buildable locally via `npm run build` until removed.

### Path filters

The release workflow triggers on changes to:

- `apps/smartem/**`
- `packages/api/**`
- `packages/ui/**`
- `package.json`, `package-lock.json` (workspace root, for shared dependency or script changes)
- `Dockerfile`
- `.github/workflows/release-smartem-frontend.yml`

Changes confined to `apps/legacy/**` do not trigger a release.

### Workflow shape

The workflow file is `.github/workflows/release-smartem-frontend.yml`. Job structure mirrors `release-smartem-decisions.yml`:

1. **Determine version** — from tag for stable, `{base}rc{run_number}` for RC, validated against `apps/smartem/package.json`
2. **Lint and typecheck** — `npm run check`, `npm run typecheck`
3. **Build SPA** — `npm run build:smartem`, embedding `/version` manifest
4. **Build and push container** — `docker/build-push-action`, push to GHCR with version tag and `:latest` on stable
5. **Create GitHub Release** — RC marked as prerelease; stable with release notes

### Kubernetes deployment

New manifests are added in a follow-up change (out of scope for this ADR), placed under `smartem-devtools/k8s/environments/{development,staging,production}/smartem-frontend.yaml`. The existing `ingress.yaml` gains a routing rule for the frontend service. Image tags are managed per environment, matching the convention already used for `smartem-decisions` (`:latest` in staging/production manifests, rolled by deploy automation).

## Consequences

### Positive

- The frontend joins the established workspace release shape; contributors moving between repos see the same pattern
- Independent frontend and backend versions allow each to move at its own cadence — presentation-only frontend changes no longer require a backend version bump, and breaking backend API changes do not silently invalidate the frontend
- The `/version` stamp makes incompatibility observable in production, surfacing problems that would otherwise be silent
- `nginx:1.30-alpine` keeps the runtime image around 50 MB and has a minimal attack surface
- RC images enable staging smoke tests before promoting to stable, which the team has identified as a desired workflow

### Negative

- Backend compatibility is observed, not enforced. A mismatched FE/BE pairing will produce a warning, not a failure. Acceptable for now; tightening can be added later as a deploy-time CI assertion if drift causes operational pain.
- GHCR storage will accumulate RC images at a rate of roughly one per merge to `main`. A retention policy can be added if the cost becomes material.
- The new Kubernetes manifests and ingress rule introduce surface area that does not exist today, but they are necessary for any deployment strategy.
- nginx-alpine is defended on industry-standard grounds, not on DLS precedent (none exists either way). This is documented here so that a future "DLS SPA serving standard" ADR can either confirm or supersede this choice.

### Neutral

- The existing Node-based `Dockerfile` is replaced; the change is contained and reviewable in the same change that introduces the release workflow.
- Legacy is excluded from the release pipeline by deliberate design — a successful production deploy of the new application is the trigger for purging legacy, not a prerequisite of this ADR.
- ADR 0017's "Dockerfile updates" follow-up is satisfied by this decision.

## Alternatives considered

- **Frontend version mirrors backend version it was built against.** Rejected. Forces a frontend version bump for every backend release, including those with no frontend impact, and forces a backend bump for every cosmetic frontend change. Creates churn without improving traceability beyond what the `/version` stamp already provides.
- **No formal backend-compatibility metadata.** Rejected. Operationally opaque. The first time a mismatched FE/BE pair is deployed, debugging without a version stamp would be guesswork.
- **Caddy** as the serving container. Rejected. Smaller and easier config, but no DLS precedent either way and adds learning cost for a problem nginx solves with a one-line fallback.
- **freenginx** as the serving container. Rejected. Viable drop-in, but no operational reason to fork from upstream nginx today. Worth revisiting if F5 governance becomes a concern.
- **Continue with a Node runtime container.** Rejected. Pure SPA does not justify a JavaScript runtime in production; larger image, larger attack surface, no benefit.
- **Separate ADR for the serving container choice.** Rejected. The nginx decision is an implementation detail of "how do we deploy the frontend" and reads better in the same document as the rest of the pipeline. If `packages/ui` or another DLS SPA later needs the same pattern, a focused ADR can extract it.
- **Tag-driven stable only, no RC on push to `main`.** Rejected. The team identified pre-stable validation as a desired workflow; the backend RC pattern already provides this and adopting the same shape here costs nothing extra.

## Follow-ups (not part of this decision)

- Implement the workflow and Dockerfile on the branch following this ADR
- Add Kubernetes manifests for development, staging, and production
- Add ingress rule for the frontend service
- Define the backend `/version` endpoint contract on the backend side (separate ADR if non-trivial; otherwise a small backend change)
- Update `docs/operations/releasing.md` with a fourth section for `smartem-frontend` once the pipeline lands
- Retire `apps/legacy` after the first successful production deploy of `apps/smartem`
- Revisit npm publication of `packages/ui` if other consumers emerge
