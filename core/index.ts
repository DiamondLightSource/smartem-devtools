/**
 * Core configuration module for SmartEM devtools.
 *
 * This file provides TypeScript types and typed re-exports for all JSON config files.
 * JSON files are the source of truth for data; this file is the source of truth for types.
 *
 * Usage:
 *   import { repos, githubLabels, webUiConfig } from '../core'
 *
 * @see docs/decision-records/decisions/0013-json-config-with-typescript-types.md
 */

// =============================================================================
// JSON Imports
// =============================================================================

import reposJson from './repos.json'
import artefactsJson from './artefacts.json'
import githubLabelsJson from './github-labels.json'
import webUiConfigJson from './webui-config.json'
import microscopeListJson from './microscope-list.json'

// =============================================================================
// Repository Types (repos.json)
// =============================================================================

export interface RepoUrls {
  https: string
  ssh: string
}

export interface Repository {
  name: string
  description: string
  urls: RepoUrls
  tags?: string[]
  ownership?: 'full' | 'reference-only'
  required?: boolean
}

export interface Organization {
  name: string
  displayName: string
  url: string
  provider: 'github' | 'gitlab'
  repos: Repository[]
}

export interface Preset {
  description: string
  repos: string[]
}

export interface ExternalLinks {
  docs: string
  projectBoard: string
}

export interface ReposConfig {
  version: string
  links: ExternalLinks
  presets: Record<string, Preset>
  organizations: Organization[]
}

// =============================================================================
// Artefacts Types (artefacts.json)
// =============================================================================

export interface ArtefactItem {
  id: string
  label: string
  url: string
  description?: string
  command?: string
}

export interface ArtefactsConfig {
  items: ArtefactItem[]
}

// =============================================================================
// GitHub Labels Types (github-labels.json)
// =============================================================================

/** GitHub label definition for issue/PR categorisation */
export interface GitHubLabel {
  name: string
  description: string
  /** 6-character hex color without # prefix */
  color: string
}

export interface RepoLabelConfig {
  repo: string
  labels: 'all' | 'types-only'
}

export interface GitHubLabelsConfig {
  owner: string
  /** Labels categorising the nature of work (documentation, testing, bugfixing, etc.) */
  typesOfWork: GitHubLabel[]
  /** Labels identifying which system component is affected */
  systemComponents: GitHubLabel[]
  /** Per-repo label assignment configuration */
  repos: RepoLabelConfig[]
}

// =============================================================================
// WebUI Config Types (webui-config.json)
// =============================================================================

export interface FeatureFlags {
  /** Enable dynamic repo stats fetching in development mode */
  repoStatsInDev: boolean
  /** Enable dynamic repo stats fetching in production mode */
  repoStatsInProd: boolean
  /** Line style for dashboard connection overlay */
  connectionLineStyle: 'straight' | 'bezier' | 'orthogonal'
}

export interface HeaderButtonConfig {
  text?: string
  tooltip: string
}

export interface HeaderConfig {
  homeButton: HeaderButtonConfig
  docsButton: HeaderButtonConfig
  boardButton: HeaderButtonConfig
  artefactsButton: HeaderButtonConfig
  menuButton: HeaderButtonConfig
  omniboxPlaceholder: string
  repoSelectorLabel: string
}

export interface WebUiConfig {
  appTitle: string
  header: HeaderConfig
}

export interface WebUiConfigFile {
  appTitle: string
  featureFlags: FeatureFlags
  header: HeaderConfig
}

// =============================================================================
// Search Config Types (kept as TS due to complexity - not JSON)
// =============================================================================

export interface SearchRepoConfig {
  owner: string
  repo: string
  label: string
}

export interface ShortcutConfig {
  /** Enable keyboard shortcut */
  enabled: boolean
  /** Key to press (e.g., '/', 'k') */
  key: string
  /** Require Cmd (Mac) or Ctrl (Win/Linux) */
  requireMeta: boolean
  /** Require Shift modifier */
  requireShift: boolean
}

export interface SearchConfig {
  /** Debounce delay in milliseconds for search queries */
  debounceMs: number
  /** Maximum results to return per source */
  resultsPerSource: number
  /** GitHub repositories to search */
  githubRepos: SearchRepoConfig[]
  /** Enable GitHub search (requires auth) */
  enableGithubSearch: boolean
  /** Keyboard shortcut configuration */
  shortcut: ShortcutConfig
  /** Placeholder text for the search input */
  placeholder: string
  /** Hint shown when search input is empty */
  emptyStateHint: string
  /** Message shown when no results are found (query appended) */
  noResultsText: string
  /** Message shown when GitHub API rate limit is exceeded */
  rateLimitMessage: string
  /** Display mode for GitHub filter chips: 'divider' | 'label' | 'icon' */
  githubChipDisplay: 'divider' | 'label' | 'icon'
}

// Search config with default values (not JSON - too complex for simple JSON)
export const searchConfig: SearchConfig = {
  debounceMs: 300,
  resultsPerSource: 10,
  githubRepos: [
    { owner: 'DiamondLightSource', repo: 'smartem-decisions', label: 'smartem-decisions' },
    { owner: 'DiamondLightSource', repo: 'smartem-frontend', label: 'smartem-frontend' },
    { owner: 'DiamondLightSource', repo: 'smartem-devtools', label: 'smartem-devtools' },
    { owner: 'DiamondLightSource', repo: 'fandanGO-cryoem-dls', label: 'fandanGO-cryoem-dls' },
  ],
  enableGithubSearch: true,
  shortcut: {
    enabled: false, // known bug: "/" shortcut doesn't work in Firefox
    key: '/',
    requireMeta: false,
    requireShift: false,
  },
  placeholder: 'Search docs, issues, PRs, commits...',
  emptyStateHint: 'Type to search documentation and GitHub',
  noResultsText: 'No results found',
  rateLimitMessage: 'GitHub search unavailable (rate limit)',
  githubChipDisplay: 'icon',
}

// =============================================================================
// Microscope Types (microscope-list.json)
// =============================================================================

/** CryoEM instrument definition for DLS eBIC facility */
export interface CryoEMInstrument {
  name: string
  alias: string
}

// =============================================================================
// Typed Config Exports
// =============================================================================

export const repos: ReposConfig = reposJson as ReposConfig
export const artefacts: ArtefactsConfig = artefactsJson as ArtefactsConfig
export const githubLabels: GitHubLabelsConfig = githubLabelsJson as GitHubLabelsConfig
export const webUiConfigFile: WebUiConfigFile = webUiConfigJson as WebUiConfigFile
export const microscopes: CryoEMInstrument[] = microscopeListJson as CryoEMInstrument[]

// Derived exports for webui compatibility
export const webUiConfig: WebUiConfig = {
  appTitle: webUiConfigFile.appTitle,
  header: webUiConfigFile.header,
}
export const featureFlags: FeatureFlags = webUiConfigFile.featureFlags

// =============================================================================
// Aggregated Export (for webui compatibility)
// =============================================================================

export interface CoreConfig {
  repos: ReposConfig
  artefacts: ArtefactsConfig
  githubLabels: GitHubLabelsConfig
  webUiConfig: WebUiConfig
  microscopes: CryoEMInstrument[]
}

export const coreConfig: CoreConfig = {
  repos,
  artefacts,
  githubLabels,
  webUiConfig,
  microscopes,
}

export default coreConfig
