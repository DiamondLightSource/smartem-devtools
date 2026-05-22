# Keycloak mock

Local Keycloak instance for developing and testing SmartEM frontend authentication without depending on the DLS identity server.

Two deployment forms; pick whichever fits your workflow.

## Contents

| File | Purpose |
|------|---------|
| `dls-realm.json` | Realm export. Single source of truth, consumed by both forms. Realm `dls`, clients `SmartEM_User` + `SmartEM_Agent`, seeded `devuser`. |
| `docker-compose.yml` | Standalone Compose deployment. Fastest path to a running Keycloak. |
| `keycloak.yaml` | Kubernetes Deployment + Services. |
| `kustomization.yaml` | Kustomize config; loads the realm JSON as a ConfigMap. Referenced as a base by `k8s/environments/development/kustomization.yaml`, also works standalone. |

## Realm contents

- **Realm**: `dls`
- **Clients**:
  - `SmartEM_User` — public, PKCE S256, standard flow. Browser SPA.
  - `SmartEM_Agent` — confidential, client-credentials grant. Windows agent.
- **Redirect URIs** (`SmartEM_User`): `http://localhost:5173/*`, `http://localhost:5174/*`, `http://localhost:30100/*`
- **Web Origins**: same hosts
- **Custom claim**: `fedId` (protocol mapper from user attribute), to mirror DLS realm claims
- **Users**:
  - `devuser` / `devpass` (Dev User, fedId `dev12345`)

## Compose

```bash
docker compose up -d
# admin console: http://localhost:8080  (admin / admin)
# realm endpoint: http://localhost:8080/realms/dls
```

State is **not persisted** between container restarts — each `up` reimports the realm. That's deliberate for a mock: deterministic startup, no stale state.

To tear down: `docker compose down`.

## Kubernetes

Comes up automatically with the rest of the dev stack via `./scripts/k8s/dev-k8s.sh`. The keycloak base is wired into `k8s/environments/development/kustomization.yaml`.

To deploy keycloak alone (e.g. on an existing cluster):

```bash
kubectl apply -k keycloak-mock
```

Once running, the Keycloak service is reachable inside the cluster at `http://keycloak-service:8080` (ClusterIP) and from outside at `http://<node-ip>:30090` (NodePort). (30090 not 30080 because the SmartEM HTTP API service already owns 30080 in the dev environment.)

## Pointing the frontend at it

The SPA loads Keycloak config at boot from a runtime `/config.json`, not from `VITE_*` env vars. For `npm run dev:smartem` the file served is `smartem-frontend/apps/smartem/public/config.json`; in k8s deploys it's overridden by the `smartem-frontend-config` ConfigMap mount.

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

Use `http://localhost:30090` for the k3s NodePort, or `http://<node-ip>:30090` if Vite is serving from a different host. Then `npm run dev:smartem` from the smartem-frontend repo root. Config is fetched with `cache: 'no-store'` and applied before the SPA mounts, so a browser reload picks up edits without restarting Vite.

## Editing the realm

Modify `dls-realm.json` directly. Both Compose and Kustomize pick it up on next apply. For interactive admin (UI changes you want to capture), use the admin console at `:8080`, export the realm via `kc.sh export`, and replace `dls-realm.json`.

See [Local Keycloak for SmartEM frontend dev](../docs/development/local-keycloak.md) for the wider context, including which workflow to choose and the auth flow integration.
