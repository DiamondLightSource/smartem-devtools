# Documentation Coverage-Gap Analysis

Second input to the documentation rework, and the counterpart to [REPORT.md](REPORT.md). The drift
audit asked **"is what is written true?"** This analysis asks the axis it could not see: **"what
exists in the system but appears in no doc?"** A `true` claim is accurate, not sufficient - it can
sit right next to a large undocumented hole. This report enumerates the actual system surface and
diffs it against the docs corpus to find that hole.

## Method

Five system surfaces were enumerated directly from source, then each item was cross-checked against
the whole `docs/` tree:

| Surface | Source of truth |
|---|---|
| Agent CLI | `smartem-decisions/src/smartem_agent/` (Typer app) |
| Backend HTTP API | `smartem-decisions/src/smartem_backend/api_server.py` (FastAPI) + `cli/*.py` |
| Environment variables | `os.getenv`/`environ` reads across `smartem-decisions`, `VITE_*` in `smartem-frontend` |
| Kubernetes | `smartem-devtools/k8s/` (dev/staging/production overlays + shared) |
| Frontend | `smartem-frontend/apps/smartem/src/routes/` (TanStack Router) |

Each item is classed **documented** (appears with usable detail), **partial** (named but key
surface missing or misdescribed), or **undocumented** (absent from the corpus). "Documented" here
means *present*, not *correct* - where a documented item is also wrong, REPORT.md holds the drift
detail.

## Headline

The surfaces are not commensurable, so there is no single percentage - but the shape is clear:

| Surface | Real surface | Documented | Gap |
|---|--:|--:|---|
| **Frontend routes** | 16 routes + shell | 0 | **100% undocumented** - no `docs/frontend/` exists |
| **Backend endpoints** | 88 routes | 87 (auto-spec) / 0 prose | 1 code-only route; **no hand-written reference**; spec stale |
| **Backend CLI tools** | 4 scripts | 0 | **all undocumented** |
| **Env vars** | 32 read by code | 19 | **13 undocumented** + 8 stale docs-only |
| **K8s workloads** | 9 | 6 (+1 partial) | **2 undocumented** (mongodb, elasticsearch) |
| **K8s operator config** | ~10 classes | 4 | HPA, ingress hostnames, `/dls` mount, 6 secret keys, pull-secret |
| **Agent CLI commands** | 10 | 10 named | verbose flag misdocumented on 9; `agent-cleanup` script absent |

**The largest hole is the entire shipped frontend.** After that: the backend has good
machine-generated coverage but zero prose reference and a stale committed spec; env-var runtime
tunables and the Kubernetes operational surface are substantially under-documented; the agent CLI is
the best-covered surface (every command is named) but its verbose flag is documented in a form that
does not exist.

---

## Frontend - the biggest gap

**16 navigable routes and the entire shell are undocumented. There is no `docs/frontend/` section
at all.** The only frontend material in the corpus is six build/release/auth ADRs plus two
planning-stage records (`decision-records/smartem-frontend-{design,requirements}.md`). Those records
are actively **misleading** as current documentation:

- they use a `/sessions/:sessionId/...` route prefix the app never shipped (it uses
  `/acquisitions/$acquisitionId/...`);
- `smartem-frontend-design.md` is self-described as a "working draft";
- the only concrete route table (requirements Appendix B) documents the **removed `apps/legacy`**,
  not `apps/smartem`;
- the design lists a `/micrographs/:micrographId` route that was never built.

Shipped routes, none with as-shipped reference docs:

| Route | Shows |
|---|---|
| `/` | Home / dashboard entry |
| `/acquisitions` | Acquisitions list |
| `/acquisitions/$acquisitionId` | Acquisition detail (grids table) |
| `.../grids/$gridId` | Grid layout (redirects to atlas) |
| `.../grids/$gridId/atlas` | Atlas spatial view + prediction/latent overlays |
| `.../grids/$gridId/squares` | Grid-square collection (Table \| Gallery) |
| `.../squares/` (index) | Grid-square table (Holes + Score, per-square predictions, suggested order) |
| `.../squares/gallery` | Grid-square gallery (thumbnail tiles) |
| `.../grids/$gridId/predictions` | Grid-level prediction dashboard |
| `.../grids/$gridId/workspace` | Configurable panel workspace |
| `.../squares/$squareId` | Square detail (foilhole map + latent scatter) |
| `.../squares/$squareId/predictions` | Square quality analytics (histogram, as-of-time slider) |
| `.../squares/$squareId/holes/$holeId` | Foil-hole detail (micrograph cards + metadata) |
| `/models` | ML models catalogue (metric-weight matrix) |
| `/models/$modelName` | Model detail (weight evolution) |

Undocumented shell features: header nav (Acquisitions / Models / flag-gated Depositions), the
command palette (`/` shortcut, fuzzy search), the settings menu (theme, language, density,
shortcuts), and the Keycloak SPA login/logout UI (auth is covered architecturally, but not the UI).

**Workstream:** a new `docs/frontend/` reference section - route map, per-view purpose and data
sources, shell/feature guide. This is net-new writing, not a fix.

---

## Backend HTTP API - covered by machine, not by prose

**88 route operations, all in `api_server.py`.** A generated OpenAPI 3.1 spec is committed
(`smartem-decisions/docs/api/openapi.json`) and cached into the corpus
(`docs/api/smartem/swagger.json`, rendered by Swagger UI). It lists **87** operations - so machine
coverage is 87/88. Two distinct gaps:

1. **One code-only endpoint:** `GET /micrographs/{micrograph_uuid}/micrograph_image` (the #308/#312
   leaf-image route) is in neither the spec (stale at `0.1.1rc51.dev5`) nor any prose. **The
   committed/cached spec should be regenerated** - it currently lags the code by one endpoint.
2. **Zero hand-written endpoint reference.** Every route relies solely on auto-generated Swagger.
   Nothing gives an integrator prose context for the resource groups that most need it: `/debug/*`
   (8 routes), agent session / SSE (4), processing-feedback `motion_correction` + `ctf_estimation`
   (4), and the predictions / latent-representation read surface (11).

Also note: **`docs/backend/api-documentation.md` is misleading** - its only concrete endpoint
examples (`/api/v1/Session`, `/api/v1/Area`, `/api/v1/Decision`) belong to the *external Athena*
service, not the SmartEM backend, so a reader can mistake them for SmartEM Core routes. (This
overlaps REPORT.md's drift findings for that file.)

**Backend CLI tools - all four undocumented** (no invocation, args, or purpose anywhere in the
corpus):

| Script (`src/smartem_backend/cli/`) | Purpose |
|---|---|
| `initialise_prediction_model_weights.py` | Seed model-weight rows for every model x metric on a grid |
| `register_quality_prediction_model.py` | Register a quality-prediction model |
| `random_prior_updates.py` | Simulate motion-corr / CTF / particle-pick prior updates (dev/test) |
| `random_model_predictions.py` | Generate random quality-prediction rows (dev/test) |

**Workstream:** regenerate the committed spec; add a thin prose reference that frames the resource
groups and links to Swagger for the field-level detail; document the four CLI tools (they are the
data-seeding path for a working dev instance).

---

## Environment variables - runtime tunables missing

**32 distinct vars are read by code; 19 documented, 13 not.** The env-vars doc is
file-pattern-oriented, so it covers credentials and hosts but omits most per-var runtime tunables.

Undocumented (read by code, absent from docs):

| Var | Component | Note |
|---|---|---|
| `SKIP_DB_INIT` | backend | api_server.py:154,187; consumer.py:103 |
| `SMARTEM_GRIDSQUARE_CREATE_BATCH_MAX` | backend | batch-size tunable |
| `SMARTEM_IMAGE_CACHE_DIR` | backend | image-serving cache location |
| `FRONTEND_SSE_MAX_CONNECTIONS` | backend | SSE fan-out cap |
| `FRONTEND_SSE_POLL_INTERVAL` | backend | SSE poll cadence |
| `ENVIRONMENT` | backend | health/version payload |
| `KEYCLOAK_VERIFY_ISS` | backend | **set in every k8s configmap**, documented nowhere |
| `KEYCLOAK_ALLOWED_AZP` | backend | set in staging/prod configmaps |
| `RABBITMQ_VHOST` | backend | broker vhost |
| `RABBITMQ_EXCHANGE` | backend | exchange name |
| `RABBITMQ_EXCHANGE_TYPE` | backend | exchange type |
| `SMARTEM_BACKEND_CONFIG` | backend | config-file path |
| `VITE_DEVTOOLS` | frontend | devtools toggle |

Stale docs-only tokens (documented but not read by app code - candidates for removal or relabelling
as infra/deploy vars): `RABBITMQ_URL` (never read - the code composes the URL from parts, so
documenting it as an app var is misleading), `RABBITMQ_UI_PORT`, `ADMINER_PORT`, `DOCKER_USERNAME`,
`DOCKER_EMAIL`, `DOCKER_PASSWORD`, `DEPLOY_ENV` (all deploy-script / compose vars, not app config),
and `POSTGRES_X` (a placeholder from an error-message example, not a real var).

**Workstream:** add the 13 runtime tunables (grouped: SSE, image cache, Keycloak verification,
RabbitMQ topology); split the doc into "app config the process reads" vs "deploy/infra vars", and
either fix or remove the stale tokens.

---

## Kubernetes - operational surface under-documented

**9 workloads: 6 documented, 1 partial (frontend), 2 undocumented.** Plus a set of operator-facing
config that an operator would need but cannot find:

- **`mongodb` and `elasticsearch`** run in the development overlay (ports 27017, 9200/9300,
  `emptyDir`) but appear **nowhere** in the corpus - no operator would know they run or why.
- **HPA is undocumented and orphaned.** `k8s/hpa.yaml` defines `smartem-http-api-hpa` (min 2 / max
  10, CPU 70%), but no doc mentions autoscaling and **it is referenced by no `kustomization.yaml`**,
  so `kubectl apply -k` never deploys it. Both a doc gap and a real config bug.
- **Six required secret keys are missing** from `secret.example.yaml` and undocumented: deployments
  pull `POSTGRES_HOST/PORT/DB` and `RABBITMQ_HOST/PORT/EXCHANGE` from `smartem-secrets` via
  `secretKeyRef`, but the example lists only the four user/password keys - copying the example
  yields a broken deploy.
- **Staging/production ingress is undocumented** - hostnames `smartem.diamond.ac.uk` /
  `smartem-staging.diamond.ac.uk`, path `/`, and the `proxy-body-size: 10m` annotation exist only in
  manifests; `operations/kubernetes.md` has no ingress section (only ADR 0019 mentions it as "future
  work").
- **The `/dls` NFS/GPFS read-only mount** needed by the image-serving endpoints exists only as a
  commented placeholder in the staging/prod API deployment - an operator enabling real imagery has
  no guidance.
- **`imagePullSecret: ghcr-secret`** is required by every staging/prod workload but is never
  mentioned in `kubernetes-secrets.md`.
- **`scripts/k8s/k8s-network-summary.sh`** is undocumented (the other two k8s scripts are).
- Frontend `BACKEND_HOST` (the FQDN the in-cluster nginx `resolver` needs) is a known DNS foot-gun
  captured only in a manifest comment.

Adjacent drift worth noting: `kubernetes-secrets.md` refers to per-environment `secrets.yaml` files
that **do not exist** in any overlay or kustomization - the real flow is `secret.example.yaml` +
`dev-k8s.sh` / the sealed-secrets controller.

**Workstream:** an ingress + secrets + autoscaling operator section; fix the orphaned HPA and the
incomplete `secret.example.yaml` (these are config bugs, not just doc gaps); document the dev-only
mongodb/elasticsearch or remove them if unused.

---

## Agent CLI - best covered, one flag wrong

**10 leaf commands (8 `parse` subcommands + `validate` + `watch`); every command is named in
`agent/cli-reference.md`.** This is the best-documented surface. Two gaps remain:

- **`--verbose` is documented in a form that does not exist.** All 8 `parse` subcommands and
  `validate` declare `verbose: int = 0`, which Typer exposes as `--verbose INTEGER` (no `-v` short,
  not a count flag). The docs instead show `-v` / `-vv` examples on these commands, which error. The
  real option is undocumented; the documented form is invalid. (This is the same root cause as a
  code inconsistency logged in REPORT.md.)
- **The `smartem.agent-cleanup` console script** (`smartem_backend.agent_data_cleanup:main`,
  pyproject.toml) is agent-named tooling but is entirely absent from the corpus.

**Workstream:** correct the verbose-flag documentation (or, preferably, fix the code so `-v`/`-vv`
works uniformly - see REPORT.md); document `agent-cleanup`.

---

## What this feeds into the rework

Coverage and drift together give the two inputs the rework needs. Ranked by size of gap:

1. **Write a `docs/frontend/` section from scratch** - 16 routes + shell, currently 0% covered, with
   the only existing material actively misleading (legacy/`/sessions` paths). Biggest single hole.
2. **Add a backend endpoint reference and regenerate the spec** - frame the resource groups
   (`/debug`, agent SSE, processing-feedback, predictions/latent) in prose; regenerate the stale
   committed OpenAPI spec so it includes `micrograph_image`; document the 4 backend CLI tools.
3. **Complete the env-var reference** - add the 13 runtime tunables, split app-config from
   deploy/infra vars, prune the 8 stale tokens.
4. **Add a Kubernetes operator section** - ingress, secrets (all required keys), autoscaling,
   `/dls` mount; and fix the two config bugs surfaced here (orphaned HPA, incomplete
   `secret.example.yaml`).
5. **Fix the agent CLI verbose docs** and document `agent-cleanup`.

Items 2, 4 also surfaced **real defects** (stale committed spec, orphaned HPA, incomplete secret
example) - worth their own issues alongside the doc work, exactly as the code bugs in REPORT.md are.

## Reproduce

This pass enumerated each surface from source and diffed against the docs corpus. It is
re-runnable by re-enumerating and re-grepping:

```bash
# Agent CLI        - smartem-decisions/src/smartem_agent/__main__.py (Typer app)
# Backend API      - smartem-decisions/src/smartem_backend/api_server.py + cli/*.py
# Env vars         - grep os.getenv/os.environ across smartem-decisions; VITE_ in smartem-frontend
# Kubernetes       - smartem-devtools/k8s/environments/*/ + hpa.yaml + secret.example.yaml
# Frontend routes  - smartem-frontend/apps/smartem/src/routes + routeTree.gen.ts
# ...each item grepped against smartem-devtools/docs/**
```
