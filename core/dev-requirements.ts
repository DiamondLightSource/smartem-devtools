/**
 * Developer requirements for SmartEM workspace local environment setup.
 *
 * Source of truth: dev-requirements.json
 * This file re-exports the JSON data with TypeScript types for type safety.
 */

import devRequirementsConfig from './dev-requirements.json'

export interface ToolRequirement {
  name: string
  command: string
  versionArgs: string[]
  required: boolean
  minVersion?: string
  alternatives?: string[]
  description: string
}

export interface NetworkCheck {
  checkUrl: string
  timeout: number
  required: boolean
  description: string
}

export interface DevRequirementsConfig {
  version: string
  description: string
  tools: ToolRequirement[]
  network: NetworkCheck
}

export const devRequirements: DevRequirementsConfig = devRequirementsConfig

export default devRequirements
