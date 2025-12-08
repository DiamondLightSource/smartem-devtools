/**
 * Repository definitions and external references for SmartEM ecosystem.
 */

export interface RepoUrls {
  https: string
  ssh: string
}

export interface Repository {
  name: string
  description: string
  urls: RepoUrls
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

const diamondLightSourceRepos: Repository[] = [
  {
    name: 'smartem-decisions',
    description: 'Central system controller - backbone, messaging router, persistence, auth',
    urls: {
      https: 'https://github.com/DiamondLightSource/smartem-decisions.git',
      ssh: 'git@github.com:DiamondLightSource/smartem-decisions.git',
    },
  },
  {
    name: 'smartem-frontend',
    description: 'Web UI for SmartEM - user-facing view of acquisition sessions and ML decisions',
    urls: {
      https: 'https://github.com/DiamondLightSource/smartem-frontend.git',
      ssh: 'git@github.com:DiamondLightSource/smartem-frontend.git',
    },
  },
  {
    name: 'smartem-devtools',
    description: 'Developer tooling, documentation, and workspace configuration',
    urls: {
      https: 'https://github.com/DiamondLightSource/smartem-devtools.git',
      ssh: 'git@github.com:DiamondLightSource/smartem-devtools.git',
    },
  },
  {
    name: 'fandanGO-cryoem-dls',
    description: 'DLS facility plugin for FandanGO - bridges SmartEM to ARIA',
    urls: {
      https: 'https://github.com/DiamondLightSource/fandanGO-cryoem-dls.git',
      ssh: 'git@github.com:DiamondLightSource/fandanGO-cryoem-dls.git',
    },
  },
  {
    name: 'cryoem-services',
    description: 'Processing execution layer for cryo-EM data pipelines (reference-only)',
    urls: {
      https: 'https://github.com/DiamondLightSource/cryoem-services.git',
      ssh: 'git@github.com:DiamondLightSource/cryoem-services.git',
    },
  },
]

const fragmentScreenRepos: Repository[] = [
  {
    name: 'fandanGO-core',
    description: 'Plugin framework foundation',
    urls: {
      https: 'https://github.com/FragmentScreen/fandanGO-core.git',
      ssh: 'git@github.com:FragmentScreen/fandanGO-core.git',
    },
  },
  {
    name: 'fandanGO-aria',
    description: 'ARIA integration - auth, token management, metadata submission',
    urls: {
      https: 'https://github.com/FragmentScreen/fandanGO-aria.git',
      ssh: 'git@github.com:FragmentScreen/fandanGO-aria.git',
    },
  },
  {
    name: 'fandanGO-cryoem-cnb',
    description: 'CNB-CSIC Madrid cryo-EM plugin (peer reference)',
    urls: {
      https: 'https://github.com/FragmentScreen/fandanGO-cryoem-cnb.git',
      ssh: 'git@github.com:FragmentScreen/fandanGO-cryoem-cnb.git',
    },
  },
  {
    name: 'fandanGO-nmr-cerm',
    description: 'CERM Florence NMR plugin (peer reference)',
    urls: {
      https: 'https://github.com/FragmentScreen/fandanGO-nmr-cerm.git',
      ssh: 'git@github.com:FragmentScreen/fandanGO-nmr-cerm.git',
    },
  },
  {
    name: 'fandanGO-nmr-guf',
    description: 'GUF Frankfurt NMR plugin (peer reference)',
    urls: {
      https: 'https://github.com/FragmentScreen/fandanGO-nmr-guf.git',
      ssh: 'git@github.com:FragmentScreen/fandanGO-nmr-guf.git',
    },
  },
  {
    name: 'Samples',
    description: 'Sample metadata/datasets for community reference',
    urls: {
      https: 'https://github.com/FragmentScreen/Samples.git',
      ssh: 'git@github.com:FragmentScreen/Samples.git',
    },
  },
]

export const reposAndRefsConfig: ReposAndRefsConfig = {
  links: {
    docs: 'https://diamondlightsource.github.io/smartem-decisions/',
    projectBoard: 'https://github.com/orgs/DiamondLightSource/projects/33/views/1',
  },
  repositories: [
    {
      org: 'DiamondLightSource',
      orgUrl: 'https://github.com/DiamondLightSource',
      repos: diamondLightSourceRepos,
    },
    {
      org: 'FragmentScreen',
      orgUrl: 'https://github.com/FragmentScreen',
      repos: fragmentScreenRepos,
    },
  ],
}

export default reposAndRefsConfig
