/**
 * Change Effects
 *
 * What moves and what happens when it moves.
 * Used by GitHub workflows and as reference for Claude Code.
 */

export const changeEffects = {
  // ---------------------------------------------------------------------------
  // smartem-decisions repo
  // ---------------------------------------------------------------------------

  'smartem-backend-container': {
    description: 'Backend container image needs rebuild',
    triggers: ['smartem-decisions: src/**/*.py', 'smartem-decisions: Dockerfile'],
    effects: ['Rebuild container image', 'Push to registry'],
    response: 'Level 1: Create issue, needs review before release',
  },

  'smartem-backend-api': {
    description: 'Backend API changed',
    triggers: ['smartem-decisions: **/api/**', 'smartem-decisions: openapi*.yaml'],
    effects: [
      'Rebuild backend container image',
      'Regenerate API documentation',
      'Regenerate TypeScript API client',
      'smartem-frontend needs rebuild (uses API client)',
      'smartem-agent needs rebuild (talks to backend API)',
    ],
    response: 'Level 1: Create issue, API changes need careful review',
  },

  'smartem-agent': {
    description: 'EPU workstation agent changed',
    triggers: ['smartem-decisions: agent/**'],
    effects: ['Rebuild agent binary'],
    response: 'Level 1: Create issue, critical system needs review',
  },

  // ---------------------------------------------------------------------------
  // smartem-frontend repo
  // ---------------------------------------------------------------------------

  'smartem-frontend': {
    description: 'Frontend changed',
    triggers: [
      'smartem-frontend: src/**',
      'Cascade: smartem-backend-api changed',
    ],
    effects: ['Run tests', 'Build frontend', 'New version release'],
    response: 'Level 2: Can auto-PR with tests',
  },

  // ---------------------------------------------------------------------------
  // smartem-devtools repo
  // ---------------------------------------------------------------------------

  'devtools-webui': {
    description: 'Developer dashboard changed',
    triggers: [
      // Webui source code
      'smartem-devtools: webui/src/**',
      'smartem-devtools: webui/index.html',
      // Webui build config
      'smartem-devtools: webui/vite.config.*',
      'smartem-devtools: webui/tsconfig*.json',
      // Webui dependencies
      'smartem-devtools: webui/package.json',
      'smartem-devtools: webui/package-lock.json',
      // Prebuild scripts (generate config + sync docs)
      'smartem-devtools: webui/scripts/prebuild.ts',
      'smartem-devtools: webui/scripts/generate-mdx-docs.ts',
      // Core configs consumed by prebuild
      'smartem-devtools: core/webui-config.ts',
      'smartem-devtools: core/repos.json',
      'smartem-devtools: core/microscope-list.ts',
      'smartem-devtools: core/github-tags-config.ts',
      // Docs synced to MDX by prebuild
      'smartem-devtools: docs/**/*.md',
    ],
    effects: ['Run prebuild (sync docs + generate config)', 'Build webui', 'Deploy to GitHub Pages'],
    response: 'Level 3: Safe to auto-deploy (internal dev tool)',
  },

  'smartem-workspace': {
    description: 'Workspace CLI tool changed',
    triggers: ['smartem-devtools: packages/smartem-workspace/**'],
    effects: ['Run tests', 'Build package', 'Publish to PyPI on tag'],
    response: 'Level 2: Auto-PR, manual release',
  },

  'fsrecorder': {
    description: 'FSRecorder tool changed',
    triggers: ['smartem-devtools: tools/fsrecorder/**'],
    effects: ['Build Windows binary'],
    response: 'Level 2: Auto-PR, manual release',
  },

  'github-labels': {
    description: 'GitHub labels config changed',
    triggers: [
      'smartem-devtools: core/github-tags-config.ts',
      'smartem-devtools: tools/github/sync-labels.ts',
    ],
    effects: ['Sync labels to all 4 repos'],
    response: 'Level 3: Safe to auto-sync',
  },

  // ---------------------------------------------------------------------------
  // fandanGO-cryoem-dls repo
  // ---------------------------------------------------------------------------

  'fandango-plugin': {
    description: 'FandanGO/ARIA connector changed',
    triggers: ['fandanGO-cryoem-dls: **/*.py'],
    effects: ['Run tests', 'Build package'],
    response: 'Level 1: External integration needs review',
  },

  // ---------------------------------------------------------------------------
  // Cross-repo: Dependency updates (dependabot)
  // ---------------------------------------------------------------------------

  'dependency-updates': {
    description: 'Dependabot or manual dependency update',
    triggers: [
      'Any repo: package-lock.json, yarn.lock, pnpm-lock.yaml',
      'Any repo: requirements*.txt, poetry.lock, uv.lock',
      'Any repo: pyproject.toml (deps section)',
    ],
    effects: ['Run tests', 'Create draft PR if tests pass'],
    response: 'Level 2: Auto-PR with tests, needs review before merge',
  },
}

export default changeEffects
