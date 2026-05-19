# 18. Authenticate SmartEM Agent against the backend using Keycloak client credentials

Date: 2026-05-19

## Status

Accepted

## Context

The SmartEM Decisions backend gates every non-exempt endpoint behind Keycloak Bearer-token validation (see DiamondLightSource/smartem-decisions#285). The SmartEM frontend authenticates against this through the standard OIDC authorization-code flow with PKCE (see DiamondLightSource/smartem-frontend#74).

The SmartEM Agent runs unattended on EPU workstations near the microscope. It ingests EPU filesystem output and POSTs to the backend over HTTP/REST. It also receives ML recommendations from the backend via a long-running Server-Sent Events (SSE) connection. There is no browser at startup, no human present at the workstation, and no opportunity for interactive consent. The OIDC flow used by the frontend does not apply.

Once the backend enforces token validation in any deployed environment, an unauthenticated agent immediately fails. The agent therefore needs a service-to-service authentication path that:

- Reuses the existing JWT validation already shipped on the backend, avoiding a second parallel auth system.
- Operates without human interaction at startup.
- Is operationally feasible for unattended workstations deployed across the facility.
- Has a clear hardening path for future requirements such as per-agent revocation.

DiamondLightSource/smartem-decisions#284 tracks the open question and its initial analysis.

## Decision

The SmartEM Agent authenticates against Keycloak using the OAuth 2.0 **client_credentials** grant (RFC 6749 §4.4), with a dedicated Keycloak client `SmartEM_Agent` configured for confidential client authentication using a shared client secret (`clientAuthenticatorType: "client-secret"`, `serviceAccountsEnabled: true`).

The existing browser-facing Keycloak client previously named `SmartEM` is renamed `SmartEM_User` so that the user-versus-agent distinction is explicit in the realm.

The agent reads its Keycloak configuration (URL, realm, client ID, client secret) from a dotenv-style file. The default location is alongside the agent executable; an optional `--config` CLI parameter overrides the path. No values are baked into the agent binary at build time, so secret rotation requires no rebuild.

The agent obtains a Bearer token by POSTing to `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token` with `grant_type=client_credentials` and presents the resulting RS256 JWT on every request to the backend. The backend's existing `verify_token` dependency validates the signature against the realm's JWKS. The backend additionally enforces that the token's `azp` (authorised party) claim is one of an allow-listed set: `SmartEM_User` for browser-originated requests, `SmartEM_Agent` for agent-originated requests.

Both ends fail closed. Missing or invalid Keycloak configuration causes the agent to exit non-zero at startup. The backend returns HTTP 401 to any request without a valid token. There is no fallback to unauthenticated operation.

A future upgrade to **private_key_jwt** client authentication (RFC 7523) is planned, once the client_credentials flow is stable in deployed environments. That upgrade replaces the shared secret with a per-agent keypair registered as a public key against the Keycloak client. It leaves the backend, the agent's request-handling code, and the operational rollout structure unchanged - only the agent's token-fetch step and the Keycloak client's `clientAuthenticatorType` differ. This forward path is documented here so the v1 design choices do not foreclose it.

## Alternatives Considered

Five options were evaluated before settling on client_credentials.

| Option | Summary | Why not |
|--------|---------|---------|
| **JWT client authentication** (private_key_jwt) | Same OAuth grant as client_credentials but the agent signs a JWT with a private key instead of presenting a shared secret. | The right destination state, but introduces per-agent key distribution and lifecycle management before the basic flow is proven in production. Deferred as the v2 upgrade. |
| **Mutual TLS** | The ingress requires client certificates; the backend trusts the certificate subject. | Introduces a second authentication system on the backend running alongside the existing JWT validation. Doubles the auth surface, complicates testing, and does not compose with the work in #285. |
| **Static API key** | The backend accepts a long-lived secret in a custom header. | Reinvents authentication. No rotation story without redeploying both sides. No expiry, no `azp` claim, no claim-based attribution. Adds a parallel auth path. |
| **Exempt agent endpoints** | The agent's ingestion endpoints are added to the backend's `EXEMPT_PATHS`; network policy is relied upon for protection. | "Internal-only" stays internal-only only when actively enforced. On shared clusters this is brittle. Loses per-agent attribution. The data-ingestion endpoints are precisely where authenticated provenance is most valuable. |

The client_credentials choice was preferred because:

- It is the only option that reuses the JWT validation on the backend without structural change.
- It carries an `azp` claim, giving the backend a free hook for distinguishing agents from users and for future authorisation refinements.
- It has a clean upgrade path to private_key_jwt without rewriting agent code.
- Shared-secret distribution is operationally appropriate for the current scale: one client per agent population, deployed to trusted hosts by DLS infrastructure. The downside - no per-agent revocation without rotating the population secret - is acceptable for v1 and is the explicit motivation for the planned v2 upgrade.

## Consequences

### Keycloak

The realm gains a confidential client `SmartEM_Agent` with a generated secret. The browser-facing client is renamed from `SmartEM` to `SmartEM_User`. Both changes are required in the local mock realm (`smartem-devtools/keycloak-mock/dls-realm.json`) and in the real DLS Keycloak realm; the latter is requested via Jira from the Keycloak administrators.

For the mock realm, the agent client secret is hard-coded as `dev-agent-secret` to allow agents to self-configure from a checked-in development configuration. This value has no security significance outside development.

### Backend

The backend gains `azp` claim enforcement via a configuration value (allow-list of accepted client IDs). Tokens whose `azp` is not in the allow-list are rejected. The allow-list is populated with `SmartEM_User` and `SmartEM_Agent`. Adding further entries (for future service clients) is a configuration change with no code impact.

### Agent

The agent gains a small Keycloak token-management component: a single class responsible for fetching tokens via client_credentials, caching them in memory, refreshing proactively shortly before expiry, and refreshing on demand when a request returns 401. This component is composed into the existing `SmartEMAPIClient` so that all HTTP requests (including the long-running SSE connection) attach a Bearer token through the shared `requests.Session` already used by every API call.

The agent reads its four Keycloak configuration values from a dotenv-style file. Default path is alongside the agent executable; a `--config` CLI parameter overrides. Missing or unreadable configuration causes the agent to exit at startup with a clear error.

### Operations

Secret rotation under v1 is a Keycloak admin action followed by a configuration update on each agent workstation and an agent restart. At the current scale this is manual; the operational scaling cost is one of the motivations for the planned move to private_key_jwt.

The shared-secret model means revoking access for one compromised workstation requires rotating the population secret. This is an accepted trade-off for v1 and the principal motivation for v2.

Configuration file permissions are the responsibility of the deployer. Initial guidance is OS-level access control restricting read to the agent's runtime user. Storage hardening via OS-native secret stores is a future iteration if and when the threat model warrants it.

### Observability

The agent emits structured log entries on token fetch and refresh, recording the absolute expiry time and the local system time. Tokens themselves are never logged. 401 responses from the backend trigger a single token refresh and retry; repeated 401s after refresh are surfaced as errors with enough context to diagnose clock skew, secret mismatch, or revocation.

### Documentation

This ADR is accompanied by an operational guide at `docs/agent/authentication.md` that covers configuration, secret rotation, local development against the Keycloak mock, and 401 troubleshooting.

### Follow-ups

- Implementation issue to be opened tracking the agent-side `KeycloakClient` component, the backend `azp` allow-list configuration, and end-to-end testing against the mock realm.
- Migration to private_key_jwt to be reopened as a separate ADR once operational experience with client_credentials has accumulated.
- Jira request to the DLS Keycloak administrators for the equivalent changes on the production realm.
