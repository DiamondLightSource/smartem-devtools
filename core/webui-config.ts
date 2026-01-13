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
  artefactsButton: HeaderButtonConfig
  menuButton: HeaderButtonConfig
  omniboxPlaceholder: string
  repoSelectorLabel: string
}

// =============================================================================
// Artefacts Configuration
// =============================================================================

export interface ArtefactItem {
  id: string
  label: string
  url: string
  description?: string
}

export interface ArtefactsConfig {
  items: ArtefactItem[]
}

export interface WebUiConfig {
  appTitle: string
  header: HeaderConfig
  artefacts: ArtefactsConfig
}

export const webUiConfig: WebUiConfig = {
  appTitle: 'SmartEM Dev Dashboard',
  header: {
    homeButton: { tooltip: 'Navigate to dashboard home' },
    docsButton: { text: 'docs', tooltip: 'Open project documentation' },
    boardButton: { text: 'board', tooltip: 'Open GitHub project board' },
    artefactsButton: { text: 'artefacts', tooltip: 'Download artefacts and releases' },
    menuButton: { tooltip: 'Open settings menu' },
    omniboxPlaceholder: 'search..',
    repoSelectorLabel: 'repos / codebases',
  },
  artefacts: {
    items: [
      { id: 'workspace', label: 'SmartEM Dev Workspace', url: '#', description: 'Python CLI tool' },
      { id: 'backend', label: 'SmartEM Backend (Container)', url: '#', description: 'Docker container image' },
      { id: 'agent', label: 'SmartEM Agent (Win10)', url: '#', description: 'Windows 10 executable' },
      { id: 'fsrecorder', label: 'FSRecorder (Win10)', url: '#', description: 'Windows 10 executable' },
      { id: 'frontend', label: 'SmartEM Frontend', url: '#', description: 'Web UI package' },
    ],
  },
}

export default webUiConfig
