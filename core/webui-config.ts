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

export interface SearchConfig {
  /** Debounce delay in milliseconds for search queries */
  debounceMs: number
  /** Maximum results to return per source */
  resultsPerSource: number
  /** GitHub repositories to search */
  githubRepos: SearchRepoConfig[]
  /** Enable GitHub search (requires auth) */
  enableGithubSearch: boolean
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
