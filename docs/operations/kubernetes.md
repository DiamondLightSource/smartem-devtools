# Kubernetes Deployment

This directory contains Kubernetes deployment configurations for SmartEM Backend across different environments.

## Quick Start (Development)

For local development, use the convenient script that provides a docker-compose-like experience:

```bash
# Start the development environment (equivalent to docker-compose up -d)
./scripts/k8s/dev-k8s.sh

# Check status (equivalent to docker ps)
./scripts/k8s/dev-k8s.sh status

# View logs for a service
./scripts/k8s/dev-k8s.sh logs smartem-http-api

# Stop the environment (equivalent to docker-compose down)
./scripts/k8s/dev-k8s.sh down

# Restart everything
./scripts/k8s/dev-k8s.sh restart

# Get help
./scripts/k8s/dev-k8s.sh --help
```

### Access URLs
Once the environment is running, you can access:
- **Adminer (Database UI)**: http://localhost:30808
- **RabbitMQ Management**: http://localhost:30673
- **SmartEM Backend HTTP API**: http://localhost:30080/health
- **API Documentation**: http://localhost:30080/docs

> **Note**: The script automatically handles GitHub Container Registry authentication and waits for all pods to be ready.

### Pointing the SmartEM frontend dev server at this stack

The Vite dev server in `smartem-frontend` proxies `/api` to `http://localhost:8000` by default — the conventional port for a standalone backend (`uvicorn` directly, or a `kubectl port-forward`). When the backend is in the dev k3s stack, two options:

- **No port-forward** (simplest) — set `VITE_API_PROXY_TARGET=http://localhost:30080` in `apps/smartem/.env.local`. Vite proxies straight to the NodePort.
- **Port-forward to 8000** — `kubectl port-forward -n smartem-decisions svc/smartem-http-api-service 8000:80` keeps the default proxy target working. Useful if you also want CLI tools that hit `http://localhost:8000` to keep working unchanged.

Keycloak is reachable on `http://localhost:30090` regardless; see [Local Keycloak](../development/local-keycloak.md) for the SPA's runtime auth config.

## Kubernetes Structure

```
k8s/
├── environments/
│   ├── development/          # Local development (k3s)
│   ├── staging/             # Staging environment (pollux)
│   └── production/          # Production environment (argos?)
└── README.md
```

## Security: Sealed Secrets

The project uses [Bitnami Sealed Secrets](https://sealed-secrets.netlify.app/) for secure credential management. Before
deploying to any environment, you must generate the appropriate sealed secrets:

### Generate Secrets for Development

```bash
# Auto-generate secure credentials for development
./scripts/k8s/generate-sealed-secrets.sh development
```

### Generate Secrets for Production

```bash
# Interactive credential input for production security
./scripts/k8s/generate-sealed-secrets.sh production
```

Sealed secrets are encrypted with the cluster's public key and safe to commit to version control. The sealed-secrets
controller automatically decrypts them into regular Kubernetes secrets that applications can use.

> **Security Note**: Never commit plain-text secrets to version control. Always use sealed secrets for credential management.

For comprehensive secret management documentation, see [Managing Kubernetes Secrets](kubernetes-secrets.md).

## Detailed Documentation

For detailed Kubernetes deployment instructions, environment configurations, and troubleshooting, see the [k8s directory documentation](k8s/).
