# 11. Remove python-copier-template

## Status

Accepted

## Context

In ADR-0002, we adopted the [python-copier-template](https://github.com/DiamondLightSource/python-copier-template) to ensure consistency in developer environments and package management.

Since that decision, the smartem-decisions project has evolved significantly:

1. **Project maturity**: The project has grown from a single-package PoC to a multi-package monorepo with custom requirements that diverge from standard DLS Python projects
2. **Custom tooling needs**: Our development workflow now requires tooling configurations specific to our architecture (multi-package structure, agent deployment, Kubernetes manifests, RabbitMQ integration)
3. **Template update friction**: The copier template's update mechanism became a maintenance burden rather than a benefit, as most updates were not relevant to our custom structure
4. **Duplicated documentation**: The template's contribution guidelines and developer documentation conflicted with our own evolving practices documented in smartem-devtools

## Decision

We have removed the python-copier-template dependency and scaffolding from smartem-decisions.

The following were removed in commit f95b1de (2026-01-05):
- `.copier-answers.yml` configuration file
- Copier dependency from `pyproject.toml`
- Template-generated sections from `.github/CONTRIBUTING.md`

We retain the tooling standards established by the template (pyright, ruff, pre-commit) but now manage their configuration directly.

## Consequences

### Positive

- **Reduced maintenance burden**: No need to resolve conflicts when updating from the template
- **Custom workflows**: Freedom to evolve tooling and structure to match our specific needs
- **Simplified onboarding**: Developer documentation is now solely in smartem-devtools, not split between template and repo
- **Clearer ownership**: All configuration is explicitly managed by the team

### Negative

- **Manual updates**: We no longer automatically receive updates to best practices from the template
- **Divergence risk**: May drift from DLS Python conventions over time
- **Responsibility**: Must actively maintain tooling standards ourselves

### Mitigations

- Continue following DLS Python best practices where applicable
- Reference the copier template repo for inspiration when updating tooling
- Document our standards explicitly in smartem-devtools
- Maintain pre-commit hooks to enforce code quality standards

## References

- ADR-0002: Adopt python-copier-template (superseded by this decision)
- Removal commit: f95b1dea1479d8d845f5cfd605084c201f459020
- DLS python-copier-template: https://github.com/DiamondLightSource/python-copier-template
