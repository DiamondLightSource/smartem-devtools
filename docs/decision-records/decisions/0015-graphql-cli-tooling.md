# 15. GraphQL CLI Tooling for ARIA Development

Date: 2026-01-29

## Status

Accepted

## Context

The fandanGO-cryoem-dls plugin integrates SmartEM with the ARIA metadata repository via GraphQL API. Development and debugging of this integration requires:

1. **Schema exploration**: Understanding the ARIA GraphQL schema (types, queries, mutations)
2. **Query testing**: Validating GraphQL queries before implementing in Python
3. **Authentication testing**: Verifying OAuth2/OIDC token flows with Keycloak
4. **Mock API validation**: Ensuring aria-mock behaves like the production API

Currently, developers must either:
- Write Python code to test queries (slow iteration)
- Use browser-based tools like GraphiQL (no CLI integration, manual auth handling)
- Construct curl commands with GraphQL payloads (error-prone, verbose)

The ARIA beta endpoint (`https://beta.aria.structuralbiologycloud.org/data-deposition/graphql`) uses Keycloak for authentication with OAuth2 client credentials and password grant flows.

## Decision

We will add a GraphQL CLI skill to the smartem-devtools claude-code configuration using [graphqurl](https://github.com/hasura/graphqurl), a lightweight GraphQL CLI tool from Hasura.

### Tool Choice: graphqurl

Selected over alternatives for:
- **Lightweight**: Single npm package, no complex dependencies
- **CLI-native**: Designed for terminal usage, supports piped input/output
- **Introspection**: Built-in schema exploration with `--introspect`
- **Variables**: First-class support for query variables via `--variablesJSON`
- **Headers**: Easy custom header injection for Bearer tokens

### Integration Approach

1. **Skill-local installation**: graphqurl installed via skill's package.json (not global)
2. **Executor pattern**: Universal run.js executor (matching playwright-skill pattern)
3. **ARIA helpers**: lib/helpers.js with token acquisition and common query templates
4. **Mock support**: Works with both aria-mock and production ARIA endpoints

### Skill Location

```
claude-code/fandango-cryoem-dls/skills/graphql/
```

Located under fandango-cryoem-dls because:
- Primary use case is ARIA/fandanGO development
- Helpers are ARIA-specific (auth, schema patterns)
- Shares namespace with future fandanGO-related skills

## Consequences

### Positive

- **Fast iteration**: Test queries in terminal before writing Python code
- **Schema discovery**: Introspect ARIA schema to understand available operations
- **Auth debugging**: Isolate token issues from application code
- **Mock validation**: Verify aria-mock matches expected behaviour
- **CI integration**: Scriptable queries for automated testing
- **Consistent patterns**: Follows established skill structure (playwright, devops, etc.)

### Negative

- **Node.js dependency**: Requires npm/node for graphqurl (already required for workspace)
- **Auth complexity**: Token management requires helper functions
- **Learning curve**: Developers need to understand graphqurl CLI options

### Neutral

- **Not a replacement**: Python code still needed for production integration
- **Optional tool**: Added to dev-requirements.json as non-required
- **Maintenance**: graphqurl maintained by Hasura, stable project
