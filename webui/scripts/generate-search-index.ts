/**
 * Generate search index from docs/ directory for MiniSearch
 *
 * This script scans the docs/ directory and generates a JSON search index
 * containing document metadata and content excerpts. The index is loaded
 * at runtime by MiniSearch for client-side full-text search.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const docsSource = resolve(projectRoot, '..', 'docs')
const indexTarget = resolve(projectRoot, 'public', 'search-index.json')

const EXCLUDED_DIRS = new Set(['_templates', 'images', 'api', '_api', '_static'])
const EXCLUDED_FILES = new Set(['genindex.md', 'athena-decision-service-api-spec.README.md'])

export interface SearchDocument {
  id: string
  title: string
  href: string
  section: string
  content: string
  excerpt: string
}

function extractFrontmatter(content: string): { title?: string; description?: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!match) return {}

  const frontmatter = match[1]
  const result: { title?: string; description?: string } = {}

  const titleMatch = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m)
  if (titleMatch) result.title = titleMatch[1]

  const descMatch = frontmatter.match(/^description:\s*["']?(.+?)["']?\s*$/m)
  if (descMatch) result.description = descMatch[1]

  return result
}

function extractH1Title(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : null
}

function stripMarkdown(content: string): string {
  return content
    .replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\|[^|]+\|/g, '')
    .replace(/^[-:| ]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function createExcerpt(content: string, maxLength: number = 200): string {
  const stripped = stripMarkdown(content)
  const normalized = stripped.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength).trim()}...`
}

function toTitleCase(str: string): string {
  return str.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function getSectionFromPath(relativePath: string): string {
  const parts = relativePath.split('/')
  if (parts.length > 1) {
    return toTitleCase(parts[0])
  }
  return 'Documentation'
}

function processFile(filePath: string, basePath: string, docId: number): SearchDocument | null {
  const content = readFileSync(filePath, 'utf-8')
  const relativePath = relative(docsSource, filePath)
  const frontmatter = extractFrontmatter(content)

  let title = frontmatter.title || extractH1Title(content)
  const fileName = filePath.split('/').pop()?.replace(/\.md$/, '') || ''

  if (!title) {
    title = toTitleCase(
      fileName === 'index' ? relativePath.split('/').slice(-2, -1)[0] || fileName : fileName
    )
  }

  const href = `/docs/${relativePath.replace(/\.md$/, '').replace(/\/index$/, '')}`
  const section = getSectionFromPath(relativePath)
  const strippedContent = stripMarkdown(content)
  const excerpt = frontmatter.description || createExcerpt(content)

  return {
    id: `doc-${docId}`,
    title,
    href,
    section,
    content: strippedContent.slice(0, 5000),
    excerpt,
  }
}

function scanDirectory(
  dir: string,
  basePath: string,
  documents: SearchDocument[],
  counter: { id: number }
): void {
  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue
      scanDirectory(fullPath, basePath, documents, counter)
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      if (EXCLUDED_FILES.has(entry.name)) continue

      const doc = processFile(fullPath, basePath, counter.id)
      if (doc) {
        documents.push(doc)
        counter.id++
      }
    }
  }
}

export function generateSearchIndex(): void {
  console.log('Generating search index from docs/ directory...')

  const documents: SearchDocument[] = []
  const counter = { id: 1 }

  scanDirectory(docsSource, '/docs', documents, counter)

  const index = {
    version: 1,
    generatedAt: new Date().toISOString(),
    documentCount: documents.length,
    documents,
  }

  writeFileSync(indexTarget, JSON.stringify(index, null, 2))
  console.log(`Generated ${relative(projectRoot, indexTarget)} with ${documents.length} documents`)
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  generateSearchIndex()
}
