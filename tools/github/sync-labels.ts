#!/usr/bin/env npx tsx
/**
 * GitHub Labels Sync Script
 *
 * Syncs GitHub labels across SmartEM repositories to match the configuration
 * in core/github-labels-config.ts.
 *
 * Usage:
 *   npx tsx tools/github/sync-labels.ts --check    # Check conformity (default)
 *   npx tsx tools/github/sync-labels.ts --sync     # Sync labels to all repos
 *   npx tsx tools/github/sync-labels.ts --sync --repo smartem-decisions
 *
 * Backends:
 *   - Primary: gh CLI (requires `gh auth login`)
 *   - Fallback: GitHub REST API (requires GITHUB_TOKEN env var)
 */

import { $ } from 'zx'
import { githubLabelsConfig, type GitHubLabel } from '../../core/github-labels-config.js'

// Suppress zx verbose output
$.verbose = false

const { owner: OWNER, repos: REPO_CONFIGS, typesOfWork, systemComponents } = githubLabelsConfig

interface ExistingLabel {
  name: string
  description: string
  color: string
}

interface LabelDiff {
  conforming: string[]
  missing: string[]
  extra: string[]
  outdated: { name: string; reason: string }[]
}

/**
 * Backend abstraction for GitHub label operations
 */
interface LabelBackend {
  name: string
  checkAuth(): Promise<void>
  getLabels(repo: string): Promise<ExistingLabel[]>
  createLabel(repo: string, label: GitHubLabel): Promise<void>
  updateLabel(repo: string, label: GitHubLabel): Promise<void>
  deleteLabel(repo: string, name: string): Promise<void>
}

/**
 * gh CLI backend - uses zx for shell execution
 */
class GhCliBackend implements LabelBackend {
  name = 'gh CLI'

  async checkAuth(): Promise<void> {
    try {
      await $`gh auth status`
    } catch {
      console.error('\n[Error] GitHub CLI is not authenticated.')
      console.error('Please run: gh auth login')
      console.error('Or set GITHUB_TOKEN environment variable to use API fallback.\n')
      process.exit(1)
    }
  }

  async getLabels(repo: string): Promise<ExistingLabel[]> {
    const result = await $`gh label list --repo ${OWNER}/${repo} --json name,description,color --limit 100`
    const output = result.stdout.trim()
    if (!output) {
      return []
    }
    return JSON.parse(output)
  }

  async createLabel(repo: string, label: GitHubLabel): Promise<void> {
    await $`gh label create ${label.name} --repo ${OWNER}/${repo} --description ${label.description} --color ${label.color}`
  }

  async updateLabel(repo: string, label: GitHubLabel): Promise<void> {
    await $`gh label edit ${label.name} --repo ${OWNER}/${repo} --description ${label.description} --color ${label.color}`
  }

  async deleteLabel(repo: string, name: string): Promise<void> {
    await $`gh label delete ${name} --repo ${OWNER}/${repo} --yes`
  }
}

/**
 * GitHub REST API backend - uses native fetch
 */
class GitHubApiBackend implements LabelBackend {
  name = 'GitHub API'
  private token: string

  constructor() {
    this.token = process.env.GITHUB_TOKEN || ''
  }

  async checkAuth(): Promise<void> {
    if (!this.token) {
      console.error('\n[Error] GITHUB_TOKEN environment variable is not set.')
      console.error('Please set it with a token that has repo scope:')
      console.error('  export GITHUB_TOKEN=ghp_xxxxxxxxxxxx')
      console.error('Or install and authenticate gh CLI: gh auth login\n')
      process.exit(1)
    }

    // Verify token works
    const response = await fetch('https://api.github.com/user', {
      headers: this.headers(),
    })

    if (!response.ok) {
      console.error('\n[Error] GITHUB_TOKEN is invalid or expired.')
      console.error('Please generate a new token with repo scope at:')
      console.error('  https://github.com/settings/tokens\n')
      process.exit(1)
    }
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
  }

  async getLabels(repo: string): Promise<ExistingLabel[]> {
    const response = await fetch(`https://api.github.com/repos/${OWNER}/${repo}/labels?per_page=100`, {
      headers: this.headers(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch labels: ${response.statusText}`)
    }

    const data = (await response.json()) as Array<{ name: string; description: string | null; color: string }>
    return data.map((l) => ({
      name: l.name,
      description: l.description || '',
      color: l.color,
    }))
  }

  async createLabel(repo: string, label: GitHubLabel): Promise<void> {
    const response = await fetch(`https://api.github.com/repos/${OWNER}/${repo}/labels`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        name: label.name,
        description: label.description,
        color: label.color,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create label: ${response.statusText}`)
    }
  }

  async updateLabel(repo: string, label: GitHubLabel): Promise<void> {
    const response = await fetch(`https://api.github.com/repos/${OWNER}/${repo}/labels/${encodeURIComponent(label.name)}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify({
        description: label.description,
        color: label.color,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to update label: ${response.statusText}`)
    }
  }

  async deleteLabel(repo: string, name: string): Promise<void> {
    const response = await fetch(`https://api.github.com/repos/${OWNER}/${repo}/labels/${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: this.headers(),
    })

    if (!response.ok) {
      throw new Error(`Failed to delete label: ${response.statusText}`)
    }
  }
}

/**
 * Select the best available backend
 */
async function selectBackend(): Promise<LabelBackend> {
  try {
    await $`gh --version`
    const backend = new GhCliBackend()
    await backend.checkAuth()
    return backend
  } catch {
    // gh CLI not available or not authenticated, try API
    console.log('gh CLI not available or not authenticated, trying GitHub API...')
    const backend = new GitHubApiBackend()
    await backend.checkAuth()
    return backend
  }
}

/**
 * Get the labels that should be applied to a specific repo based on config
 */
function getLabelsForRepo(repo: string): GitHubLabel[] {
  const config = REPO_CONFIGS.find((r) => r.repo === repo)
  if (!config) {
    console.warn(`Warning: No config found for repo '${repo}', using types-only`)
    return [...typesOfWork]
  }

  if (config.labels === 'all') {
    return [...typesOfWork, ...systemComponents]
  }
  return [...typesOfWork]
}

function parseArgs(): { mode: 'check' | 'sync'; repos: string[]; verbose: boolean } {
  const args = process.argv.slice(2)
  let mode: 'check' | 'sync' = 'check'
  let repos: string[] = []
  let verbose = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--sync') {
      mode = 'sync'
    } else if (arg === '--check') {
      mode = 'check'
    } else if (arg === '--verbose' || arg === '-v') {
      verbose = true
    } else if (arg === '--repo' && args[i + 1]) {
      repos.push(args[++i])
    }
  }

  if (repos.length === 0) {
    repos = REPO_CONFIGS.map((r) => r.repo)
  }

  return { mode, repos, verbose }
}

function compareLabels(existing: ExistingLabel[], defined: GitHubLabel[]): LabelDiff {
  const definedMap = new Map(defined.map((l) => [l.name, l]))
  const existingMap = new Map(existing.map((l) => [l.name, l]))

  const conforming: string[] = []
  const missing: string[] = []
  const extra: string[] = []
  const outdated: { name: string; reason: string }[] = []

  for (const label of defined) {
    const existing = existingMap.get(label.name)
    if (!existing) {
      missing.push(label.name)
    } else {
      const reasons: string[] = []
      if (existing.description !== label.description) {
        reasons.push('description')
      }
      if (existing.color.toLowerCase() !== label.color.toLowerCase()) {
        reasons.push('color')
      }
      if (reasons.length > 0) {
        outdated.push({ name: label.name, reason: reasons.join(', ') })
      } else {
        conforming.push(label.name)
      }
    }
  }

  for (const label of existing) {
    if (!definedMap.has(label.name)) {
      extra.push(label.name)
    }
  }

  return { conforming, missing, extra, outdated }
}

function printDiff(repo: string, diff: LabelDiff, expectedCount: number, verbose: boolean): void {
  console.log(`\n=== ${OWNER}/${repo} (expects ${expectedCount} labels) ===`)

  if (diff.conforming.length > 0) {
    console.log(`  [ok] ${diff.conforming.length} labels conforming`)
    if (verbose) {
      diff.conforming.forEach((n) => console.log(`       - ${n}`))
    }
  }

  if (diff.missing.length > 0) {
    console.log(`  [missing] ${diff.missing.length} labels: ${diff.missing.join(', ')}`)
  }

  if (diff.extra.length > 0) {
    console.log(`  [extra] ${diff.extra.length} labels: ${diff.extra.join(', ')}`)
  }

  if (diff.outdated.length > 0) {
    console.log(`  [outdated] ${diff.outdated.length} labels:`)
    diff.outdated.forEach((l) => console.log(`       - ${l.name} (${l.reason} changed)`))
  }
}

function isConforming(diff: LabelDiff): boolean {
  return diff.missing.length === 0 && diff.extra.length === 0 && diff.outdated.length === 0
}

async function main(): Promise<void> {
  const { mode, repos, verbose } = parseArgs()

  console.log('GitHub Labels Sync')
  console.log(`Mode: ${mode}`)
  console.log(`Repos: ${repos.join(', ')}`)

  const backend = await selectBackend()
  console.log(`Backend: ${backend.name}`)

  const results: { repo: string; diff: LabelDiff; defined: GitHubLabel[] }[] = []

  for (const repo of repos) {
    const defined = getLabelsForRepo(repo)
    const existing = await backend.getLabels(repo)
    const diff = compareLabels(existing, defined)
    results.push({ repo, diff, defined })
    printDiff(repo, diff, defined.length, verbose)
  }

  const nonConforming = results.filter((r) => !isConforming(r.diff))
  console.log('\n--- Summary ---')
  console.log(`${results.length} repos checked, ${nonConforming.length} non-conforming`)

  if (mode === 'check') {
    if (nonConforming.length > 0) {
      console.log('\nRun with --sync to apply changes')
      process.exit(1)
    }
    console.log('\nAll repos conforming')
    process.exit(0)
  }

  if (mode === 'sync') {
    for (const { repo, diff, defined } of results) {
      const definedMap = new Map(defined.map((l) => [l.name, l]))

      if (isConforming(diff)) {
        console.log(`\n${repo}: Already conforming, skipping`)
        continue
      }

      console.log(`\n${repo}: Syncing...`)

      for (const name of diff.extra) {
        console.log(`  Deleting: ${name}`)
        await backend.deleteLabel(repo, name)
      }

      for (const name of diff.missing) {
        const label = definedMap.get(name)!
        console.log(`  Creating: ${name}`)
        await backend.createLabel(repo, label)
      }

      for (const { name } of diff.outdated) {
        const label = definedMap.get(name)!
        console.log(`  Updating: ${name}`)
        await backend.updateLabel(repo, label)
      }
    }

    console.log('\nSync complete')
  }
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
