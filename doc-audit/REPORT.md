# Documentation Drift Audit

First input to the documentation rework. Every published how-to / reference / tutorial doc was sliced into **content atoms**, each atom's prose decomposed into individual factual **claims**, and every claim checked against the real repositories. This report says, claim by claim, **what to reuse, what to fix, and what to bin.**

## What this audit does and does not cover

This covers exactly one axis of the rework: **is what is written true?** It deliberately does **not** cover:

- **Coverage gaps** - system surface that is undocumented (commands, endpoints, env vars, resources that exist but appear in no doc). A true claim can sit next to a large hole.
- **Structure and consistency** - grouping, navigation, terminology, duplication across pages.

Both are tracked as follow-up workstreams at the foot of this report. A claim being `true` means *accurate*, not *sufficient*.

## Results

Corpus: **64** docs -> **2,560** content atoms. Verifiable subset (how-to / reference / tutorial): **34** files, **1,506** atoms -> **960** factual claims. ADR and design docs are parked - they record decisions at a point in time, so divergence means *superseded*, not *wrong*.

| Verdict | Claims | Share | Meaning |
|---|--:|--:|---|
| **true** | 763 | 79% | reuse as-is - matches the code |
| **misleading** | 119 | 12% | right fact, drifted context - fix in place |
| **incorrect** | 56 | 6% | false as written - rewrite or bin |
| **unverifiable** | 22 | 2% | needs a live system or human intent |
| | **960** | | |

**79% of documented claims are true.** The rewrite is worth doing for structure and coverage, but most existing prose is salvageable - this report marks exactly which atoms to keep, so the rework is a re-organise-and-fill exercise, not a blank page.

### Dominant failure mode: repo-split drift, not error

Most non-true claims are `misleading`, not `incorrect`. Developer tooling (`scripts/k8s`, `tests/e2e`, `env-examples`, k8s manifests) was moved out of `smartem-decisions` into `smartem-devtools`, so many documented commands and paths point at the wrong repository. The facts are right; the surrounding instructions need re-homing.

### Dead documentation (describes removed components)

`docs/athena/index.md` and `docs/athena-decision-service-api-spec.README.md` document the `athena_api` package, its mock server and generated client - all **deleted under ADR 0015**. These pages should be removed or rewritten, not fixed.

### Code / doc mismatches worth a code fix

Because verification runs the commands and reads the source, it caught the *code* diverging from the *docs*:

- Agent `validate` exits `0` on an invalid directory, though the docs promise `1` - the handler returns `not is_valid` but Typer ignores command return values, so no non-zero exit is raised.
- The documented `--log-file` flag is a no-op: it is declared but never wired to the watcher, so no log file is written.
- `-v` / `--verbose` is inconsistent across agent subcommands - only `watch` accepts a repeatable `-v`; `parse` and `validate` take a bare `--verbose INTEGER`, so documented `-v` / `-vv` examples error.

## Interactive triage view

An interactive, filterable version of this data is published as a Claude artifact: <https://claude.ai/code/artifact/78ab2dc6-03f4-4fa1-8f50-e8e0998726aa>

> Note: that link renders only for the artifact owner's Claude account - GitHub sanitises embedded HTML/JS, so this Markdown report is the public-visible equivalent. Open `doc-audit/drift-map.html` locally for the same view.

## Files ranked by drift

| File | Kind | Claims | Wrong | Drift | Reusable |
|---|---|--:|--:|--:|--:|
| `backend/http-api-client.md` | reference | 30 | 13 | 1 | 16 |
| `operations/setup-smartem-workspace.md` | howto | 77 | 12 | 18 | 47 |
| `operations/publish-smartem-workspace-to-pypi.md` | howto | 22 | 11 | 1 | 10 |
| `backend/api-documentation.md` | reference | 21 | 7 | 2 | 12 |
| `athena-decision-service-api-spec.README.md` | reference | 14 | 4 | 3 | 7 |
| `operations/container-user-configuration.md` | howto | 49 | 2 | 15 | 30 |
| `operations/logging.md` | howto | 23 | 2 | 8 | 7 |
| `agent/cli-reference.md` | reference | 87 | 1 | 7 | 79 |
| `development/github-labels.md` | howto | 39 | 1 | 6 | 32 |
| `development/generate-docs.md` | howto | 17 | 1 | 2 | 14 |
| `operations/run-container.md` | howto | 11 | 1 | 1 | 9 |
| `athena/index.md` | reference | 6 | 1 | 0 | 5 |
| `operations/environment-variables.md` | howto | 36 | 0 | 11 | 25 |
| `agent/deployment.md` | reference | 37 | 0 | 9 | 28 |
| `development/e2e-simulation.md` | howto | 70 | 0 | 7 | 62 |
| `operations/releasing.md` | howto | 54 | 0 | 5 | 49 |
| `operations/containerization.md` | howto | 15 | 0 | 4 | 11 |
| `backend/database.md` | reference | 38 | 0 | 3 | 35 |
| `agent/troubleshooting.md` | reference | 35 | 0 | 3 | 32 |
| `database-schema-drift-prevention.md` | reference | 35 | 0 | 3 | 32 |
| `development/local-keycloak.md` | howto | 47 | 0 | 2 | 44 |
| `agent/authentication.md` | reference | 40 | 0 | 2 | 38 |
| `operations/kubernetes-secrets.md` | howto | 35 | 0 | 2 | 27 |
| `operations/kubernetes.md` | howto | 18 | 0 | 2 | 16 |
| `development/tools.md` | howto | 34 | 0 | 1 | 33 |
| `development/contributing.md` | howto | 1 | 0 | 1 | 0 |
| `getting-started/for-developers.md` | tutorial | 14 | 0 | 0 | 13 |
| `glossary.md` | reference | 14 | 0 | 0 | 9 |
| `operations/index.md` | howto | 10 | 0 | 0 | 10 |
| `backend/index.md` | reference | 8 | 0 | 0 | 8 |
| `agent/index.md` | reference | 7 | 0 | 0 | 7 |
| `development/index.md` | howto | 7 | 0 | 0 | 7 |
| `getting-started/index.md` | tutorial | 5 | 0 | 0 | 5 |
| `backend/api-server.md` | reference | 4 | 0 | 0 | 4 |

## Claim-level detail

Per file, the actionable claims (`incorrect` first, then `misleading`) with the evidence found. Files that are fully `true` are omitted.

<details><summary><b>backend/http-api-client.md</b> &mdash; 13 wrong, 1 drift (of 30)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| incorrect | 119-127 | update_acquisition(id, AcquisitionUpdateRequest) updates by id using a two-argument call. | api_client.py:420 def update_acquisition(self, acquisition: AcquisitionData) is single-arg and converts via acquisition_to_request; no (id, update) form; passing AcquisitionUpdateRequest fails on .in… |
| incorrect | 147-190 | Nested entities are created via create_acquisition_grid(acq.id, grid), create_grid_gridsquare(grid.id, gs), create_gridsquare_foilhole(gs.id, fh), create_foilh… | create_* methods take a single entity arg, not (parent_id, entity); method is create_gridsquare_foilholes (plural); GridSquareData has gridsquare_id+grid_uuid (no id); GridData needs data_dir+acquisi… |
| incorrect | 194 | The client maintains compatibility with the existing EntityStore API. | No 'EntityStore' reference anywhere in api_client.py or src/; no compatibility layer exists |
| incorrect | 196-202 | The client exposes a generic create(entity_type, id, data, parent=...) EntityStore-compat method. | No 'def create(' method on SmartEMAPIClient; only specific create_acquisition/create_*_* methods exist |
| incorrect | 208-215 | HTTP errors are raised as httpx.HTTPStatusError and should be caught as such. | Client uses the requests library (api_client.py:10); it raises requests.HTTPError via raise_for_status; httpx is never imported |
| incorrect | 233-236 | `await client._request("get", "status")` returns a raw API response. | api_client.py:290 def _request (synchronous, not async); awaiting it raises TypeError; the sync call _request('get','status') is what actually works |
| incorrect | 240 | The client maintains a cache mapping entity IDs to database IDs. | No id-mapping cache exists; no _get_db_id/_store_entity_id_mapping/id_map/db_id in api_client.py or src/ |
| incorrect | 242-248 | The client exposes _get_db_id(entity_type, id) and _store_entity_id_mapping(...) methods. | Neither _get_db_id nor _store_entity_id_mapping exists anywhere in the repo src/ |
| incorrect | 50-62 | The client supports async context-manager use (`async with ... as client`) and `await client.aget_status()`. | Only sync __enter__/__exit__ (api_client.py:283-287); no __aenter__/__aexit__ and no aget_status; sync get_status exists (line 397) |
| incorrect | 66-67 | All operations have async variants prefixed with `a` (e.g. aget_status vs get_status). | No aget_* methods exist on SmartEMAPIClient; all entity methods are synchronous (def, not async def) |
| incorrect | 69-75 | `await client.aget_acquisitions()` is available alongside get_acquisitions(). | get_acquisitions exists (api_client.py:406) but aget_acquisitions does not exist anywhere |
| incorrect | 7-9 | The client supports both synchronous and asynchronous operations. | SmartEMAPIClient has no async methods; only 'async def stream_instructions_async' exists on the separate SSEAgentClient (api_client.py:832) |
| incorrect | 81-102 | create_acquisition accepts AcquisitionData, returns an object with .id, and alternatively accepts an AcquisitionCreateRequest(id=..., name=...). | create_acquisition always calls EntityConverter.acquisition_to_request needing AcquisitionData.instrument, so a request model fails; response is AcquisitionResponse with .uuid not .id; AcquisitionCre… |
| misleading | 106-115 | get_acquisitions() and get_acquisition(id) return objects exposing .id, .name and .status. | get_acquisitions/get_acquisition exist (api_client.py:406,416); AcquisitionResponse has name/status but exposes .uuid, not .id (http_response.py) |

</details>

<details><summary><b>operations/setup-smartem-workspace.md</b> &mdash; 12 wrong, 18 drift (of 77)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| incorrect | 162-164 | aria-reference preset contains 20+ repositories. | presets.aria-reference.repos=[fandanGO-cryoem-dls, FragmentScreen/* (6), aria-php/data-deposition-api] -&gt; resolves to ~8 repos, not 20+ |
| incorrect | 171-174 | aria-reference includes all GitlabAriaPHP/aria-* PHP repositories. | Only aria-php/data-deposition-api is listed; the other 18 aria-php repos are NOT in the preset |
| incorrect | 209-212 | init fails if the target directory exists and is not empty (safety measure). | bootstrap_workspace: workspace_path.mkdir(parents=True, exist_ok=True); no emptiness/'not empty' check anywhere in package |
| incorrect | 261 | A --ssh flag clones repositories using SSH instead of HTTPS. | No --ssh option; init defines --git-ssh and --git-https (and sync too). '--ssh' does not exist |
| incorrect | 286 | A --skip-claude flag disables Claude Code configuration. | No --skip-claude option; Claude is opt-in via --with-claude (skip_claude = not with_claude), skipped by default |
| incorrect | 461-467 | 7 skills are linked: database-admin, devops, technical-writer, git, github, ascii-art, playwright-skill. | config lists 5 skills: database, devops, tech-writer, git, playwright; skills dir has database/devops/git/tech-writer(+playwright). No github/ascii-art/database-admin |
| incorrect | 557 | Documentation lives in smartem-devtools/docs/how-to/. | No docs/how-to directory; docs/ has agent, api, architecture, athena, backend, development, getting-started, operations, decision-records |
| incorrect | 564-568 | docs/how-to/ contains run-backend.md, run-e2e-dev-simulation.md, database-migrations.md, deploy-kubernetes.md. | None of run-backend.md/run-e2e-dev-simulation.md/database-migrations.md/deploy-kubernetes.md exist anywhere in smartem-devtools/docs |
| incorrect | 604-612 | Frontend tests run with `npm test` in smartem-frontend. | package.json has no 'test' script (scripts: dev, dev:mock, build, typecheck, lint, format, check...); npm test would fail |
| incorrect | 707-716 | init errors with 'Target directory ... is not empty' when the directory is not empty. | No 'not empty' string or emptiness guard exists; bootstrap uses mkdir(exist_ok=True) and proceeds |
| incorrect | 721-730 | init errors 'Repository ... already exists' when a repo directory is present. | clone_repo: if repo_path.exists(): prints 'Skipping {repo} (already exists)' and returns True - it does not error |
| incorrect | 904-907 | Read .github/CONTRIBUTING.md in smartem-devtools before contributing. | No .github/CONTRIBUTING.md (or any CONTRIBUTING.md) in smartem-devtools; contributing guide is docs/development/contributing.md |
| misleading | 13-17 | init sets up Claude Code configuration and Serena MCP server as part of the default run. | cli.py init: skip_claude = not with_claude; --with-claude defaults False, and Serena only runs 'if ... claude_config' -&gt; both skipped by default |
| misleading | 209-212 | init creates repos/, claude-config/, tmp/, testdata/ subdirectories. | workspace.py creates repos/,tmp/,testdata/,testdata/dls-filesystem/; claude-config is a symlink only created under --with-claude |
| misleading | 267 | The default git transport is HTTPS. | use_ssh defaults None = auto-detect: GitHub repos use SSH when SSH auth works, else HTTPS. Not a fixed HTTPS default |
| misleading | 297-301 | --skip-claude skips .claude/ creation, skills symlinking, settings/permissions config, and CLAUDE.md creation. | Describes the default (Claude off) behaviour under a non-existent flag; also file created is settings.local.json and CLAUDE.md is a symlink |
| misleading | 326-333 | The interactive preset menu offers minimal, smartem-core, aria-reference, full, custom with sizes and repo counts. | select_preset renders a Rich table (Option/Preset/Description/Repos); presets match but no MB sizes shown and aria-reference '20+' is wrong (~8) |
| misleading | 359-371 | A target-directory confirmation lists dirs to create and asks 'Continue? (Y/n)'. | Actual prompt is confirm('Proceed with setup?'); no 'This will create' listing; claude-config only under --with-claude |
| misleading | 387-397 | Configuration output reports 'Linked 7 skills' and 'Indexed repositories'. | config has 5 skills not 7; setup_mcp_config only writes .serena/project.yml + .mcp.json, there is no repository indexing step |
| misleading | 423-454 | Workspace tree includes .claude/settings.json, .claude/permissions.json, tmp/logs, tmp/simulations, testdata/epu-output, README.md. | Actual: .claude/settings.local.json (no settings.json/permissions.json), testdata/dls-filesystem (no epu-output), no tmp/logs\|simulations, no README.md created; org dirs/GitlabAriaPHP correct |
| misleading | 470-473 | The tool configures Claude Code settings: type checking, 120-char lines, British English, no emojis. | settings.local.json only contains {permissions, enabledMcpjsonServers:['serena']}; none of these style settings are written by the tool |
| misleading | 476-478 | Configured permissions grant read access to all repo files, write to appropriate dirs, execute for dev scripts. | defaultPermissions.allow = Bash(git:*),Bash(ls:*),Bash(cat:*),WebSearch,mcp__serena__*,mcp__chrome-devtools__* - not the read/write/execute scheme described |
| misleading | 574-579 | Backend dev setup runs ./scripts/k8s/dev-k8s.sh up from within smartem-decisions. | smartem-decisions has no scripts/ dir; dev-k8s.sh lives at smartem-devtools/scripts/k8s/dev-k8s.sh (moved). uv sync/.venv steps are fine |
| misleading | 593-596 | ls .claude/skills/ should show symlinks to all 7 skills. | Only 5 skills are configured/linked, not 7 |
| misleading | 620-622 | `smartem-workspace add &lt;org/repo&gt;` adds a single repository to an existing workspace. | add command exists but is a stub: prints '[yellow]Not implemented yet: {repo}' and raises typer.Exit(1) |
| misleading | 654-657 | status shows current branch, uncommitted changes, and commits ahead/behind remote. | get_repo_status returns {branch, has_changes, path} only; no ahead/behind computation exists |
| misleading | 772-774 | Setting GITHUB_TOKEN increases the rate limit for fetching configuration. | No GITHUB_TOKEN/Authorization usage in code; config fetched from raw.githubusercontent.com (not the rate-limited API), so the token has no effect on config fetch |
| misleading | 859-862 | Broken skills can be fixed with `ln -sf ../../claude-config/shared/skills/database-admin database-admin`. | Skill is named 'database' not 'database-admin'; source path is claude-code/shared/skills/database (claude-config symlinks to claude-code) |
| misleading | 877-879 | How-to guides are at repos/DiamondLightSource/smartem-devtools/docs/how-to/. | docs/how-to/ does not exist; guides are under docs/operations, docs/development etc. Site URL base is plausible |
| misleading | 895-900 | Run the backend with ./scripts/k8s/dev-k8s.sh up. | dev-k8s.sh is at smartem-devtools/scripts/k8s/dev-k8s.sh, not in the backend (smartem-decisions has no scripts dir) |

</details>

<details><summary><b>operations/publish-smartem-workspace-to-pypi.md</b> &mdash; 11 wrong, 1 drift (of 22)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| incorrect | 128-132 | The publish workflow expects a GitHub secret named PYPI_API_TOKEN. | grep PYPI_API_TOKEN/secrets.PYPI in .github/workflows = none; publish uses OIDC trusted publishing (release-smartem-workspace.yml:236-237) |
| incorrect | 134-138 | The workflow uses a GitHub secret named TEST_PYPI_API_TOKEN to publish to TestPyPI. | grep TEST_PYPI_API_TOKEN/testpypi in .github/workflows = none; no TestPyPI publish job exists |
| incorrect | 22-27 | CI authentication from GitHub Actions requires API tokens stored as GitHub Secrets. | publish uses PyPI Trusted Publishing (pypa/gh-action-pypi-publish@release/v1 + permissions id-token:write); no token secret |
| incorrect | 398 | CI handles version bumping automatically with commitizen. | no commitizen anywhere (grep=none); version read from pyproject.toml, RC suffix = rc${run_number} via sed (workflow:51,89,197-198) |
| incorrect | 438-440 | The workflow sets TWINE_PASSWORD: ${{ secrets.PYPI_API_TOKEN }}. | no TWINE/secrets.PYPI in workflows; twine only used for 'uvx twine check dist/*' metadata check (workflow:206), upload via pypa action |
| incorrect | 455-467 | The CI version bump is driven by conventional commits (feat-&gt;minor, fix-&gt;patch, BREAKING CHANGE-&gt;major) since the last tag. | no conventional-commit/semver bumping; version fixed from pyproject.toml, RC=base+rc&lt;run_number&gt;; stable requires tag==pyproject version (workflow:51,68-107) |
| incorrect | 505-511 | The GitHub Actions workflow uses env TWINE_USERNAME=__token__ and TWINE_PASSWORD=secrets.PYPI_API_TOKEN/TEST_PYPI_API_TOKEN. | release-smartem-workspace.yml has no TWINE_* env; publish via pypa/gh-action-pypi-publish (OIDC), no token secrets |
| incorrect | 515-520 | Triggers: push to main -&gt; TestPyPI (TEST_PYPI_API_TOKEN); tag smartem-workspace-v* -&gt; PyPI (PYPI_API_TOKEN); PR -&gt; no publish; workflow_dispatch -&gt; no publish. | push to main -&gt; RC GitHub release only (no TestPyPI); tag correct pattern but publish via OIDC not token; workflow_dispatch DOES release rc/stable (workflow:14-23,78-107,218-222) |
| incorrect | 528-540 | Every push to main with package changes uploads the package to TestPyPI. | push to main produces an RC GitHub prerelease only (create-release, should_release); PyPI publish gated on is_stable; no TestPyPI (workflow:78-92,218-244) |
| incorrect | 565-568 | A GitHub 'testpypi' environment (URL test.pypi.org/p/smartem-workspace) inherits TEST_PYPI_API_TOKEN. | no testpypi environment or TestPyPI flow in workflow; only 'pypi' environment defined (workflow:223-225) |
| incorrect | 570-573 | The pypi environment inherits/uses the PYPI_API_TOKEN secret. | publish uses OIDC trusted publishing (id-token:write + pypa action), not a PYPI_API_TOKEN secret (workflow:226-237) |
| misleading | 22 | GitHub Actions automatically publishes smartem-workspace to both PyPI and TestPyPI. | workflow publishes to PyPI only (publish-pypi, is_stable); no TestPyPI job; grep testpypi in .github/workflows = none |

</details>

<details><summary><b>backend/api-documentation.md</b> &mdash; 7 wrong, 2 drift (of 21)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| incorrect | 148 | The Athena API includes a full mock server for development. | Mock server (README lists src/athena_api/mock/server.py) absent; no AthenaAPIServer in code; removed commit 5967ec7 |
| incorrect | 150-158 | Create a mock via 'from athena_api.mock import AthenaAPIServer' and server.run(host,port=8080). | athena_api.mock module absent workspace-wide; AthenaAPIServer only appears in doc files, not code; removed commit 5967ec7 |
| incorrect | 162 | A Python client library provides programmatic access to the API. | athena_api client library absent; src/athena_api removed (commit 5967ec7); AthenaClient only in doc files |
| incorrect | 164-184 | Use 'from athena_api import AthenaClient' with athena_api.model.request.Session and client.register_session(). | athena_api, AthenaClient and register_session exist only in this doc, not in any code; module removed commit 5967ec7 |
| incorrect | 26-38 | Run mock locally via pip install -e '.[mock]' then 'from athena_api.mock import AthenaAPIServer' serving :8000/docs. | No [mock] extra in pyproject.toml; no athena_api module anywhere; removed in commit 5967ec7 'Remove backend-side Athena integration' |
| incorrect | 70-73 | Our implementation is a Python client and mock server generated from the Athena spec. | src/athena_api client+mock absent; README points to nonexistent src/athena_api/; removed commit 5967ec7 (architectural violation) |
| incorrect | 75-78 | The SmartEM Core API is implemented with Django. | No 'django' reference in pyproject.toml, setup.py or src/; backend is FastAPI, not Django |
| misleading | 119-122 | POST /api/v1/AlgorithmResult saves processing outcomes. | No /api/v1/AlgorithmResult path in spec; only GET /api/v1/Session/{sessionId}/AlgorithmResult(s) exists (session-scoped, read-only) |
| misleading | 84-86 | The SmartEM swagger is cached here automatically by the backend per ADR 0020. | ADR 0020 exists but its Context states 'three independently committed copies with no automation keeping them in step' (manual, not automatic) |

</details>

<details><summary><b>athena-decision-service-api-spec.README.md</b> &mdash; 4 wrong, 3 drift (of 14)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| incorrect | 20-23 | A generated Python client and a mock server are available to use for Athena integration/testing. | No src/athena_api client and no athena mock server.py anywhere; only stale git branch agent_athena_api_integration_draft references athena |
| incorrect | 47-50 | The Python client is at src/athena_api/client.py. | No athena_api package or client.py exists anywhere under repos/ (find/grep both empty) |
| incorrect | 47-50 | The mock server is at src/athena_api/mock/server.py. | find -iname server.py -path *athena* returns nothing; no src/athena_api/mock anywhere |
| incorrect | 9-12 | A generated Python client exists at src/athena_api/. | No athena_api dir or path anywhere; smartem-decisions/src has smartem_agent/api/backend/common only; grep athena in src returns nothing |
| misleading | 29-31 | This spec file is processed by tools/generate_api_docs.py. | Script exists but at smartem-decisions/tools/generate_api_docs.py; doc+spec live in smartem-devtools which has no tools/ dir (cross-repo drift) |
| misleading | 37-43 | Run `python tools/generate_api_docs.py` to update the documentation. | Command's tools/generate_api_docs.py resolves only in smartem-decisions, not the smartem-devtools repo where this doc+spec+docs/api/athena live |
| misleading | 47-50 | The generation script is tools/generate_api_docs.py. | Script exists only at smartem-decisions/tools/generate_api_docs.py, a different repo than the smartem-devtools doc referencing it as tools/... |

</details>

<details><summary><b>operations/container-user-configuration.md</b> &mdash; 2 wrong, 15 drift (of 49)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| incorrect | 74-78 | The container will execute processes as the custom user, not root. | No USER instruction in Dockerfile or Dockerfile.dev; ENTRYPOINT runs as root unless k8s securityContext.runAsUser overrides |
| incorrect | 85-89 | In custom user mode the container runs with limited (non-root) privileges. | No USER in Dockerfile; real k8s http-api manifests set no runAsUser, so container runs as root even when built with custom UID/GID |
| misleading | 130-133 | When /dls is not mounted, image serving endpoints return 404 errors for paths referencing /dls. | api_server.py:2742 stat() on a missing file raises FileNotFoundError -&gt; HTTP 500, not 404; 404 only when DB image_path is null (:2788) |
| misleading | 162-165 | If the file does not exist the endpoint returns 404 or a filesystem error. | api_server.py:2742 unguarded source_path.stat() -&gt; FileNotFoundError propagates as HTTP 500, not 404 |
| misleading | 162-165 | If permissions are denied the endpoint returns a 500 error with permission details. | PermissionError from stat()/read yields a generic 500 'Internal Server Error'; no permission details are exposed in the response |
| misleading | 188 | All files in the container are owned by the specified custom user. | Prod Dockerfile:56 only chowns entrypoint.sh; /venv,/app,alembic.ini remain root-owned. True only for Dockerfile.dev:80-81 |
| misleading | 190-197 | `ls -la /app` and `ls -la /venv` show smartem:smartem ownership in a custom-user build. | Prod Dockerfile does not chown /app or /venv (would show root:root). Only Dockerfile.dev:80-81 produces smartem-owned /app,/venv |
| misleading | 205-214 | Local dev builds smartem-decisions:dev and runs it with -p 8000:8000 -e ROLE=api -e POSTGRES_HOST=... . | Run env is correct (entrypoint.sh:15 ROLE default api, :20 port 8000; POSTGRES_HOST required utils.py:105) but build omits required SMARTEM_VERSION so it fails |
| misleading | 218-222 | CI (GitHub Actions) builds as root by default and pushes to ghcr.io/diamondlightsource/smartem-decisions. | Root-default + ghcr.io/diamondlightsource/smartem-decisions correct, but real CI passes SMARTEM_VERSION (release-smartem-decisions.yml:497) and tags version/latest not $GITHUB_SHA; doc command omits … |
| misleading | 226-238 | Staging build passes groupid/userid=1001 and pushes ghcr.io/diamondlightsource/smartem-decisions:staging. | Build-arg/tag/push syntax valid but command omits required SMARTEM_VERSION -&gt; build fails (Dockerfile:52) |
| misleading | 242-254 | Production build passes groupid/userid=5000 and pushes ghcr.io/diamondlightsource/smartem-decisions:production. | Build-arg/tag/push valid but command omits required SMARTEM_VERSION -&gt; build fails (Dockerfile:52) |
| misleading | 308 | The Dockerfile sets ownership while Kubernetes securityContext provides additional enforcement. | No USER instruction, so non-root at runtime comes ENTIRELY from k8s securityContext.runAsUser, not as 'additional' enforcement over the Dockerfile |
| misleading | 37-47 | `docker build -t smartem-decisions .` builds a root image, equivalent to passing groupid=0 userid=0 groupname=root. | Build-arg equivalence is correct, but command omits required SMARTEM_VERSION (Dockerfile:52 pip install ==${SMARTEM_VERSION}) so build fails as written |
| misleading | 373-381 | `docker run --rm smartem-decisions:dls id` outputs uid=5000(smartem) gid=5000(smartem). | No USER instruction in Dockerfile, so `docker run ... id` reports uid=0(root), not 5000; UID switch happens only via k8s securityContext |
| misleading | 394-401 | Rebuild with --build-arg groupid/userid=5000 groupname=smartem; docker inspect shows Args. | Rebuild command omits required SMARTEM_VERSION -&gt; build fails (Dockerfile:52); build-arg names otherwise valid |
| misleading | 65-72 | Custom build passes groupid/userid/groupname to create a non-root user image. | Build-arg names/values correct but command omits required SMARTEM_VERSION -&gt; pip install ==&lt;empty&gt; fails (Dockerfile:52) |
| misleading | 74-78 | All application files (/venv, /app, /entrypoint.sh) are set to be owned by the custom user. | Prod Dockerfile:56 only --chown on entrypoint.sh; /venv (:49) and /app (:54-55) stay root-owned. Only Dockerfile.dev:80-81 chowns all three |

</details>

<details><summary><b>operations/logging.md</b> &mdash; 2 wrong, 8 drift (of 23)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| incorrect | 150 | The agent's --log-file parameter creates structured JSON logs suitable for analysis. | log_file appears only at __main__.py:177 as a CLI default; never passed to watcher or used - no log file is created |
| incorrect | 152-167 | The JSON log has fields timestamp, event_count and events[] with event_type/source_path/relative_path/size/modified. | fs_watcher.py:462-472 status log has queue_size,events_processed,successful,orphaned,failed,orphans_*; no event_count/events/source_path exist |
| misleading | 10-22 | consumer and api_server both take -v (INFO) and -vv (DEBUG), default ERROR. | consumer.py:1258-1263 -v/-vv OK; api_server __main__:3000-3006 has no argparse, -v/-vv silently ignored (only SMARTEM_LOG_LEVEL) |
| misleading | 121-125 | Dev: 'watch /data -vv' and 'api_server -vv' both enable DEBUG logging. | watch -vv OK; api_server has no argparse (__main__:3000-3006) so -vv is ignored, level stays SMARTEM_LOG_LEVEL/ERROR |
| misleading | 128-132 | Testing: 'watch /data -v' and 'api_server -v' both enable INFO logging. | watch -v OK; api_server -v ignored (no argparse), level unchanged; correct method is SMARTEM_LOG_LEVEL=INFO |
| misleading | 135-145 | Production: default commands log at ERROR; watch --log-file with --log-interval and -v rotates operational logs. | defaults ERROR OK, --log-interval/-v OK, but --log-file is never used (no file written); __main__.py:177 is its only reference |
| misleading | 25 | All agent commands support consistent verbosity flags. | only watch uses typer.Option('-v',count=True) (__main__.py:194); validate/parse use plain verbose:int=0 -&gt; --verbose only, no -v |
| misleading | 27-41 | agent watch/validate/parse commands all accept -v and -vv. | watch -v/-vv work; validate/parse decl verbose:int=0 -&gt; Typer exposes --verbose not -v, so 'validate ... -v' and 'parse dir ... -vv' error |
| misleading | 47-60 | watch accepts --log-file, --log-interval, --agent-id, --session-id, --heartbeat-interval and writes to the log file. | all options exist (__main__.py:177-196) but log_file is never passed to watcher/used anywhere - grep shows only the decl line, so --log-file is a no-op |
| misleading | 7 | The -v and -vv flags control verbosity across all SmartEM components. | consumer &amp; agent watch accept -v/-vv, but api_server has no argparse and agent parse/validate use --verbose int only |

</details>

<details><summary><b>agent/cli-reference.md</b> &mdash; 1 wrong, 7 drift (of 87)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| incorrect | 224-226 | validate exits 1 when directory structure is invalid. | validate of invalid dir returned exit=0 (Typer ignores 'return not is_valid'; no typer.Exit raised) |
| misleading | 229-231 | Example `validate &lt;dir&gt; -v` runs validate with verbose. | validate rejects '-v': 'No such option: -v' exit 2; base command valid without -v |
| misleading | 379-381 | The agent writes structured JSON logs of all detected file changes to the --log-file path. | log_file only appears at __main__.py:177; never passed to SmartEMWatcherV2 or used to write a file |
| misleading | 383 | The log file records file creation/modification events, timestamps, sizes, processing status. | describes the fs_changes.log file, but --log-file is unwired; no such file is written by the agent |
| misleading | 435 | All EPU-processing commands use consistent file pattern matching to identify relevant files. | only watch scans a dir via DEFAULT_PATTERNS; parse subcommands take an explicit file/dir path, no pattern match |
| misleading | 453-460 | Exit codes: 0 success; 1 validation error/API/dir-not-found/permission; 2 keyboard interrupt. | dir-not-found &amp; API = typer.Exit(1) OK; but validation invalid gives exit 0 (verified); Ctrl+C handler raises typer.Exit() -&gt; 0, not 2 |
| misleading | 51-53 | Example `parse dir &lt;dir&gt; -v` runs the command with verbose flag. | '-v' not defined on parse: errors 'No such option: -v' exit 2; base command valid without -v |
| misleading | 75-77 | Example `parse grid &lt;dir&gt; -vv` runs with debug verbosity. | parse subcommands define bare 'verbose:int=0' (no -v short); -vv errors 'No such option' |

</details>

<details><summary><b>development/github-labels.md</b> &mdash; 1 wrong, 6 drift (of 39)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| incorrect | 215 | If a label creation fails because it already exists, the script continues; run `--verbose` for details. | Sync loop has no try/catch (sync-labels.ts:361-376); createLabel error propagates to main().catch -&gt; process.exit(1); --verbose only lists conforming labels |
| misleading | 14 | Labels are defined in `core/github-labels-config.ts`. | No .ts config; actual file is core/github-labels.json (imported by core/index.ts line 19) |
| misleading | 142 | Push to main runs `--check` when `core/github-labels-config.ts` or `scripts/github/**` changes. | gitflow.yml push paths are core/github-tags-config.ts (nonexistent) + scripts/github/**; real config is github-labels.json |
| misleading | 157 | To modify labels, edit `core/github-labels-config.ts`. | Labels are edited in core/github-labels.json; no github-labels-config.ts exists |
| misleading | 47-58 | The system-component labels are the ten listed (backend/agent/frontend/aria/devtools families). | 10 rows match, but config systemComponents[] has 12; doc omits component:epuplayer &amp; component:smartem-workspace |
| misleading | 69 | Assignments live in `core/github-labels-config.ts`. | Assignments are in core/github-labels.json repos[]; no github-labels-config.ts exists |
| misleading | 96-100 | Comparison is against labels defined in `core/github-labels-config.ts`. | Compares vs githubLabels from core/index.ts, sourced from core/github-labels.json, not a .ts config |

</details>

<details><summary><b>development/generate-docs.md</b> &mdash; 1 wrong, 2 drift (of 17)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| incorrect | 37-39 | The webui reads the toctree directives during build to generate the sidebar navigation. | generate-nav-from-docs.ts builds nav by scanning docs/ dir structure + frontmatter title; never parses 'toctree' |
| misleading | 37-39 | The index.md file in each docs/ subdirectory contains toctree directives that define navigation order and grouping. | 6 of 8 index.md have {toctree} (athena/architecture lack it); they are vestigial Sphinx blocks, not the actual nav source |
| misleading | 37-39 | When adding a new page, add its filename (without extension) to the relevant index.md toctree. | nav auto-generated from directory scan; a new .md appears in sidebar without any toctree edit (editing toctree has no effect) |

</details>

<details><summary><b>operations/run-container.md</b> &mdash; 1 wrong, 1 drift (of 11)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| incorrect | 10-13 | Running the container with `--version` checks/prints the version. | entrypoint.sh ignores all CLI args ($@ never used); case ${ROLE:-api} -&gt; defaults to api mode, runs alembic+uvicorn, never prints version |
| misleading | 39-48 | ROLE=worker runs the queue worker, and SMARTEM_LOG_LEVEL=INFO/DEBUG produce INFO/DEBUG worker logging. | worker runs (entrypoint.sh:25 python -m consumer) but consumer.main() sets level from argparse -v/-vv (consumer.py:1257-1263, default ERROR); entrypoint passes no -v and SMARTEM_LOG_LEVEL is never re… |

</details>

<details><summary><b>athena/index.md</b> &mdash; 1 wrong, 0 drift (of 6)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| incorrect | 16-28 | The mock server is started via `pip install -e .[mock]` then `from athena_api.mock import AthenaAPIServer; AthenaAPIServer().run()` on port 8000. | athena_api package DELETED per ADR 0015 (accepted 2026-01-21); no src/athena_api, no AthenaAPIServer in any .py; no [mock] extra in pyproject |

</details>

<details><summary><b>operations/environment-variables.md</b> &mdash; 0 wrong, 11 drift (of 36)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| misleading | 108-110 | Staging is deployed via `DEPLOY_ENV=staging ./scripts/k8s/dev-k8s.sh up`. | DEPLOY_ENV=staging supported (dev-k8s.sh:12,30) but script moved to smartem-devtools/scripts/k8s |
| misleading | 117-120 | Run `cp .env.example.k8s.production .env.k8s.production`. | template moved to smartem-devtools/env-examples/.env.example.k8s.production; bare cp does not resolve |
| misleading | 136-154 | First-time setup: cp .env.example .env; cp .env.example.k8s.development .env.k8s.development; edit; ./scripts/k8s/dev-k8s.sh up; run python -m smartem_backend.… | cp .env.example .env &amp; module valid in smartem-decisions, but .env.example.k8s.development template and dev-k8s.sh moved to smartem-devtools -&gt; block spans two repos |
| misleading | 213-228 | Scenario 1: ./scripts/k8s/dev-k8s.sh up, then .env (POSTGRES localhost:30432, RABBITMQ localhost:30672) is used by host-run python -m smartem_backend modules. | .env NodePorts (localhost:30432/30672) and modules correct, but dev-k8s.sh moved to smartem-devtools/scripts/k8s |
| misleading | 234-248 | Scenario 2: full K8s deploy via ./scripts/k8s/dev-k8s.sh up; pods in namespace smartem-decisions; NodePorts API 30080, Adminer 30808, RabbitMQ UI 30673. | ports (http-api 30080, adminer 30808, rabbitmq 30673) &amp; namespace smartem-decisions correct, but cp template + dev-k8s.sh moved to smartem-devtools |
| misleading | 254-269 | Scenario 3: `./tests/e2e/run-e2e-test.sh` loads .env automatically (the script does `source .env`). | script moved to smartem-devtools/tests/e2e and sources $WORKSPACE_ROOT/.env.local-test-run (line 59), not .env |
| misleading | 26-30 | E2E testing is run via `./tests/e2e/run-e2e-test.sh`. | script moved out of smartem-decisions to smartem-devtools/tests/e2e/run-e2e-test.sh; path unresolvable from decisions checkout |
| misleading | 59-61 | The dev cluster is brought up by running `./scripts/k8s/dev-k8s.sh up`. | script moved to smartem-devtools/scripts/k8s/dev-k8s.sh; `up` action valid but path unresolvable from smartem-decisions |
| misleading | 64-67 | Run `cp .env.example.k8s.development .env.k8s.development` then add DOCKER_USERNAME/EMAIL/PASSWORD. | template moved to smartem-devtools/env-examples/.env.example.k8s.development; bare cp fails (needs env-examples/ prefix / other repo) |
| misleading | 89-90 | .env.k8s.development is used by ./scripts/k8s/dev-k8s.sh to create K8s Secrets and ConfigMaps. | function correct (dev-k8s.sh:28 sources .env.k8s.development, :284 create secret, :359 create configmap) but script moved to smartem-devtools |
| misleading | 97-100 | Run `cp .env.example.k8s.staging .env.k8s.staging`. | template moved to smartem-devtools/env-examples/.env.example.k8s.staging; bare cp does not resolve |

</details>

<details><summary><b>agent/deployment.md</b> &mdash; 0 wrong, 9 drift (of 37)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| misleading | 104-109 | parse session &lt;file&gt; --verbose runs. | parse session cmd exists but --verbose is an INTEGER option; bare --verbose fails; correct form is --verbose 1 |
| misleading | 112-117 | parse atlas &lt;file&gt; --verbose runs. | parse atlas exists; --verbose requires an integer value, bare --verbose errors (needs --verbose 1) |
| misleading | 120-133 | parse gridsquare and parse gridsquare-metadata run, the latter with --verbose. | gridsquare + gridsquare-metadata cmds exist (__main__.py:113,123) but --verbose needs an int value; bare --verbose errors |
| misleading | 136-145 | parse foilhole &lt;file&gt; --verbose and parse micrograph &lt;file&gt; run. | foilhole+micrograph cmds exist (__main__.py:133,143); parse micrograph line ok, but foilhole --verbose fails (needs --verbose 1) |
| misleading | 156-171 | validate &lt;dir&gt; --verbose runs and invalid dirs fail. | validate cmd exists but --verbose is INTEGER; bare --verbose errors 'requires an argument' (needs --verbose 1) |
| misleading | 176-191 | validate &lt;dir&gt; --verbose runs against well-formed directories. | validate cmd exists; --verbose needs an integer argument, bare --verbose fails (correct: --verbose 1) |
| misleading | 200 | Failed validation returns exit code 1 and lists specific issues. | invalid-but-existing dir exits 0, not 1: 'return not is_valid' return value is NOT mapped to Typer exit code; issues are listed (via logging) |
| misleading | 277-282 | epuplayer record &lt;dir&gt; &lt;output.tar.gz&gt; records filesystem events. | record takes ONE positional (directory) + REQUIRED -o/--output; positional output errors: 'the following arguments are required: -o/--output' (needs -o) |
| misleading | 84-97 | parse dir accepts --verbose and --verbose --verbose for debug-level output. | parse dir exists but verbose is --verbose INTEGER (not count); bare --verbose errors 'requires an argument'; --verbose --verbose errors 'not a valid integer' |

</details>

<details><summary><b>development/e2e-simulation.md</b> &mdash; 0 wrong, 7 drift (of 70)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| misleading | 149-165 | Multi runner creates a timestamped results directory under logs/e2e-tests/. | multi:31 TEST_DIR=$WORKSPACE_ROOT/tmp/e2e-logs/... (actual is tmp/e2e-logs, not logs/e2e-tests) |
| misleading | 253-263 | Test results root is logs/e2e-tests/ at repo root (gitignored) with 4 service logs, db-dump.sql and test-params.json. | runners write to tmp/e2e-logs/ (run-e2e-test.sh:30); logs/e2e-tests/ only in smartem-decisions/.gitignore:110 (manual convention) |
| misleading | 342-346 | RabbitMQ default credentials are guest/guest. | rabbitmq.yaml:24-31 RABBITMQ_DEFAULT_USER/PASS from secretKeyRef; env example uses username/password, not guest/guest |
| misleading | 39-48 | The runner creates a timestamped test results directory under logs/e2e-tests/. | run-e2e-test.sh:30 TEST_DIR=$WORKSPACE_ROOT/tmp/e2e-logs/... (actual is tmp/e2e-logs, not logs/e2e-tests) |
| misleading | 408-412 | RABBITMQ_URL=amqp://guest:guest@localhost:30672/ is the consumer's broker URL. | AMQP nodePort 30672 correct; but credentials are username/password per env example / k8s secret, not guest:guest |
| misleading | 792-799 | `curl -u guest:guest http://localhost:30673` reaches the RabbitMQ management UI. | rabbitmq.yaml:92 nodePort 30673 for mgmt UI (port correct); credentials are secret-based username/password, not guest:guest |
| misleading | 808-811 | Consumer broker is RABBITMQ_URL=amqp://guest:guest@localhost:30672/. | AMQP nodePort 30672 correct; credentials username/password per env example / secret, not guest:guest |

</details>

<details><summary><b>operations/releasing.md</b> &mdash; 0 wrong, 5 drift (of 54)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| misleading | 169 | apps/legacy/** is excluded by design from the frontend release. | apps/legacy no longer exists (removed per #136); it is not in the include filters and there is no explicit exclude directive — stale reference |
| misleading | 203-207 | CI generates the API client (npm run api:generate), writes version.json, and runs `npm run build:smartem`. | No `build:smartem` script exists; root script is `build` (npm run build -w @smartem/app) and workflow runs `npm run build` (L165). api:generate + version.json steps are correct |
| misleading | 223-224 | All three workflows support workflow_dispatch with an rc/stable choice via the Actions tab. | There are FOUR release workflows (decisions, epuplayer, workspace, frontend); all four DO have workflow_dispatch inputs.release_type choice rc/stable — the count 'three' is stale |
| misleading | 3 | There are three packages in the SmartEM ecosystem to release. | Doc documents FOUR: smartem-decisions, smartem-epuplayer, smartem-workspace, smartem-frontend; 4 release-*.yml workflows exist |
| misleading | 3 | All releases are tag-driven via GitHub Actions. | RC releases are automatic on push to main (release-*.yml on.push.branches [main]); only stable releases are tag-driven |

</details>

<details><summary><b>operations/containerization.md</b> &mdash; 0 wrong, 4 drift (of 15)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| misleading | 11-17 | The image is built with `docker build -t smartem-decisions .` (or podman equivalent) with default settings. | Root Dockerfile installs PyPI 'smartem-decisions[backend,images]==${SMARTEM_VERSION}'; SMARTEM_VERSION has no default so plain build fails; CI passes --build-arg SMARTEM_VERSION. |
| misleading | 23-37 | DLS build uses --build-arg groupid=1000 userid=1000 groupname=smartem to tag smartem-decisions:dls. | groupid/userid/groupname args exist and are correct, but command omits required --build-arg SMARTEM_VERSION so build fails on current root Dockerfile. |
| misleading | 93 | The Dockerfile uses a multi-stage build process. | Root Dockerfile is single-stage (only 'FROM ... AS runtime', PyPI install); multi-stage build now lives in Dockerfile.dev. |
| misleading | 95-97 | The build has three stages: developer (base+deps), build (installs packages/app code), runtime (slim + built app). | Stages developer/build/runtime match Dockerfile.dev exactly, but not the primary Dockerfile (single-stage); doc points at wrong file. |

</details>

<details><summary><b>backend/database.md</b> &mdash; 0 wrong, 3 drift (of 38)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| misleading | 279-282 | Migration files follow YYYY_MM_DD_HHMM-NNN_description.py where NNN is a sequential migration number. | Only 001-003 use NNN; migrations 004+ use hash revision IDs (33107394dcd1 etc.) and 006 file has no revision token |
| misleading | 34-41 | Migration 003 adds SciFi robot prediction model tables. | 003 inserts SciFi robot TEST DATA into existing qualitypredictionmodel table, not new tables |
| misleading | 34-41 | `upgrade head` applies exactly migrations 001-006 (complete set). | 10 migration files exist through d5e6f7a8b9c0; doc list stops at 006 (4 later migrations undocumented) |

</details>

<details><summary><b>agent/troubleshooting.md</b> &mdash; 0 wrong, 3 drift (of 35)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| misleading | 230-236 | python -m smartem_agent validate /path/to/grid -vv works. | validate_epu_dir(verbose:int=0) is a plain int opt; -v/-vv count only exists on watch (:194); -vv errors here |
| misleading | 244-248 | Required files for a valid EPU dir are EpuSession.dm and Atlas/Atlas.dm. | validate_project_dir requires EpuSession.dm + Metadata + Images-Disc* (fs_parser.py:110-124); Atlas/Atlas.dm is watched but NOT a structural requirement |
| misleading | 253-260 | python -m smartem_agent parse session /path/EpuSession.dm -vv works. | parse session exists (__main__.py:91) but verbose is plain int; -vv flag only defined on watch, so -vv errors here |

</details>

<details><summary><b>database-schema-drift-prevention.md</b> &mdash; 0 wrong, 3 drift (of 35)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| misleading | 18-21 | The CI build fails if any schema changes (drift) are detected. | _schema_drift.yml:11 'continue-on-error: true' (temporarily skipped, issue #181) so job does not fail build |
| misleading | 27-30 | The check is skipped for draft PRs with a [WIP] prefix. | ci.yml:25 skips on PR title startsWith '[WIP]' (title-based, not draft status) |
| misleading | 34 | If drift is detected the CI build fails with a clear error message. | script exits 1 but job has continue-on-error:true (_schema_drift.yml:11); build not failed currently |

</details>

<details><summary><b>development/local-keycloak.md</b> &mdash; 0 wrong, 2 drift (of 47)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| misleading | 106-109 | Mock mode is started with `cd smartem-frontend &amp;&amp; npm run dev:smartem:mock`. | No dev:smartem:mock script; equivalent is `npm run dev:mock` (root -&gt; @smartem/app: VITE_ENABLE_MOCKS=true vite); :smartem aliases removed (#136) |
| misleading | 84 | `npm run dev:smartem` serves config.json via Vite. | No dev:smartem script; root package.json now has bare `dev` (npm run dev -w @smartem/app); :smartem aliases removed with legacy app (#136) |

</details>

<details><summary><b>agent/authentication.md</b> &mdash; 0 wrong, 2 drift (of 40)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| misleading | 95-97 | A distinct 'Token refreshed' log entry is emitted on proactive refresh or 401-forced refresh. | No log labelled 'Token refreshed'; proactive refresh re-emits the 'token fetched' info line; 401 emits warning 'Received 401 ... refreshing token' (api_client.py:269) |
| misleading | 95-97 | An 'Authentication failure' log is emitted when token fetch fails or a request keeps 401ing after a refresh. | Token-fetch failure logged (keycloak_client.py:133 'token fetch failed'); but persistent 401 after refresh is NOT explicitly logged - _send_with_auth just returns the response |

</details>

<details><summary><b>operations/kubernetes-secrets.md</b> &mdash; 0 wrong, 2 drift (of 35)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| misleading | 188-199 | Each env dir contains secrets.yaml and a kustomization.yaml that references secrets.yaml. | kustomization.yaml resources omit secrets.yaml; secrets.yaml not committed (generated by script into the dir) |
| misleading | 357-370 | Files map: scripts/k8s/generate-sealed-secrets.sh, k8s/environments/&lt;env&gt;/{secrets.yaml,kustomization.yaml} where kustomization references secrets.yaml, and k8… | script + k8s/secret.example.yaml exist, but kustomization.yaml does NOT reference secrets.yaml and secrets.yaml is generated (uncommitted) |

</details>

<details><summary><b>operations/kubernetes.md</b> &mdash; 0 wrong, 2 drift (of 18)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| misleading | 49-56 | The k8s/ directory contains environments/{development,staging,production} and a README.md. | environments/ w/ 3 envs present, but NO README.md at k8s/ root (has hpa.yaml + secret.example.yaml instead) |
| misleading | 86 | The 'k8s directory documentation' link (k8s/) resolves to detailed k8s docs. | docs/operations/k8s/ does not exist (broken relative link); repo k8s/ dir exists but has no README/docs page |

</details>

<details><summary><b>development/tools.md</b> &mdash; 0 wrong, 1 drift (of 34)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| misleading | 95-112 | The simulator subcommands take the documented flags, incl. motion-correction/ctf-complete --foilhole-id. | motion_correction (L265) &amp; ctf_complete (L289) expose --gridsquare-id, NOT --foilhole-id as documented; other subcmds/flags correct |

</details>

<details><summary><b>development/contributing.md</b> &mdash; 0 wrong, 1 drift (of 1)</summary>

| Verdict | Line | Claim | Evidence |
|---|---|---|---|
| misleading | 1-2 | The MyST include directive references an existing file at ../../.github/CONTRIBUTING.md relative to the doc. | Resolves to smartem-devtools/.github/CONTRIBUTING.md (absent; dir has only labeler.yml+workflows); real file at smartem-decisions/.github/CONTRIBUTING.md (doc moved out) |

</details>

## Follow-up workstreams (the rest of the rework)

1. **Fix drifted docs** - the 119 `misleading` claims, mostly path/command re-homing to `smartem-devtools`. Near-mechanical; highest reuse-for-effort.
2. **Remove or rewrite dead docs** - the athena pages and the 56 `incorrect` claims.
3. **Coverage-gap analysis** - enumerate the actual system surface (agent CLI commands, backend OpenAPI endpoints, env vars, k8s resources, frontend routes) and diff against what is documented, to find undocumented surface. This audit cannot see those holes.
4. **Restructure and consistency** - regroup by audience/task, unify terminology, dedupe. Use the `true` atoms as reusable material.
5. **File code bugs** - the validate exit-code, `--log-file` no-op, and verbose-flag mismatches above.

## Reproduce

```bash
# 1. Re-slice the docs into content atoms (deterministic)
python doc-audit/atomize.py .   # writes atoms to the workspace tmp dir
# 2. Re-verify claims against the repos (Claude multi-agent pass) -> verdicts.jsonl
# 3. Regenerate this report
python doc-audit/make_report.py
```
