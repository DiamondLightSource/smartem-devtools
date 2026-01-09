/**
 * Sync documentation from docs/ to webui/src/docs/
 *
 * This script copies markdown files from the docs/ directory to webui/src/docs/
 * as MDX files, preserving the directory structure. Generated MDX files are
 * gitignored and regenerated during prebuild.
 *
 * Manual files (index.mdx, navigation.ts) are preserved and not overwritten.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const docsSource = resolve(projectRoot, '..', 'docs')
const docsTarget = resolve(projectRoot, 'src', 'docs')

// Files to exclude from sync (Sphinx-specific or handled separately)
const EXCLUDED_FILES = new Set([
  'index.md', // Uses React components in webui version
  'genindex.md', // Sphinx-specific
  'athena-decision-service-api-spec.README.md', // API spec file
])

// Directories to exclude from sync
const EXCLUDED_DIRS = new Set(['_templates', 'images', 'api', '_api', '_static'])

// Files that are manually maintained (do not delete or overwrite)
const MANUAL_FILES = new Set(['index.mdx', 'navigation.ts'])

// Note: We don't add a header comment because JSX-style comments {/* */}
// can interfere with MDX parsing of curly braces in content.
const GENERATED_HEADER = ''

interface SyncStats {
  copied: number
  deleted: number
  skipped: number
}

/**
 * Recursively collect all .md files from source directory
 */
function collectMdFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) {
        files.push(...collectMdFiles(fullPath, baseDir))
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      if (!EXCLUDED_FILES.has(entry.name)) {
        files.push(relative(baseDir, fullPath))
      }
    }
  }

  return files
}

/**
 * Recursively collect all .mdx files from target directory
 */
function collectMdxFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []

  if (!existsSync(dir)) {
    return files
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...collectMdxFiles(fullPath, baseDir))
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      if (!MANUAL_FILES.has(entry.name)) {
        files.push(relative(baseDir, fullPath))
      }
    }
  }

  return files
}

/**
 * Sync documentation files from docs/ to webui/src/docs/
 */
export function syncDocs(): SyncStats {
  const stats: SyncStats = { copied: 0, deleted: 0, skipped: 0 }

  console.log('Syncing documentation from docs/ to webui/src/docs/...')

  // Collect source and target files
  const sourceMdFiles = collectMdFiles(docsSource)
  const targetMdxFiles = collectMdxFiles(docsTarget)

  // Build set of expected target files (source files with .mdx extension)
  const expectedTargetFiles = new Set(sourceMdFiles.map((f) => f.replace(/\.md$/, '.mdx')))

  // Delete stale MDX files (exist in target but not in source)
  for (const targetFile of targetMdxFiles) {
    if (!expectedTargetFiles.has(targetFile)) {
      const fullPath = join(docsTarget, targetFile)
      rmSync(fullPath)
      console.log(`  Deleted: ${targetFile}`)
      stats.deleted++
    }
  }

  // Copy source files to target
  for (const sourceFile of sourceMdFiles) {
    const sourcePath = join(docsSource, sourceFile)
    const targetFile = sourceFile.replace(/\.md$/, '.mdx')
    const targetPath = join(docsTarget, targetFile)

    // Create target directory if needed
    const targetDir = dirname(targetPath)
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }

    // Read source content and prepend generated header
    const sourceContent = readFileSync(sourcePath, 'utf-8')
    const targetContent = GENERATED_HEADER + sourceContent

    // Check if target exists and has same content (skip if unchanged)
    if (existsSync(targetPath)) {
      const existingContent = readFileSync(targetPath, 'utf-8')
      if (existingContent === targetContent) {
        stats.skipped++
        continue
      }
    }

    // Write target file
    writeFileSync(targetPath, targetContent)
    console.log(`  Copied: ${sourceFile} -> ${targetFile}`)
    stats.copied++
  }

  console.log(
    `Sync complete: ${stats.copied} copied, ${stats.deleted} deleted, ${stats.skipped} unchanged`
  )

  return stats
}

// Run if executed directly (not imported)
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  syncDocs()
}
