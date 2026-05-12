# Keycloak mock

Local Keycloak instance for developing and testing SmartEM frontend authentication without depending on the DLS identity server.

Two deployment forms; pick whichever fits your workflow.

## Contents

| File | Purpose |
|------|---------|
| `dls-realm.json` | Realm export. Single source of truth, consumed by both forms. Realm `dls`, client `SmartEM`, two seeded users. |
| `docker-compose.yml` | Standalone Compose deployment. Fastest path to a running Keycloak. |
| `keycloak.yaml` | Kubernetes Deployment + Services. |
| `kustomization.yaml` | Kustomize config; loads the realm JSON as a ConfigMap. Referenced as a base by `k8s/environments/development/kustomization.yaml`, also works standalone. |

## Realm contents

- **Realm**: `dls`
- **Client**: `SmartEM` (public, PKCE S256, standard flow)
- **Redirect URIs**: `http://localhost:5173/*`, `http://localhost:5174/*`
- **Web Origins**: same hosts
- **Custom claim**: `fedId` (protocol mapper from user attribute), to mirror DLS realm claims
- **Users**:
  - `devuser` / `devpass` (Dev User, fedId `dev12345`)
  - `valuser` / `valpass` (Val Redchenko, fedId `val99999`)

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

Once running, the Keycloak service is reachable inside the cluster at `http://keycloak-service:8080` (ClusterIP) and from outside at `http://<node-ip>:30080` (NodePort).

## Pointing the frontend at it

In `smartem-frontend/apps/smartem/.env.local`:

```env
VITE_KEYCLOAK_URL=http://localhost:8080      # compose / port-forward
# or
VITE_KEYCLOAK_URL=http://<node-ip>:30080     # k8s NodePort
VITE_KEYCLOAK_REALM=dls
VITE_KEYCLOAK_CLIENT_ID=SmartEM
VITE_AUTH_ENABLED=true
```

Then `npm run dev:smartem` from the smartem-frontend repo root.

## Editing the realm

Modify `dls-realm.json` directly. Both Compose and Kustomize pick it up on next apply. For interactive admin (UI changes you want to capture), use the admin console at `:8080`, export the realm via `kc.sh export`, and replace `dls-realm.json`.

See [Local Keycloak for SmartEM frontend dev](../docs/development/local-keycloak.md) for the wider context, including which workflow to choose and the auth flow integration.
