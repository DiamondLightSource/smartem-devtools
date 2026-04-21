# Operations

Cross-cutting operational documentation for deploying and running SmartEM in production.

```{toctree}
:maxdepth: 1

releasing
publish-smartem-workspace-to-pypi
kubernetes
kubernetes-secrets
containerization
run-container
container-user-configuration
environment-variables
logging
```

## Topics

### Releases

- [Release Procedure](releasing.md) - How to release smartem-decisions, smartem-epuplayer, and smartem-workspace
- [PyPI Token Setup](publish-smartem-workspace-to-pypi.md) - First-time PyPI account and token configuration

### Kubernetes

- [Kubernetes Deployment](kubernetes.md) - Deploying SmartEM to Kubernetes clusters
- [Kubernetes Secrets](kubernetes-secrets.md) - Managing secrets and sensitive configuration

### Containers

- [Containerisation](containerization.md) - Building container images
- [Running Containers](run-container.md) - Container execution and debugging
- [Container User Configuration](container-user-configuration.md) - User and permission configuration

### Configuration

- [Environment Variables](environment-variables.md) - Complete configuration reference
- [Logging](logging.md) - Log configuration and structured logging
