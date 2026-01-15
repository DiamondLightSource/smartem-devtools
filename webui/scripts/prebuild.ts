/**
 * Prebuild script for webui.
 *
 * Syncs documentation from docs/ to webui/src/docs/ as MDX files.
 * Configuration is now imported directly from core/index.ts at build time.
 */

// Sync documentation from docs/ to webui/src/docs/
import { syncDocs } from './generate-mdx-docs.js'
import { generateNavigation } from './generate-nav-from-docs.js'
import { generateSearchIndex } from './generate-search-index.js'

syncDocs()
generateNavigation()
generateSearchIndex()
