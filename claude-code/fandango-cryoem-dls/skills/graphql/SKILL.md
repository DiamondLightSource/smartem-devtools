---
name: graphql
description: GraphQL CLI for ARIA API exploration and fandanGO connector development. Run queries, introspect schemas, test authentication flows with Keycloak, validate against aria-mock.
version: 1.0.0
author: SmartEM Team
tags: [graphql, aria, fandango, api, deposition]
---

**IMPORTANT - Path Resolution:**
This skill can be installed in different locations. Before executing any commands, determine the skill directory based on where you loaded this SKILL.md file, and use that path in all commands below. Replace `$SKILL_DIR` with the actual discovered path.

Common installation paths:

- Workspace: `<workspace>/repos/DiamondLightSource/smartem-devtools/claude-code/fandango-cryoem-dls/skills/graphql`
- Symlinked: `<project>/.claude/skills/graphql`

# GraphQL CLI for ARIA Development

Query the ARIA GraphQL API from the command line. Supports schema introspection, query execution, and OAuth2 authentication with Keycloak.

**CRITICAL WORKFLOW - Follow these steps in order:**

1. **Determine target endpoint** - Ask user which environment to use:

   - **aria-mock**: `http://localhost:9002/graphql` (local development)
   - **ARIA beta**: `https://beta.aria.structuralbiologycloud.org/data-deposition/graphql` (requires auth)

2. **For ARIA beta, obtain token first** - Use helpers to acquire access token:

   ```bash
   cd $SKILL_DIR && node -e "require('./lib/helpers').getToken().then(t => console.log(t))"
   ```

3. **Write queries to /tmp** - NEVER write query files to skill directory; use `/tmp/graphql-*.graphql`

4. **Execute via run.js** - Always run from skill directory for proper module resolution

## Setup (First Time)

```bash
cd $SKILL_DIR
npm install
```

This installs graphqurl. Only needed once.

## Endpoints

| Environment | URL | Auth |
|-------------|-----|------|
| aria-mock | `http://localhost:9002/graphql` | None |
| ARIA beta | `https://beta.aria.structuralbiologycloud.org/data-deposition/graphql` | Bearer token |

### Starting aria-mock

```bash
cd /home/vredchenko/dev/ERIC/aria-mock
npx graphql-faker schema.graphql --port 9002
```

## Execution Pattern

**Step 1: Check if aria-mock is running (for local development)**

```bash
cd $SKILL_DIR && node -e "require('./lib/helpers').checkMockServer().then(r => console.log(JSON.stringify(r)))"
```

**Step 2: Write query to /tmp**

```graphql
# /tmp/graphql-buckets.graphql
query GetBuckets {
  bucketItems {
    id
    aria_id
    aria_entity_type
    embargoed_until
  }
}
```

**Step 3: Execute query**

```bash
# Against aria-mock (no auth)
cd $SKILL_DIR && node run.js /tmp/graphql-buckets.graphql

# Against ARIA beta (with auth)
cd $SKILL_DIR && node run.js /tmp/graphql-buckets.graphql --endpoint beta
```

## Inline Execution (Simple Queries)

For quick one-off queries:

```bash
# Introspect schema
cd $SKILL_DIR && node run.js --introspect

# Simple query inline
cd $SKILL_DIR && node run.js "{ bucketItems { id aria_id } }"

# With variables
cd $SKILL_DIR && node run.js "query GetBucket(\$id: ID!) { bucketItems(filters: { id: \$id }) { id aria_id } }" --variables '{"id": "123"}'
```

## Schema Introspection

Explore the ARIA schema:

```bash
# Full schema introspection
cd $SKILL_DIR && node run.js --introspect

# Save schema to file
cd $SKILL_DIR && node run.js --introspect > /tmp/aria-schema.graphql
```

## Common Query Patterns

### Query Buckets

```graphql
query GetBuckets($aria_id: Int) {
  bucketItems(filters: { aria_id: $aria_id }) {
    id
    aria_id
    aria_entity_type
    embargoed_until
    owner
    created
  }
}
```

### Query Records

```graphql
query GetRecords($bucket: ID!) {
  recordItems(filters: { bucket: $bucket }) {
    id
    bucket
    schema
    owner
    created
  }
}
```

### Query Fields

```graphql
query GetFields($record: ID!) {
  fieldItems(filters: { record: $record }) {
    id
    record
    type
    content
    options
  }
}
```

### Create Bucket (Mutation)

```graphql
mutation CreateBucket($input: CreateBucketInput!) {
  createDataBucket(input: $input) {
    id
    aria_id
    aria_entity_type
  }
}
```

Variables:

```json
{
  "input": {
    "aria_id": 12345,
    "aria_entity_type": "visit",
    "embargoed_until": "2027-01-01T00:00:00Z"
  }
}
```

### Create Record (Mutation)

```graphql
mutation CreateRecord($input: CreateRecordInput!) {
  createDataRecord(input: $input) {
    id
    bucket
    schema
  }
}
```

Variables:

```json
{
  "input": {
    "bucket": "bucket-uuid-here",
    "schema": "OSCEM"
  }
}
```

### Create Field (Mutation)

```graphql
mutation CreateField($input: CreateFieldInput!) {
  createDataField(input: $input) {
    id
    record
    type
    content
  }
}
```

Variables:

```json
{
  "input": {
    "record": "record-uuid-here",
    "type": "json",
    "content": "{\"key\": \"value\"}"
  }
}
```

## Authentication

ARIA beta uses Keycloak with OAuth2. The helpers support two grant types:

### Client Credentials (Machine-to-Machine)

Requires `ARIA_CLIENT_ID` and `ARIA_CLIENT_SECRET` environment variables:

```bash
export ARIA_CLIENT_ID="your-client-id"
export ARIA_CLIENT_SECRET="your-client-secret"
cd $SKILL_DIR && node -e "require('./lib/helpers').getToken('client_credentials').then(t => console.log(t))"
```

### Password Grant (User Context)

Requires `ARIA_USERNAME` and `ARIA_PASSWORD` in addition to client credentials:

```bash
export ARIA_CLIENT_ID="your-client-id"
export ARIA_CLIENT_SECRET="your-client-secret"
export ARIA_USERNAME="user@example.com"
export ARIA_PASSWORD="user-password"
cd $SKILL_DIR && node -e "require('./lib/helpers').getToken('password').then(t => console.log(t))"
```

### Using Token in Queries

```bash
# Get token and use in query
TOKEN=$(cd $SKILL_DIR && node -e "require('./lib/helpers').getToken().then(t => console.log(t))")
cd $SKILL_DIR && node run.js /tmp/graphql-query.graphql --header "Authorization: Bearer $TOKEN"
```

Or use the `--endpoint beta` flag which handles auth automatically:

```bash
cd $SKILL_DIR && node run.js /tmp/graphql-query.graphql --endpoint beta
```

## Available Helpers

Optional utility functions in `lib/helpers.js`:

```javascript
const helpers = require('./lib/helpers')

// Check if aria-mock is running
const status = await helpers.checkMockServer()
console.log('Mock server:', status)

// Get OAuth2 token
const token = await helpers.getToken('client_credentials')
console.log('Token:', token)

// Get endpoint URL by name
const url = helpers.getEndpoint('beta')
console.log('URL:', url)

// Common query templates
const queries = helpers.queryTemplates
console.log('Available queries:', Object.keys(queries))
```

See `lib/helpers.js` for full list.

## Tips

- **CRITICAL: Check endpoint first** - Know whether you're hitting aria-mock or ARIA beta
- **Use /tmp for query files** - Write to `/tmp/graphql-*.graphql`, never to skill directory
- **Introspect often** - Use `--introspect` to discover available types and fields
- **Variables for reuse** - Use `--variables` JSON for parameterised queries
- **Error handling** - GraphQL errors are in the response body, not HTTP status

## Troubleshooting

**graphqurl not installed:**

```bash
cd $SKILL_DIR && npm install
```

**aria-mock not running:**

```bash
cd /home/vredchenko/dev/ERIC/aria-mock && npx graphql-faker schema.graphql --port 9002
```

**Authentication failed:**

- Check environment variables are set
- Verify Keycloak endpoint is reachable
- Token may have expired (default 5 minutes)

**Query syntax error:**

- Validate query at https://graphql.org/learn/queries/
- Use introspection to verify field names

## Example Usage

```
User: "Show me what buckets exist in ARIA"

Claude: I'll query the ARIA buckets. Let me first check if we're using aria-mock or the beta endpoint...
[Runs: checkMockServer()]
[Output: aria-mock running on port 9002]

I found aria-mock running locally. I'll query it for buckets.

[Writes query to /tmp/graphql-buckets.graphql]
[Runs: cd $SKILL_DIR && node run.js /tmp/graphql-buckets.graphql]
[Shows results]
```

```
User: "Create a new bucket for visit 12345"

Claude: I'll create a bucket for visit 12345. First, let me check the endpoint...
[Runs: checkMockServer()]
[Output: No mock server, using ARIA beta]

This will use the ARIA beta endpoint. I need to authenticate first.

[Gets token via helpers.getToken()]
[Writes mutation to /tmp/graphql-create-bucket.graphql]
[Runs: cd $SKILL_DIR && node run.js /tmp/graphql-create-bucket.graphql --endpoint beta]
[Shows result with new bucket ID]
```

## Notes

- Each query is executed fresh; no persistent connection
- Mock server returns fake data; useful for testing structure, not realistic values
- Production queries may have rate limits and require proper auth scopes
- Schema may differ between aria-mock and production (mock is derived from observed queries)
