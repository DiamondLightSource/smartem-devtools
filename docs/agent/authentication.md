# SmartEM Agent Authentication

The SmartEM Agent authenticates against the SmartEM Decisions backend using OAuth 2.0 Bearer tokens issued by Keycloak. This document describes how authentication works, how to configure it, how to operate it, and how to troubleshoot it.

The architectural decision is recorded in [ADR 0018](../decision-records/decisions/0018-smartem-agent-keycloak-auth.md).

## Overview

The agent runs unattended on EPU workstations near the microscope. There is no browser and no human at startup, so the OIDC authorisation-code flow used by the SmartEM frontend does not apply. Instead the agent uses the OAuth 2.0 client_credentials grant: it presents a confidential client ID and secret to Keycloak, receives an access token, and attaches that token to every request it makes to the backend.

```
+------------+  1. client_credentials grant    +------------+
|            | ------------------------------> |            |
|   Agent    |                                 |  Keycloak  |
|            | <------------------------------ |            |
+------------+  2. Access token (RS256 JWT)    +------------+
       |
       | 3. HTTP request + Bearer token
       v
+------------+
|  Backend   |  Validates the token against the Keycloak JWKS
+------------+
```

The token is cached in memory and refreshed shortly before its expiry. If the backend rejects a request with HTTP 401, the agent invalidates its cache, fetches a fresh token, and retries the request once before surfacing the error. Long-running SSE connections that span a token's expiry briefly disconnect and reconnect with a fresh token; this is expected and is handled by the agent transparently.

The Keycloak client used by the agent is `SmartEM_Agent`. This is distinct from the browser-facing `SmartEM_User` client used by the frontend; the backend distinguishes the two via the `azp` (authorised party) claim on the token.

## Configuration

The agent requires four values to authenticate.

| Name | Purpose |
|------|---------|
| `KEYCLOAK_URL` | Base URL of the Keycloak server (e.g. `https://auth.diamond.ac.uk`). |
| `KEYCLOAK_REALM` | Realm name (e.g. `dls`). |
| `KEYCLOAK_CLIENT_ID` | Client identifier - `SmartEM_Agent` in normal operation. |
| `KEYCLOAK_CLIENT_SECRET` | Confidential client secret, provided by the Keycloak administrator. |

### Configuration file

The agent reads these values from a dotenv-style configuration file. By default the file is located alongside the agent executable. To use a different location, pass `--config`:

```bash
python -m smartem_agent watch /path/to/data --config /opt/smartem/agent.env
```

The file format is one variable per line in `KEY=VALUE` form, with no quoting:

```
KEYCLOAK_URL=https://auth.diamond.ac.uk
KEYCLOAK_REALM=dls
KEYCLOAK_CLIENT_ID=SmartEM_Agent
KEYCLOAK_CLIENT_SECRET=<secret here>
```

The four values are mandatory; if any are missing or empty, the agent exits with a non-zero status at startup and a clear error message. There is no fallback to unauthenticated operation.

### File permissions

**For operators.** The configuration file contains a credential. Restrict read access to the operating-system account that runs the agent. On POSIX-like systems (including Cygwin) `chmod 600` is sufficient. On Windows, restrict NTFS ACLs to the launching user.

Storage hardening via OS-native secret stores (Windows DPAPI, Credential Manager, Linux keyring) is a possible future iteration but is intentionally out of scope for v1. The file-based approach keeps the agent OS-agnostic.

## Operations

### Token lifecycle

Access tokens issued by Keycloak default to a 5-minute lifespan. The agent fetches tokens lazily on first use, caches them in memory, and refreshes them when within approximately 30 seconds of expiry. If a backend request returns HTTP 401, the agent invalidates the cache, fetches a fresh token, and retries the request once. A second 401 after refresh is surfaced as an error.

The client_credentials grant does not issue refresh tokens. Each refresh is a full re-request against the Keycloak token endpoint.

### Secret rotation

Routine rotation:

1. Generate a new secret for the `SmartEM_Agent` client in the Keycloak admin console.
2. Update the configuration file on every agent workstation with the new secret.
3. Restart each agent.

The agent does not currently re-read its configuration file on signal; a restart is required to pick up a new secret. Until step 3 has completed on a given workstation, the agent on that workstation continues to use the old secret. If the old secret is still valid in Keycloak (no concurrent revocation), the agent continues to operate. If the old secret has been revoked, the agent sees 401s until restarted.

Emergency rotation (suspected leak):

1. Revoke the old secret in Keycloak.
2. Distribute the new secret to all workstations.
3. Restart each agent.

All agents will see 401s between steps 1 and 3.

### Logging

The agent emits structured log entries at the following points:

- **Token fetched.** Records the absolute expiry time (ISO 8601) and the local system time at the moment of fetch. Useful for diagnosing clock skew.
- **Token refreshed.** Logged when proactive refresh occurs near expiry, or when a 401 forces an early refresh.
- **Authentication failure.** Logged when token fetch fails (Keycloak unreachable, wrong secret, client disabled) or when a request continues to receive 401 after a refresh.

Tokens themselves are never written to logs.

## Development

The local Keycloak mock at `smartem-devtools/keycloak-mock/` ships with a `SmartEM_Agent` client whose secret is hard-coded as `dev-agent-secret`. This value has no security significance and is used only for local development against the mock realm.

To run the agent against the mock:

1. Bring up the local k3s cluster including the Keycloak mock: `./scripts/k8s/dev-k8s.sh up`.
2. Create an agent configuration file pointing at the mock:

   ```
   KEYCLOAK_URL=http://localhost:30090
   KEYCLOAK_REALM=dls
   KEYCLOAK_CLIENT_ID=SmartEM_Agent
   KEYCLOAK_CLIENT_SECRET=dev-agent-secret
   ```

3. Run the agent with `--config` pointing at this file.

Agent-side tests exercise: successful token fetch, proactive refresh near expiry, 401-triggered refresh and retry, network failure to Keycloak, and repeated 401 after refresh.

## Troubleshooting

### Agent exits at startup with a Keycloak configuration error

The agent could not read one or more of the four required values. Verify the configuration file exists, is readable by the agent user, and contains all four variables with non-empty values.

### Agent receives 401 on every request

Possible causes, in roughly decreasing likelihood:

1. **Wrong client secret.** Verify the secret in the configuration file matches the secret in the Keycloak admin console for the `SmartEM_Agent` client.
2. **Clock skew.** The backend allows a small leeway on token expiry, but workstation clocks more than a minute off Keycloak's clock will see tokens rejected as expired. Compare the absolute expiry time in the agent's "Token fetched" log entry against the local system time; if these are close together (or worse, expiry is in the past) but tokens are still rejected, time sync is the likely cause.
3. **Client disabled or deleted in Keycloak.** Verify the `SmartEM_Agent` client exists and is enabled.
4. **Realm name mismatch.** The agent's `KEYCLOAK_REALM` must match the realm the backend trusts.
5. **`azp` allow-list mismatch.** If the backend's allow-list does not include `SmartEM_Agent`, tokens issued to the agent will be rejected even though their signatures are valid.

### Agent receives 401 after a period of normal operation

Likely causes:

1. **Secret rotated in Keycloak but configuration file not updated.** Update the file and restart the agent.
2. **Client temporarily disabled.** Check Keycloak admin.

### Agent cannot reach Keycloak

If token fetch fails with a network error, verify the workstation can reach `${KEYCLOAK_URL}`. EPU workstations sit on isolated networks with proxy allow-lists; Keycloak must be on the allow-list. The same reachability requirement applies to the backend.

### SSE stream disconnects and reconnects every few minutes

This is expected behaviour around token expiry. If the disconnect interval matches the Keycloak access token lifespan (default 5 minutes), the agent is handling token rotation correctly. Disconnect intervals significantly shorter than the token lifespan suggest a different problem - typically network instability or a proxy timeout.

## Related documentation

- [ADR 0018: Authenticate SmartEM Agent against the backend using Keycloak client credentials](../decision-records/decisions/0018-smartem-agent-keycloak-auth.md)
- [CLI Reference](cli-reference.md)
- [Agent Deployment](deployment.md)
- [Agent Troubleshooting](troubleshooting.md)
- [Environment Variables](../operations/environment-variables.md)
