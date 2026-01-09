/**
 * GitHub labels configuration for SmartEM repositories.
 * Used for issue/PR categorisation and project management.
 *
 * This file defines:
 * - Label definitions (types of work, system components)
 * - Per-repo label assignments
 *
 * Synced using: npx tsx tools/github/sync-labels.ts --sync
 */

export interface GitHubLabel {
  name: string
  description: string
  color: string // 6-char hex without #
}

export interface RepoLabelConfig {
  repo: string
  labels: 'all' | 'types-only'
}

export interface GitHubLabelsConfig {
  owner: string
  typesOfWork: GitHubLabel[]
  systemComponents: GitHubLabel[]
  repos: RepoLabelConfig[]
}

/**
 * Types of work labels - categorise the nature of the work being done.
 * Colors: Distinct hues avoiding blue/pink families (reserved for components).
 */
const typesOfWork: GitHubLabel[] = [
  { name: 'documentation', description: 'Improvements or additions to project documentation', color: '0d6d6e' },
  { name: 'testing', description: 'Writing, updating, or fixing automated tests', color: '2da44e' },
  { name: 'bugfixing', description: 'Fixing defects or unexpected behavior in existing code', color: 'cf222e' },
  { name: 'development', description: 'New features or functionality implementation', color: '8250df' },
  { name: 'refactoring', description: 'Code restructuring without changing external behavior', color: 'bc4c00' },
  { name: 'research', description: 'Investigation, spikes, or proof-of-concept work', color: '0598bd' },
  { name: 'devops', description: 'CI/CD, deployment, infrastructure, or tooling work', color: '57606a' },
  { name: 'security', description: 'Security fixes, audits, or vulnerability remediation', color: 'a40e26' },
  { name: 'admin', description: 'Project maintenance, dependency updates, or housekeeping', color: '7c4a03' },
  { name: 'enhancement', description: 'Minor improvements to existing functionality', color: '1b7c83' },
]

/**
 * System component labels - identify which part of the system is affected.
 * Colors: Blue family for backend, pink family for devtools, unique colors for standalone.
 */
const systemComponents: GitHubLabel[] = [
  // smartem-backend family (ocean blue scale: #0a3069 -> #0550ae -> #218bff)
  { name: 'smartem-backend', description: 'Core backend services, messaging, and persistence layer', color: '0a3069' },
  { name: 'smartem-backend:db', description: 'Database schema, migrations, and data layer changes', color: '0550ae' },
  { name: 'smartem-backend:api', description: 'REST API endpoints and HTTP interface changes', color: '218bff' },

  // smartem-agent (gold - standalone)
  { name: 'smartem-agent', description: 'EPU workstation agent for microscope integration', color: '9a6700' },

  // smartem-frontend (green - standalone)
  { name: 'smartem-frontend', description: 'User-facing web UI for acquisition sessions and ML decisions', color: '1a7f37' },

  // smartem-aria-connector (purple - standalone)
  { name: 'smartem-aria-connector', description: 'ARIA deposition integration via FandanGO plugin', color: '6639ba' },

  // smartem-devtools family (warm pink scale: #99154b -> #bf3989 -> #db61a2 -> #f09bc8)
  { name: 'smartem-devtools', description: 'Developer tooling, documentation, and workspace configuration', color: '99154b' },
  { name: 'smartem-devtools:webui', description: 'Developer dashboard web interface', color: 'bf3989' },
  { name: 'smartem-devtools:claude', description: 'Claude Code configuration, skills, and prompts', color: 'db61a2' },
  { name: 'smartem-devtools:e2e-test', description: 'End-to-end testing infrastructure and scenarios', color: 'f09bc8' },
]

/**
 * Per-repo label configuration.
 * - 'all': Types of work + system components
 * - 'types-only': Only types of work labels
 */
const repos: RepoLabelConfig[] = [
  { repo: 'smartem-devtools', labels: 'all' },
  { repo: 'smartem-decisions', labels: 'types-only' },
  { repo: 'smartem-frontend', labels: 'types-only' },
  { repo: 'fandanGO-cryoem-dls', labels: 'types-only' },
]

export const githubLabelsConfig: GitHubLabelsConfig = {
  owner: 'DiamondLightSource',
  typesOfWork,
  systemComponents,
  repos,
}

export default githubLabelsConfig
