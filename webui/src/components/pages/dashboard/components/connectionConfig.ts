export interface Connection {
  id: string
  sourceId: string
  targetId: string
  sourceAnchor: 'left' | 'right' | 'top' | 'bottom'
  targetAnchor: 'left' | 'right' | 'top' | 'bottom'
  color: string
  tooltip: string
  curveOffset?: number // Custom offset for bezier control points (default: 40)
  sourceDotOffset?: number // Offset along the edge for source dot (positive = right/down)
  targetDotOffset?: number // Offset along the edge for target dot (positive = right/down)
  arrow?: 'source' | 'target' | 'both' | 'none' // Arrow direction (default: 'none')
}

// Color palette for connections
const colors = {
  green: '#4caf50', // Agent -> Backend API (data intake)
  red: '#f44336', // Agent <- Agent API (SSE recommendations)
  blue: '#2196f3', // C1: EPU -> fs (file writes)
  orange: '#ff9800', // C2: fs -> Agent (file watching)
  purple: '#9c27b0', // C3: Agent -> Athena API (microscope control)
  teal: '#009688', // C4: ARIA Connector flows
  pink: '#e91e63', // C5: Web UI -> Backend API
}

export const dashboardConnections: Connection[] = [
  // Agent to Backend APIs (Agent is in left column, APIs are in middle column)
  {
    id: 'agent-to-backend-api',
    sourceId: 'smartem-agent',
    targetId: 'smartem-backend-api',
    sourceAnchor: 'right',
    targetAnchor: 'left',
    color: colors.green,
    tooltip: 'Agent sends data to Backend API (HTTP/REST)',
    sourceDotOffset: -10, // Move dot up on right edge
    targetDotOffset: 0, // Center on left edge
    arrow: 'target', // Arrow pointing to Backend API
  },
  {
    id: 'agent-to-agent-api',
    sourceId: 'smartem-agent',
    targetId: 'smartem-agent-api',
    sourceAnchor: 'right',
    targetAnchor: 'left',
    color: colors.red,
    tooltip: 'Agent receives recommendations via SSE',
    sourceDotOffset: 10, // Move dot down on right edge
    arrow: 'source', // Arrow pointing to Agent (data flows from API to Agent)
  },
  // C1: EPU Desktop -> Filesystem (route via bottom for visibility)
  {
    id: 'epu-to-filesystem',
    sourceId: 'epu-desktop',
    targetId: 'epu-filesystem',
    sourceAnchor: 'bottom',
    targetAnchor: 'bottom',
    color: colors.blue,
    tooltip: 'EPU Desktop Software writes acquisition data to filesystem directory',
    targetDotOffset: -10, // Move dot left on bottom edge
    arrow: 'target', // Arrow pointing to filesystem
  },
  // C2: Filesystem -> SmartEM Agent (route via bottom for visibility)
  {
    id: 'filesystem-to-agent',
    sourceId: 'epu-filesystem',
    targetId: 'smartem-agent',
    sourceAnchor: 'bottom',
    targetAnchor: 'bottom',
    color: colors.orange,
    tooltip:
      'SmartEM Agent watches filesystem for changes and parses acquisition data, performing data intake',
    sourceDotOffset: 10, // Move dot right on bottom edge (next to blue)
    targetDotOffset: -15, // Move dot left on bottom edge
    arrow: 'target', // Arrow pointing to Agent
  },
  // C3: SmartEM Agent -> Athena API (route via bottom, below blue/orange)
  {
    id: 'agent-to-athena',
    sourceId: 'smartem-agent',
    targetId: 'athena-api',
    sourceAnchor: 'bottom',
    targetAnchor: 'bottom',
    color: colors.purple,
    tooltip: 'SmartEM Agent forwards recommendations and instructions to microscope via Athena API',
    curveOffset: 80,
    sourceDotOffset: 15, // Move dot right on bottom edge (next to orange)
    arrow: 'target', // Arrow pointing to Athena API
  },
  // C4: Backend API -> ARIA Connector (left to left, vertical alignment)
  {
    id: 'backend-to-aria-connector',
    sourceId: 'smartem-backend-api',
    targetId: 'aria-connector',
    sourceAnchor: 'left',
    targetAnchor: 'left',
    color: colors.teal,
    tooltip: 'ARIA connector consumes depositions from SmartEM Backend API',
    sourceDotOffset: -12, // Move dot up on left edge (top position)
    targetDotOffset: 0,
    arrow: 'target', // Arrow pointing to ARIA Connector
  },
  // C4: ARIA Connector -> GraphQL API
  {
    id: 'aria-connector-to-graphql',
    sourceId: 'aria-connector',
    targetId: 'aria-graphql-api',
    sourceAnchor: 'right',
    targetAnchor: 'left',
    color: colors.teal,
    tooltip: 'ARIA connector uploads depositions to ARIA registry',
    arrow: 'target', // Arrow pointing to GraphQL API
  },
  // C5: SmartEM Web UI <- Backend API (left to left, vertical alignment)
  {
    id: 'webui-to-backend-api',
    sourceId: 'smartem-webui',
    targetId: 'smartem-backend-api',
    sourceAnchor: 'left',
    targetAnchor: 'left',
    color: colors.pink,
    tooltip: 'SmartEM frontend runs off SmartEM Backend API',
    sourceDotOffset: 0,
    targetDotOffset: 12, // Move dot down on left edge (bottom position)
    curveOffset: 90, // More curvature for pink connection
    arrow: 'source', // Arrow pointing to Web UI (data flows from API to UI)
  },
]
