#!/usr/bin/env node
/**
 * Universal GraphQL Executor for Claude Code
 *
 * Executes GraphQL queries via graphqurl from:
 * - File path: node run.js query.graphql
 * - Inline query: node run.js "{ bucketItems { id } }"
 * - Stdin: cat query.graphql | node run.js
 *
 * Options:
 *   --endpoint <name>     Use named endpoint (mock, beta). Default: mock
 *   --introspect          Introspect schema instead of executing query
 *   --variables <json>    JSON string of query variables
 *   --header <header>     Additional header (can be repeated)
 */

const fs = require('node:fs')
const { execSync, spawn } = require('node:child_process')
const helpers = require('./lib/helpers')

process.chdir(__dirname)

function checkGraphqurlInstalled() {
  try {
    return fs.existsSync(`${__dirname}/node_modules/.bin/gq`)
  } catch (_e) {
    return false
  }
}

function installGraphqurl() {
  console.log('Installing graphqurl...')
  try {
    execSync('npm install', { stdio: 'inherit', cwd: __dirname })
    console.log('graphqurl installed successfully')
    return true
  } catch (e) {
    console.error('Failed to install graphqurl:', e.message)
    console.error('Please run manually: cd', __dirname, '&& npm install')
    return false
  }
}

function showHelp() {
  console.log('Usage: node run.js [options] [query]')
  console.log('')
  console.log('Execute GraphQL queries against ARIA endpoints.')
  console.log('')
  console.log('Arguments:')
  console.log('  query                   Query file path or inline GraphQL query')
  console.log('')
  console.log('Options:')
  console.log('  --endpoint <name>       Endpoint to use: mock, beta (default: mock)')
  console.log('  --introspect            Introspect schema instead of executing query')
  console.log('  --variables <json>      JSON string of query variables')
  console.log('  --header <header>       Additional HTTP header (can be repeated)')
  console.log('  --help                  Show this help message')
  console.log('')
  console.log('Examples:')
  console.log('  node run.js query.graphql')
  console.log('  node run.js "{ bucketItems { id } }"')
  console.log('  node run.js --introspect')
  console.log('  node run.js --endpoint beta --introspect')
  console.log('  cat query.graphql | node run.js')
}

function parseArgs(args) {
  const result = {
    endpoint: 'mock',
    introspect: false,
    variables: null,
    headers: [],
    query: null,
    help: false,
  }

  let i = 0
  while (i < args.length) {
    const arg = args[i]

    if (arg === '--help' || arg === '-h') {
      result.help = true
      i++
    } else if (arg === '--endpoint' && args[i + 1]) {
      result.endpoint = args[i + 1]
      i += 2
    } else if (arg === '--introspect') {
      result.introspect = true
      i++
    } else if (arg === '--variables' && args[i + 1]) {
      result.variables = args[i + 1]
      i += 2
    } else if (arg === '--header' && args[i + 1]) {
      result.headers.push(args[i + 1])
      i += 2
    } else if (!arg.startsWith('--')) {
      if (fs.existsSync(arg)) {
        console.log(`Reading query from file: ${arg}`)
        result.query = fs.readFileSync(arg, 'utf8')
      } else {
        result.query = arg
      }
      i++
    } else {
      i++
    }
  }

  if (!result.query && !result.introspect) {
    if (process.stdin.isTTY === false) {
      try {
        console.log('Reading query from stdin')
        result.query = fs.readFileSync(0, 'utf8')
      } catch (_e) {
        // stdin not available, that's fine
      }
    }
  }

  return result
}

async function executeQuery(options) {
  const endpoint = helpers.getEndpoint(options.endpoint)

  if (!endpoint) {
    console.error(`Unknown endpoint: ${options.endpoint}`)
    console.error('Available endpoints: mock, beta')
    process.exit(1)
  }

  const args = [endpoint]

  if (options.introspect) {
    args.push('--introspect')
  } else if (options.query) {
    args.push('-q', options.query)
  } else {
    console.error('No query provided')
    console.error('Usage:')
    console.error('  node run.js query.graphql              # Execute file')
    console.error('  node run.js "{ bucketItems { id } }"   # Execute inline')
    console.error('  node run.js --introspect               # Introspect schema')
    console.error('  cat query.graphql | node run.js        # Execute from stdin')
    process.exit(1)
  }

  if (options.variables) {
    args.push('--variablesJSON', options.variables)
  }

  for (const header of options.headers) {
    args.push('-H', header)
  }

  if (options.endpoint === 'beta' && !options.headers.some((h) => h.startsWith('Authorization:'))) {
    console.log('ARIA beta endpoint requires authentication.')
    console.log('Attempting to acquire token...')
    try {
      const token = await helpers.getToken()
      args.push('-H', `Authorization: Bearer ${token}`)
      console.log('Token acquired successfully')
    } catch (e) {
      console.error('Failed to acquire token:', e.message)
      console.error('Set environment variables: ARIA_CLIENT_ID, ARIA_CLIENT_SECRET')
      console.error('For password grant, also set: ARIA_USERNAME, ARIA_PASSWORD')
      process.exit(1)
    }
  }

  console.log(`\nExecuting against: ${endpoint}\n`)

  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['--no', 'gq', ...args], {
      stdio: ['inherit', 'inherit', 'inherit'],
      cwd: __dirname,
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`graphqurl exited with code ${code}`))
      }
    })

    proc.on('error', (err) => {
      reject(err)
    })
  })
}

async function main() {
  console.log('GraphQL Skill - ARIA API Explorer\n')

  if (!checkGraphqurlInstalled()) {
    const installed = installGraphqurl()
    if (!installed) {
      process.exit(1)
    }
  }

  const args = process.argv.slice(2)
  const options = parseArgs(args)

  if (options.help) {
    showHelp()
    process.exit(0)
  }

  try {
    await executeQuery(options)
  } catch (error) {
    console.error('Execution failed:', error.message)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error.message)
  process.exit(1)
})
