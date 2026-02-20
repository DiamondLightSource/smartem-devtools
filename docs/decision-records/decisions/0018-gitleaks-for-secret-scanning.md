# 18. Replace detect-secrets with gitleaks for secret scanning

Date: 2026-02-20

## Status

Accepted (supersedes [ADR-0005](/docs/explanations/decisions/0005-detect-secrets-for-secret-scanning))

## Context

ADR-0005 chose detect-secrets over the DLS organisation's recommendation of gitleaks, citing better false positive handling for scientific computing patterns and native Python integration.

A comprehensive audit of all five DLS-owned repositories revealed:

1. **No real secrets** exist in any repository's git history — all baseline entries are placeholder false positives (example passwords in documentation, mock service worker hashes, Kubernetes secret templates).
2. **The baseline audit check is broken** — detect-secrets entries missing the `"is_secret"` key (as opposed to `"is_secret": null`) silently pass CI, rendering the audit step ineffective.
3. **Significant overhead** — each repository carries a ~100-150 line CI workflow, a large JSON baseline file, and Python toolchain setup. The equivalent gitleaks configuration is ~15 lines of CI and a small TOML allowlist.
4. **Organisational alignment** — DLS cybersecurity recommends gitleaks. Using detect-secrets creates unnecessary divergence from org-wide tooling standards.
5. **Inconsistent coverage** — sci-react-ui had no secret scanning at all, partly because the detect-secrets setup was too heavyweight to justify adding.

## Decision

Replace detect-secrets with gitleaks across all DLS-owned repositories (smartem-decisions, smartem-frontend, smartem-devtools, fandanGO-cryoem-dls, sci-react-ui).

Each repository gets:
- A gitleaks GitHub Actions CI workflow (~15 lines) using `gitleaks/gitleaks-action@v2`
- A `.gitleaks.toml` allowlist for known false positives (where needed)
- A pre-push hook via the repository's existing hook framework (pre-commit or lefthook)
- Removal of `.secrets.baseline`, detect-secrets CI workflow, and detect-secrets hook configuration

## Consequences

### Positive

- ~10x reduction in CI workflow complexity per repository
- Consistent tooling across all DLS repositories and alignment with org recommendations
- All five repositories now have secret scanning (sci-react-ui previously had none)
- Pre-push hooks catch secrets before they reach the remote
- No Python toolchain dependency for secret scanning in non-Python repos

### Negative

- Developers using lefthook repos (smartem-frontend, smartem-devtools, sci-react-ui) need gitleaks installed locally for pre-push hooks
- Different false positive handling — gitleaks uses regex-based allowlists rather than per-line audited baselines
- Less granular control over individual detection plugins compared to detect-secrets

### Mitigation

- Pre-commit framework repos (smartem-decisions, fandanGO-cryoem-dls) auto-download the gitleaks binary
- Developer setup documentation updated with gitleaks installation instructions
