/**
 * WebUI configuration adapter.
 *
 * Imports from core/ and transforms to the webUiAppContents format expected by components.
 * This keeps the transformation logic in one place and provides a stable interface.
 */

import {
  type ArtefactsConfig,
  artefacts,
  type CryoEMInstrument,
  type FeatureFlags,
  featureFlags,
  type GitHubLabelsConfig,
  githubLabels,
  microscopes,
  type ReposConfig,
  type Repository,
  repos,
  type SearchConfig,
  searchConfig,
  type WebUiConfig,
  webUiConfig,
} from '../../../core'

// =============================================================================
// Transformed Types for WebUI
// =============================================================================

export interface RepoUrls {
  https: string
  ssh: string
}

export interface WebUiRepository {
  name: string
  description: string
  urls: RepoUrls
  tags?: string[]
  ownership?: 'full' | 'reference-only'
  required?: boolean
}

export interface OrgRepos {
  org: string
  orgUrl: string
  repos: WebUiRepository[]
}

export interface ExternalLinks {
  docs: string
  projectBoard: string
}

export interface ReposAndRefsConfig {
  links: ExternalLinks
  repositories: OrgRepos[]
}

// =============================================================================
// Transform repos.json to webui format
// =============================================================================

function transformRepos(config: ReposConfig): ReposAndRefsConfig {
  return {
    links: config.links,
    repositories: config.organizations.map((org) => ({
      org: org.name,
      orgUrl: org.url,
      repos: org.repos.map((repo) => ({
        name: repo.name,
        description: repo.description,
        urls: repo.urls,
        tags: repo.tags,
        ownership: repo.ownership,
        required: repo.required,
      })),
    })),
  }
}

// =============================================================================
// Aggregated App Contents
// =============================================================================

export interface WebUiAppContents {
  githubLabels: GitHubLabelsConfig
  repos: ReposAndRefsConfig
  microscopes: CryoEMInstrument[]
  config: WebUiConfig
  featureFlags: FeatureFlags
  searchConfig: SearchConfig
  artefacts: ArtefactsConfig
}

export const webUiAppContents: WebUiAppContents = {
  githubLabels,
  repos: transformRepos(repos),
  microscopes,
  config: webUiConfig,
  featureFlags,
  searchConfig,
  artefacts,
}

// Re-export types that components might need
export type {
  GitHubLabelsConfig,
  ArtefactsConfig,
  FeatureFlags,
  CryoEMInstrument,
  Repository,
  SearchConfig,
}

export default webUiAppContents
