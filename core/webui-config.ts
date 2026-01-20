/**
 * Web UI configuration for SmartEM frontend.
 *
 * This file is intentionally minimal. Configuration is split across:
 * - github-labels-config.ts - GitHub labels and per-repo configuration
 * - repos-and-refs.ts - Repository definitions and external links
 * - microscope-list.ts - CryoEM instrument definitions
 *
 * The prebuild script in webui/ aggregates these into webui-app-contents.ts
 */

// =============================================================================
// Feature Flags
// =============================================================================

export interface FeatureFlags {
  /** Enable dynamic repo stats fetching in development mode */
  repoStatsInDev: boolean
  /** Enable dynamic repo stats fetching in production mode */
  repoStatsInProd: boolean
  /** Line style for dashboard connection overlay: 'straight' | 'bezier' | 'orthogonal' */
  connectionLineStyle: 'straight' | 'bezier' | 'orthogonal'
}

export const featureFlags: FeatureFlags = {
  repoStatsInDev: true,
  repoStatsInProd: true,
  connectionLineStyle: 'bezier',
}

// =============================================================================
// Search Configuration
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
// Header Configuration
// =============================================================================

export interface HeaderButtonConfig {
  text?: string
  tooltip: string
}

export interface HeaderConfig {
  homeButton: HeaderButtonConfig
  docsButton: HeaderButtonConfig
  boardButton: HeaderButtonConfig
  menuButton: HeaderButtonConfig
  omniboxPlaceholder: string
  repoSelectorLabel: string
}

export interface WebUiConfig {
  appTitle: string
  header: HeaderConfig
}

export const webUiConfig: WebUiConfig = {
  appTitle: 'SmartEM Dev Dashboard',
  header: {
    homeButton: { tooltip: 'Navigate to dashboard home' },
    docsButton: { text: 'docs', tooltip: 'Open project documentation' },
    boardButton: { text: 'board', tooltip: 'Open GitHub project board' },
    menuButton: { tooltip: 'Open settings menu' },
    omniboxPlaceholder: 'search..',
    repoSelectorLabel: 'repos / codebases',
  },
}

export default webUiConfig
