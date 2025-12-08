/**
 * Web UI configuration for SmartEM frontend.
 *
 * This file is intentionally minimal. Configuration is split across:
 * - github-tags-config.ts - GitHub tags and version tracking
 * - repos-and-refs.ts - Repository definitions and external links
 * - microscope-list.ts - CryoEM instrument definitions
 *
 * The prebuild script in webui/ aggregates these into webui-app-contents.ts
 */

export interface WebUiConfig {
  // Reserved for future app-level config
}

export const webUiConfig: WebUiConfig = {}

export default webUiConfig
