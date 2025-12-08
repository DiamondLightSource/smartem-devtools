#!/usr/bin/env npx tsx
/**
 * GitHub Labels Sync Script
 *
 * Syncs GitHub labels across SmartEM repositories to match the definition
 * in core/github-tags-config.ts.
 *
 * Usage:
 *   npx tsx tools/github/sync-labels.ts --check    # Check conformity (default)
 *   npx tsx tools/github/sync-labels.ts --sync     # Sync labels to all repos
 *   npx tsx tools/github/sync-labels.ts --sync --repo smartem-decisions
 *
 * Requires: gh CLI installed and authenticated
 */

import { execSync } from 'child_process'
import { githubTagsConfig, type GitHubLabel } from '../../core/github-tags-config.js'

const OWNER = 'DiamondLightSource'
const TARGET_REPOS = [
  'smartem-decisions',
  'smartem-frontend',
  'smartem-devtools',
  'fandanGO-cryoem-dls',
]

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
    repos = TARGET_REPOS
  }

  return { mode, repos, verbose }
}

function getAllDefinedLabels(): GitHubLabel[] {
  return [...githubTagsConfig.typesOfWork, ...githubTagsConfig.systemComponents]
}

function getExistingLabels(repo: string): ExistingLabel[] {
  try {
    const result = execSync(
      `gh label list --repo ${OWNER}/${repo} --json name,description,color --limit 100`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    )
    return JSON.parse(result)
  } catch (error) {
    console.error(`Failed to fetch labels from ${OWNER}/${repo}`)
    throw error
  }
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

function createLabel(repo: string, label: GitHubLabel): void {
  const desc = label.description.replace(/"/g, '\\"')
  execSync(
    `gh label create "${label.name}" --repo ${OWNER}/${repo} --description "${desc}" --color "${label.color}"`,
    { stdio: 'inherit' }
  )
}

function updateLabel(repo: string, label: GitHubLabel): void {
  const desc = label.description.replace(/"/g, '\\"')
  execSync(
    `gh label edit "${label.name}" --repo ${OWNER}/${repo} --description "${desc}" --color "${label.color}"`,
    { stdio: 'inherit' }
  )
}

function deleteLabel(repo: string, name: string): void {
  execSync(`gh label delete "${name}" --repo ${OWNER}/${repo} --yes`, { stdio: 'inherit' })
}

function printDiff(repo: string, diff: LabelDiff, verbose: boolean): void {
  console.log(`\n=== ${OWNER}/${repo} ===`)

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
  const defined = getAllDefinedLabels()

  console.log(`GitHub Labels Sync`)
  console.log(`Mode: ${mode}`)
  console.log(`Repos: ${repos.join(', ')}`)
  console.log(`Defined labels: ${defined.length}`)

  const results: { repo: string; diff: LabelDiff }[] = []

  for (const repo of repos) {
    const existing = getExistingLabels(repo)
    const diff = compareLabels(existing, defined)
    results.push({ repo, diff })
    printDiff(repo, diff, verbose)
  }

  const nonConforming = results.filter((r) => !isConforming(r.diff))
  console.log(`\n--- Summary ---`)
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
    const definedMap = new Map(defined.map((l) => [l.name, l]))

    for (const { repo, diff } of results) {
      if (isConforming(diff)) {
        console.log(`\n${repo}: Already conforming, skipping`)
        continue
      }

      console.log(`\n${repo}: Syncing...`)

      for (const name of diff.extra) {
        console.log(`  Deleting: ${name}`)
        deleteLabel(repo, name)
      }

      for (const name of diff.missing) {
        const label = definedMap.get(name)!
        console.log(`  Creating: ${name}`)
        createLabel(repo, label)
      }

      for (const { name } of diff.outdated) {
        const label = definedMap.get(name)!
        console.log(`  Updating: ${name}`)
        updateLabel(repo, label)
      }
    }

    console.log('\nSync complete')
  }
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
