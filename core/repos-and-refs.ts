/**
 * Repository definitions and external references for SmartEM ecosystem.
 *
 * Source of truth: repos.json
 * This file re-exports the JSON data with TypeScript types for type safety.
 */

import reposConfig from './repos.json'

// Re-export types for consumers
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

export interface OrgRepos {
  org: string
  orgUrl: string
  repos: Repository[]
}

export interface ExternalLinks {
  docs: string
  projectBoard: string
}

export interface ReposAndRefsConfig {
  links: ExternalLinks
  repositories: OrgRepos[]
}

// Transform JSON structure to match existing interface for backward compatibility
const diamondLightSourceOrg = reposConfig.organizations.find(
  (org) => org.name === 'DiamondLightSource',
)
const fragmentScreenOrg = reposConfig.organizations.find((org) => org.name === 'FragmentScreen')
const ariaPHPOrg = reposConfig.organizations.find((org) => org.name === 'aria-php')

export const reposAndRefsConfig: ReposAndRefsConfig = {
  links: {
    docs: reposConfig.links.docs,
    projectBoard: reposConfig.links.projectBoard,
  },
  repositories: [
    {
      org: 'DiamondLightSource',
      orgUrl: diamondLightSourceOrg?.url ?? 'https://github.com/DiamondLightSource',
      repos: (diamondLightSourceOrg?.repos ?? []).map((repo) => ({
        name: repo.name,
        description: repo.description,
        urls: repo.urls,
        tags: repo.tags,
        ownership: repo.ownership,
        required: repo.required,
      })),
    },
    {
      org: 'FragmentScreen',
      orgUrl: fragmentScreenOrg?.url ?? 'https://github.com/FragmentScreen',
      repos: (fragmentScreenOrg?.repos ?? []).map((repo) => ({
        name: repo.name,
        description: repo.description,
        urls: repo.urls,
        tags: repo.tags,
        ownership: repo.ownership,
      })),
    },
    {
      org: 'aria-php',
      orgUrl: ariaPHPOrg?.url ?? 'https://gitlab.com/aria-php',
      repos: (ariaPHPOrg?.repos ?? []).map((repo) => ({
        name: repo.name,
        description: repo.description,
        urls: repo.urls,
        tags: repo.tags,
        ownership: repo.ownership,
      })),
    },
  ],
}

// Export the full config for workspace setup tools
export { reposConfig }

export default reposAndRefsConfig
