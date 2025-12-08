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

const gitlabAriaPHPRepos: Repository[] = [
  {
    name: 'data-deposition-api',
    description: 'ARIA GraphQL/REST API for metadata deposition (primary)',
    urls: {
      https: 'https://gitlab.com/aria-php/data-deposition-api.git',
      ssh: 'git@gitlab.com:aria-php/data-deposition-api.git',
    },
  },
  {
    name: 'aria-graphql-client',
    description: 'PHP library for communicating with ARIA GraphQL API',
    urls: {
      https: 'https://gitlab.com/aria-php/aria-graphql-client.git',
      ssh: 'git@gitlab.com:aria-php/aria-graphql-client.git',
    },
  },
  {
    name: 'aria-elasticsearch-client',
    description: 'Elasticsearch client for ARIA search records',
    urls: {
      https: 'https://gitlab.com/aria-php/aria-elasticsearch-client.git',
      ssh: 'git@gitlab.com:aria-php/aria-elasticsearch-client.git',
    },
  },
  {
    name: 'aria-rest',
    description: 'REST API framework for defining versioned APIs',
    urls: {
      https: 'https://gitlab.com/aria-php/aria-rest.git',
      ssh: 'git@gitlab.com:aria-php/aria-rest.git',
    },
  },
  {
    name: 'aria-storage-interface',
    description: 'Storage provider interface',
    urls: {
      https: 'https://gitlab.com/aria-php/aria-storage-interface.git',
      ssh: 'git@gitlab.com:aria-php/aria-storage-interface.git',
    },
  },
  {
    name: 'aria-webhooks',
    description: 'Standard webhook payload format for ARIA platform',
    urls: {
      https: 'https://gitlab.com/aria-php/aria-webhooks.git',
      ssh: 'git@gitlab.com:aria-php/aria-webhooks.git',
    },
  },
  {
    name: 'aria-incoming-email',
    description: 'Incoming email message routing',
    urls: {
      https: 'https://gitlab.com/aria-php/aria-incoming-email.git',
      ssh: 'git@gitlab.com:aria-php/aria-incoming-email.git',
    },
  },
  {
    name: 'aria-mailer',
    description: 'Email wrapper (PHPMailer + Swiftmailer)',
    urls: {
      https: 'https://gitlab.com/aria-php/aria-mailer.git',
      ssh: 'git@gitlab.com:aria-php/aria-mailer.git',
    },
  },
  {
    name: 'aria-mailgun-webhooks',
    description: 'Mailgun webhook event parser',
    urls: {
      https: 'https://gitlab.com/aria-php/aria-mailgun-webhooks.git',
      ssh: 'git@gitlab.com:aria-php/aria-mailgun-webhooks.git',
    },
  },
  {
    name: 'aria-invite-users',
    description: 'User invitation framework',
    urls: {
      https: 'https://gitlab.com/aria-php/aria-invite-users.git',
      ssh: 'git@gitlab.com:aria-php/aria-invite-users.git',
    },
  },
  {
    name: 'aria-data-subscription',
    description: 'Data source subscription framework for feeds',
    urls: {
      https: 'https://gitlab.com/aria-php/aria-data-subscription.git',
      ssh: 'git@gitlab.com:aria-php/aria-data-subscription.git',
    },
  },
  {
    name: 'aria-stats',
    description: 'Performance statistics monitoring',
    urls: {
      https: 'https://gitlab.com/aria-php/aria-stats.git',
      ssh: 'git@gitlab.com:aria-php/aria-stats.git',
    },
  },
  {
    name: 'aria-site-logger',
    description: 'Monolog plugin for ARIA site logging',
    urls: {
      https: 'https://gitlab.com/aria-php/aria-site-logger.git',
      ssh: 'git@gitlab.com:aria-php/aria-site-logger.git',
    },
  },
  {
    name: 'aria-service-ai',
    description: 'Service AI library',
    urls: {
      https: 'https://gitlab.com/aria-php/aria-service-ai.git',
      ssh: 'git@gitlab.com:aria-php/aria-service-ai.git',
    },
  },
  {
    name: 'keycloak-api',
    description: 'PHP bindings for Keycloak Account API',
    urls: {
      https: 'https://gitlab.com/aria-php/keycloak-api.git',
      ssh: 'git@gitlab.com:aria-php/keycloak-api.git',
    },
  },
  {
    name: 'doi-package',
    description: 'DOI microservice client',
    urls: {
      https: 'https://gitlab.com/aria-php/doi-package.git',
      ssh: 'git@gitlab.com:aria-php/doi-package.git',
    },
  },
  {
    name: 'molgenis-php-client',
    description: 'PHP client for Molgenis database',
    urls: {
      https: 'https://gitlab.com/aria-php/molgenis-php-client.git',
      ssh: 'git@gitlab.com:aria-php/molgenis-php-client.git',
    },
  },
  {
    name: 'shibboleth-idp-dockerized',
    description: 'Dockerized Shibboleth IdP (identity federation)',
    urls: {
      https: 'https://gitlab.com/aria-php/shibboleth-idp-dockerized.git',
      ssh: 'git@gitlab.com:aria-php/shibboleth-idp-dockerized.git',
    },
  },
  {
    name: 'rtd-compiler',
    description: 'ReadTheDocs compiler for ARIA documentation',
    urls: {
      https: 'https://gitlab.com/aria-php/rtd-compiler.git',
      ssh: 'git@gitlab.com:aria-php/rtd-compiler.git',
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
    projectBoard: 'https://github.com/orgs/DiamondLightSource/projects/51/views/1',
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
    {
      org: 'aria-php',
      orgUrl: 'https://gitlab.com/aria-php',
      repos: gitlabAriaPHPRepos,
    },
  ],
}

export default reposAndRefsConfig
