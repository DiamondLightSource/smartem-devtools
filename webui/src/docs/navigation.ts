export interface NavItem {
  title: string
  href: string
  children?: NavItem[]
}

export const docsNavigation: NavItem[] = [
  {
    title: 'Getting Started',
    href: '/docs',
    children: [
      { title: 'Overview', href: '/docs' },
      { title: 'Installation', href: '/docs/tutorials/installation' },
      { title: 'Terms & Definitions', href: '/docs/terms-and-defs' },
    ],
  },
  {
    title: 'How-To Guides',
    href: '/docs/how-to',
    children: [
      { title: 'Run Backend', href: '/docs/how-to/run-backend' },
      { title: 'Run Agent', href: '/docs/how-to/run-agent' },
      { title: 'Run Container', href: '/docs/how-to/run-container' },
      { title: 'Run E2E Dev Simulation', href: '/docs/how-to/run-e2e-dev-simulation' },
      { title: 'Containerization', href: '/docs/how-to/containerization' },
      { title: 'Deploy Kubernetes', href: '/docs/how-to/deploy-kubernetes' },
      { title: 'Manage K8s Secrets', href: '/docs/how-to/manage-kubernetes-secrets' },
      { title: 'Database Migrations', href: '/docs/how-to/database-migrations' },
      { title: 'Configure Logging', href: '/docs/how-to/configure-logging' },
      { title: 'Configure Env Vars', href: '/docs/how-to/configure-environment-variables' },
      { title: 'Container User Config', href: '/docs/how-to/container-user-configuration' },
      { title: 'Use HTTP API Client', href: '/docs/how-to/use-core-http-api-client' },
      { title: 'Use MCP Interface', href: '/docs/how-to/use-mcp-interface' },
      { title: 'Use API Documentation', href: '/docs/how-to/use-api-documentation' },
      { title: 'Generate Docs', href: '/docs/how-to/generate-docs' },
      { title: 'Sync GitHub Labels', href: '/docs/how-to/sync-github-labels' },
      { title: 'Contribute', href: '/docs/how-to/contribute' },
      { title: 'Development Tools', href: '/docs/how-to/development-tools' },
      { title: 'Troubleshoot CLI', href: '/docs/how-to/troubleshoot-cli' },
    ],
  },
  {
    title: 'Explanations',
    href: '/docs/explanations',
    children: [
      { title: 'SmartEM Agent Design', href: '/docs/explanations/smartem-agent-design' },
      {
        title: 'Backend-Agent Communication',
        href: '/docs/explanations/backend-agent-communication-system-design',
      },
      { title: 'EPU Data Structures', href: '/docs/explanations/epu-data-structures' },
      { title: 'Technical Notes', href: '/docs/explanations/technical-notes' },
      {
        title: 'Architecture Decisions',
        href: '/docs/explanations/decisions',
        children: [
          {
            title: 'ADR-0001: Record Decisions',
            href: '/docs/explanations/decisions/0001-record-architecture-decisions',
          },
          {
            title: 'ADR-0002: Copier Template',
            href: '/docs/explanations/decisions/0002-switched-to-python-copier-template',
          },
          {
            title: 'ADR-0003: Message Grouping',
            href: '/docs/explanations/decisions/0003-message-queue-message-grouping',
          },
          {
            title: 'ADR-0004: Zocalo-Free',
            href: '/docs/explanations/decisions/0004-zocalo-dependency-free',
          },
          {
            title: 'ADR-0005: Secret Scanning',
            href: '/docs/explanations/decisions/0005-detect-secrets-for-secret-scanning',
          },
          {
            title: 'ADR-0006: Sealed Secrets',
            href: '/docs/explanations/decisions/0006-sealed-secrets-kubernetes-secrets-management',
          },
          {
            title: 'ADR-0007: Circular Deps',
            href: '/docs/explanations/decisions/0007-eliminate-smartem-api-circular-dependency',
          },
          {
            title: 'ADR-0008: Agent Comms',
            href: '/docs/explanations/decisions/0008-backend-to-agent-communication-architecture',
          },
          {
            title: 'ADR-0009: Route Tree',
            href: '/docs/explanations/decisions/0009-commit-generated-route-tree',
          },
          {
            title: 'ADR-0010: Shiki Highlighting',
            href: '/docs/explanations/decisions/0010-shiki-syntax-highlighting',
          },
        ],
      },
    ],
  },
  {
    title: 'Reference',
    href: '/docs/reference',
    children: [
      { title: 'CLI Reference', href: '/docs/reference/cli-reference' },
      { title: 'API Documentation', href: '/api/' },
    ],
  },
]
