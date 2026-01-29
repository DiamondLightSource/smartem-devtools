// graphql-helpers.js
// Utility functions for ARIA GraphQL operations

const http = require('node:http')
const https = require('node:https')

const ENDPOINTS = {
  mock: 'http://localhost:9002/graphql',
  beta: 'https://beta.aria.structuralbiologycloud.org/data-deposition/graphql',
}

const KEYCLOAK_URL = 'https://auth.aria.structuralbiologycloud.org/realms/aria/protocol/openid-connect/token'

/**
 * Get endpoint URL by name
 * @param {string} name - Endpoint name (mock, beta)
 * @returns {string|null} Endpoint URL or null if not found
 */
function getEndpoint(name) {
  return ENDPOINTS[name] || null
}

/**
 * Check if aria-mock server is running
 * @param {number} port - Port to check (default 9002)
 * @returns {Promise<{running: boolean, url: string}>}
 */
async function checkMockServer(port = 9002) {
  const url = `http://localhost:${port}/graphql`

  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: port,
        path: '/graphql',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 2000,
      },
      (res) => {
        resolve({ running: true, url })
      }
    )

    req.on('error', () => {
      resolve({ running: false, url })
    })

    req.on('timeout', () => {
      req.destroy()
      resolve({ running: false, url })
    })

    req.write(JSON.stringify({ query: '{ __typename }' }))
    req.end()
  })
}

/**
 * Get OAuth2 access token from Keycloak
 * @param {string} grantType - 'client_credentials' or 'password'
 * @returns {Promise<string>} Access token
 */
async function getToken(grantType = 'client_credentials') {
  const clientId = process.env.ARIA_CLIENT_ID
  const clientSecret = process.env.ARIA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('ARIA_CLIENT_ID and ARIA_CLIENT_SECRET environment variables required')
  }

  const params = new URLSearchParams({
    grant_type: grantType,
    client_id: clientId,
    client_secret: clientSecret,
  })

  if (grantType === 'password') {
    const username = process.env.ARIA_USERNAME
    const password = process.env.ARIA_PASSWORD

    if (!username || !password) {
      throw new Error('ARIA_USERNAME and ARIA_PASSWORD required for password grant')
    }

    params.append('username', username)
    params.append('password', password)
  }

  return new Promise((resolve, reject) => {
    const url = new URL(KEYCLOAK_URL)

    const req = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(params.toString()),
        },
        timeout: 10000,
      },
      (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Token request failed: ${res.statusCode} ${data}`))
            return
          }

          try {
            const json = JSON.parse(data)
            if (json.access_token) {
              resolve(json.access_token)
            } else {
              reject(new Error('No access_token in response'))
            }
          } catch (e) {
            reject(new Error(`Failed to parse token response: ${e.message}`))
          }
        })
      }
    )

    req.on('error', (e) => {
      reject(new Error(`Token request error: ${e.message}`))
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Token request timed out'))
    })

    req.write(params.toString())
    req.end()
  })
}

/**
 * Execute a GraphQL query
 * @param {string} endpoint - Endpoint URL
 * @param {string} query - GraphQL query string
 * @param {Object} variables - Query variables
 * @param {Object} headers - Additional headers
 * @returns {Promise<Object>} Query response
 */
async function executeQuery(endpoint, query, variables = {}, headers = {}) {
  const url = new URL(endpoint)
  const isHttps = url.protocol === 'https:'
  const client = isHttps ? https : http

  const body = JSON.stringify({
    query,
    variables,
  })

  const requestHeaders = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    ...headers,
  }

  return new Promise((resolve, reject) => {
    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: requestHeaders,
        timeout: 30000,
      },
      (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            resolve(json)
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`))
          }
        })
      }
    )

    req.on('error', (e) => {
      reject(new Error(`Request error: ${e.message}`))
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timed out'))
    })

    req.write(body)
    req.end()
  })
}

/**
 * Common query templates for ARIA operations
 */
const queryTemplates = {
  listBuckets: `
    query ListBuckets($aria_id: Int, $entity_type: String) {
      bucketItems(filters: { aria_id: $aria_id, aria_entity_type: $entity_type }) {
        id
        aria_id
        aria_entity_type
        embargoed_until
        owner
        created
        updated
      }
    }
  `,

  getBucket: `
    query GetBucket($id: ID!) {
      bucketItems(filters: { id: $id }) {
        id
        aria_id
        aria_entity_type
        embargoed_until
        owner
        created
        updated
      }
    }
  `,

  listRecords: `
    query ListRecords($bucket: ID, $schema: String) {
      recordItems(filters: { bucket: $bucket, schema: $schema }) {
        id
        bucket
        schema
        owner
        created
        updated
      }
    }
  `,

  getRecord: `
    query GetRecord($id: ID!) {
      recordItems(filters: { id: $id }) {
        id
        bucket
        schema
        owner
        created
        updated
      }
    }
  `,

  listFields: `
    query ListFields($record: ID, $type: String) {
      fieldItems(filters: { record: $record, type: $type }) {
        id
        record
        type
        content
        options
        order
      }
    }
  `,

  listVisits: `
    query ListVisits($proposal_id: Int, $access_id: Int) {
      visitItems(filters: { proposal_id: $proposal_id, access_id: $access_id }) {
        id
        cid
        order
        status
        plid
        proposal_id
        access_id
      }
    }
  `,

  createBucket: `
    mutation CreateBucket($aria_id: Int!, $entity_type: String!, $embargoed_until: DateTime!) {
      createDataBucket(input: {
        aria_id: $aria_id,
        aria_entity_type: $entity_type,
        embargoed_until: $embargoed_until
      }) {
        id
        aria_id
        aria_entity_type
        embargoed_until
      }
    }
  `,

  createRecord: `
    mutation CreateRecord($bucket: ID!, $schema: String!) {
      createDataRecord(input: {
        bucket: $bucket,
        schema: $schema
      }) {
        id
        bucket
        schema
      }
    }
  `,

  createField: `
    mutation CreateField($record: ID!, $type: String!, $content: String!, $options: JSON) {
      createDataField(input: {
        record: $record,
        type: $type,
        content: $content,
        options: $options
      }) {
        id
        record
        type
        content
      }
    }
  `,

  introspection: `
    query IntrospectionQuery {
      __schema {
        types {
          name
          kind
          fields {
            name
            type {
              name
              kind
            }
          }
        }
      }
    }
  `,
}

/**
 * Get a query template by name
 * @param {string} name - Template name
 * @returns {string|null} Query string or null if not found
 */
function getQueryTemplate(name) {
  return queryTemplates[name] || null
}

/**
 * List available query template names
 * @returns {string[]} Array of template names
 */
function listQueryTemplates() {
  return Object.keys(queryTemplates)
}

module.exports = {
  ENDPOINTS,
  KEYCLOAK_URL,
  getEndpoint,
  checkMockServer,
  getToken,
  executeQuery,
  queryTemplates,
  getQueryTemplate,
  listQueryTemplates,
}
