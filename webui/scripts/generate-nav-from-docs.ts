/**
 * Generate navigation.ts from docs/ directory structure
 *
 * This script scans the docs/ directory and generates a navigation tree
 * for the webui documentation sidebar. The docs/ folder is the single
 * source of truth for both content and navigation structure.
 *
 * Convention:
 * - Directory names become section titles (kebab-case → Title Case)
 * - index.md in a directory → section overview page
 * - Other .md files → child pages within section
 * - Files can have frontmatter `title:` to override generated title
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')
const docsSource = resolve(projectRoot, '..', 'docs')
const navTarget = resolve(projectRoot, 'src', 'docs', 'navigation.ts')

// Directories to exclude from navigation (same as generate-mdx-docs.ts)
const EXCLUDED_DIRS = new Set(['_templates', 'images', 'api', '_api', '_static'])

// Files to exclude from navigation
const EXCLUDED_FILES = new Set(['genindex.md', 'athena-decision-service-api-spec.README.md'])

interface NavItem {
  title: string
  href: string
  children?: NavItem[]
}

/**
 * Convert kebab-case or snake_case to Title Case
 */
function toTitleCase(str: string): string {
  return str.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Extract title from markdown frontmatter if present
 */
function extractFrontmatterTitle(filePath: string): string | null {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/)
    if (match) {
      const frontmatter = match[1]
      const titleMatch = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m)
      if (titleMatch) {
        return titleMatch[1]
      }
    }
  } catch {
    // Ignore read errors
  }
  return null
}

/**
 * Extract title from first H1 heading if present
 */
function extractH1Title(filePath: string): string | null {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const match = content.match(/^#\s+(.+)$/m)
    if (match) {
      return match[1].trim()
    }
  } catch {
    // Ignore read errors
  }
  return null
}

/**
 * Get title for a file or directory
 */
function getTitle(name: string, fullPath: string, isDirectory: boolean): string {
  if (isDirectory) {
    // For directories, check if index.md has a title
    const indexPath = join(fullPath, 'index.md')
    if (existsSync(indexPath)) {
      const frontmatterTitle = extractFrontmatterTitle(indexPath)
      if (frontmatterTitle) return frontmatterTitle
      const h1Title = extractH1Title(indexPath)
      if (h1Title) return h1Title
    }
    return toTitleCase(name)
  }

  // For files, check frontmatter then H1 then filename
  const frontmatterTitle = extractFrontmatterTitle(fullPath)
  if (frontmatterTitle) return frontmatterTitle
  const h1Title = extractH1Title(fullPath)
  if (h1Title) return h1Title
  return toTitleCase(name.replace(/\.md$/, ''))
}

/**
 * Build navigation tree from directory
 */
function buildNavTree(dir: string, basePath: string = '/docs'): NavItem[] {
  const items: NavItem[] = []
  const entries = readdirSync(dir, { withFileTypes: true })

  // Sort entries: directories first, then files, alphabetically within each group
  const sortedEntries = entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1
    if (!a.isDirectory() && b.isDirectory()) return 1
    return a.name.localeCompare(b.name)
  })

  for (const entry of sortedEntries) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue

      const href = `${basePath}/${entry.name}`
      const children = buildNavTree(fullPath, href)

      // Only add directory if it has children or an index.md
      const hasIndex = existsSync(join(fullPath, 'index.md'))
      if (children.length > 0 || hasIndex) {
        items.push({
          title: getTitle(entry.name, fullPath, true),
          href,
          children: children.length > 0 ? children : undefined,
        })
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      if (EXCLUDED_FILES.has(entry.name)) continue
      if (entry.name === 'index.md') continue // index.md is represented by parent directory

      const slug = entry.name.replace(/\.md$/, '')
      const href = `${basePath}/${slug}`

      items.push({
        title: getTitle(entry.name, fullPath, false),
        href,
      })
    }
  }

  return items
}

/**
 * Format NavItem array as TypeScript code with proper formatting (single quotes, unquoted keys)
 */
function formatNavItems(items: NavItem[], indent: number = 2): string {
  const spaces = ' '.repeat(indent)
  const innerSpaces = ' '.repeat(indent + 2)

  const formattedItems = items.map((item) => {
    const lines: string[] = []
    lines.push(`${spaces}{`)
    lines.push(`${innerSpaces}title: '${item.title.replace(/'/g, "\\'")}',`)
    lines.push(`${innerSpaces}href: '${item.href}',`)

    if (item.children && item.children.length > 0) {
      lines.push(`${innerSpaces}children: [`)
      lines.push(formatNavItems(item.children, indent + 4))
      lines.push(`${innerSpaces}],`)
    }

    lines.push(`${spaces}},`)
    return lines.join('\n')
  })

  return formattedItems.join('\n')
}

/**
 * Generate TypeScript navigation file
 */
export function generateNavigation(): void {
  console.log('Generating navigation from docs/ structure...')

  const navItems = buildNavTree(docsSource)

  const content = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * This file is generated by scripts/generate-nav-from-docs.ts from the docs/ directory structure.
 * Edit the docs/ folder structure and run 'npm run prebuild' to regenerate.
 */

export interface NavItem {
  title: string
  href: string
  children?: NavItem[]
}

export const docsNavigation: NavItem[] = [
${formatNavItems(navItems)}
]
`

  writeFileSync(navTarget, content)
  console.log(
    `Generated ${relative(projectRoot, navTarget)} with ${navItems.length} top-level sections`
  )
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`
if (isMainModule) {
  generateNavigation()
}
