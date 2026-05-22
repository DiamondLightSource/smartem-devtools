# Local Keycloak for SmartEM frontend dev

The SmartEM frontend authenticates against Keycloak. For local development there is a self-contained Keycloak mock under `keycloak-mock/` in this repository. It is offered in two equivalent forms — Docker Compose for quick standalone use, and Kubernetes manifests integrated with the rest of the dev stack — both reading from the same realm export.

The architecture of the auth flow itself is documented in [Keycloak SPA authentication](../architecture/keycloak-spa-authentication.md). This page is the operational counterpart: what to run, when, and how to point the frontend at it.

## Why a mock

The DLS identity servers (`identity.diamond.ac.uk`, `identity-test.diamond.ac.uk`) require explicit registration of every client and origin allowed to authenticate. Local development on `http://localhost:5173` is not registered by default, and getting it added is an admin task that has to be repeated whenever the dev port changes or a new developer joins.

Running a local Keycloak instead:

- removes the round-trip with whoever administers the DLS realm;
- gives every developer the same realm config (checked into version control);
- works offline;
- is deterministic — no stale tokens from yesterday's session, no realm config drift.

The mock realm is **not** intended to be representative of the production DLS realm beyond what the frontend needs (client, scopes, a couple of users, a `fedId` claim mapper). It is a development convenience, not a staging environment.

## Which form to use

| Use Compose when… | Use Kubernetes when… |
|---|---|
| You only need the frontend running, not the backend stack. | You're already running the dev k3s stack (`./scripts/k8s/dev-k8s.sh up`) and want auth alongside it. |
| You want the fastest possible cycle (`docker compose up -d` ≈ 20 s). | You want to match how the rest of the dev stack is deployed. |
| You're debugging Keycloak itself and want minimal moving parts. | You want to validate behaviour close to production deployment shape. |

Both forms read from the same `keycloak-mock/dls-realm.json`, so any change you make to the realm export takes effect for either on next apply.

## Compose form

From `smartem-devtools/`:

```bash
cd keycloak-mock
docker compose up -d
```

Keycloak starts on `http://localhost:8080` in dev mode, imports the `dls` realm from `dls-realm.json`, and is ready in ~20 s. Bootstrap admin credentials are `admin` / `admin` (admin console at `http://localhost:8080`).

State is **not** persisted between container lifecycles — each `up` reimports the realm. That keeps the mock deterministic; if you need to capture interactive admin changes, export the realm via `kc.sh export` from inside the running container and replace `dls-realm.json`.

Tear down with `docker compose down`.

## Kubernetes form

The `keycloak-mock/kustomization.yaml` is referenced as a base by `k8s/environments/development/kustomization.yaml`. Bringing up the dev stack brings up Keycloak alongside it:

```bash
./scripts/k8s/dev-k8s.sh up
```

The Keycloak service is reachable as:

- `http://keycloak-service:8080` inside the cluster (ClusterIP);
- `http://<node-ip>:30090` from outside (NodePort).

To deploy Keycloak alone — for example, on an existing cluster not managed by `dev-k8s.sh`:

```bash
kubectl apply -k keycloak-mock
```

The kustomization generates a ConfigMap from `dls-realm.json` and mounts it at `/opt/keycloak/data/import`. Updating the realm requires re-applying the kustomization so the ConfigMap is regenerated, and either deleting the pod or doing a `kubectl rollout restart deployment/keycloak`.

## Realm contents

The realm export at `keycloak-mock/dls-realm.json` defines:

- **Realm**: `dls` — matches the value the SPA's runtime `config.json` ships with by default.
- **Clients**:
  - `SmartEM_User` — public client for the browser SPA (standard flow, PKCE S256). This is what the SPA sends in `client_id` and what tokens carry in their `azp` claim.
  - `SmartEM_Agent` — confidential client for the Windows agent (client-credentials grant). Service-to-service, not user-facing.
- **Valid redirect URIs** (`SmartEM_User`): `http://localhost:5173/*`, `http://localhost:5174/*`, and `http://localhost:30100/*` — the Vite dev ports (smartem app and legacy app) plus the k3s NodePort the SPA pod is exposed on.
- **Web origins**: same hosts (required for silent SSO iframe checks once that's enabled in the frontend).
- **Custom claim mapper**: `fedId` — the AuthProvider in the SmartEM frontend reads `idTokenParsed.fedId`. The mapper picks up the user attribute and emits it as an ID-token claim.
- **Seeded users**:
  - `devuser` / `devpass` — generic, fedId `dev12345`.

The mock does not implement the full DLS user model (groups, roles, federated identity). Add more users or roles by editing `dls-realm.json` directly.

## Pointing the frontend at it

The SPA loads its Keycloak config at boot from a runtime `/config.json`, not from `VITE_*` env vars. For `npm run dev:smartem` Vite serves the file from `apps/smartem/public/config.json`; in k8s deploys the SPA pod's nginx serves the file from the `smartem-frontend-config` ConfigMap mount (overriding the one baked into the image). Either way the SPA reads the same shape.

Edit `smartem-frontend/apps/smartem/public/config.json`:

```json
{
  "keycloak": {
    "url": "http://localhost:30090",
    "realm": "dls",
    "clientId": "SmartEM_User"
  },
  "authEnabled": true
}
```

Use `http://localhost:30090` for the k3s NodePort. For docker-compose Keycloak or a port-forwarded pod, use `http://localhost:8080`. If Vite runs on a host other than the one with the cluster, use `http://<node-ip>:30090`.

The config is fetched with `cache: 'no-store'` and applied before the SPA mounts, so a browser reload picks up edits without restarting Vite.

## Disabling auth entirely (Vite dev only, with caveat)

Set `authEnabled: false` in `apps/smartem/public/config.json` and the `AuthGate` (`apps/smartem/src/auth/AuthGate.tsx`) short-circuits — the SPA renders without contacting Keycloak at all. Useful for pure UI iteration.

**Caveat:** the backend (`smartem-decisions`) always enforces Bearer-token validation on non-exempt requests since smartem-decisions#285 — there is no opt-out. With `authEnabled: false` the SPA renders, but every `/api/` call returns 401. This mode is only useful when paired with MSW (`VITE_ENABLE_MOCKS=true` in `apps/smartem/.env.local`), or for views that don't fetch from the backend.

This is a deliberately separate path from "Keycloak is unavailable" — the latter is an error state to recover from, the former is a dev convenience for offline/mocked UI work.

## Editing the realm

Modify `dls-realm.json` directly. Both forms read from the same file. After editing:

- **Compose**: `docker compose down && docker compose up -d` — Keycloak reimports on startup.
- **Kubernetes**: `kubectl apply -k keycloak-mock` (regenerates the ConfigMap with a new hash if `disableNameSuffixHash` is removed) followed by `kubectl rollout restart deployment/keycloak -n smartem-decisions`.

For interactive admin changes you want to keep, use the admin console, then export from inside the container:

```bash
docker exec smartem-keycloak \
  /opt/keycloak/bin/kc.sh export \
  --realm dls \
  --dir /tmp/export \
  --users realm_file
docker cp smartem-keycloak:/tmp/export/dls-realm.json ./dls-realm.json
```

## Limits and non-goals

- **Not for staging or production.** Dev mode, HTTP only, bootstrap admin credentials, no TLS, no persistent storage.
- **Not a faithful DLS realm replica.** Groups, federated identity, fine-grained roles, custom themes — all absent. The mock has just enough surface for the frontend's `AuthProvider` to function end-to-end.
- **Realm export drift.** If the production DLS realm changes its claim shape (new mappers, scope changes), the mock won't track that automatically. Treat it as a snapshot, not a mirror.
