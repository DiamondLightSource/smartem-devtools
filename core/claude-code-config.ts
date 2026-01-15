/**
 * Claude Code integration configuration for SmartEM workspace.
 *
 * Source of truth: claude-code-config.json
 * This file re-exports the JSON data with TypeScript types for type safety.
 */

import claudeCodeConfig from './claude-code-config.json'

export interface SkillDefinition {
  name: string
  path: string
}

export interface DefaultPermissions {
  allow: string[]
}

export interface ClaudeConfig {
  skills: SkillDefinition[]
  defaultPermissions: DefaultPermissions
}

export interface SerenaConfig {
  languages: string[]
  encoding: string
  ignoreAllFilesInGitignore: boolean
  projectName: string
}

export interface McpServerConfig {
  command: string
  args: string[]
}

export interface McpConfig {
  serena: McpServerConfig
}

export interface ClaudeCodeConfigFile {
  version: string
  description: string
  claudeConfig: ClaudeConfig
  serenaConfig: SerenaConfig
  mcpConfig: McpConfig
}

export const claudeCodeConfigData: ClaudeCodeConfigFile = claudeCodeConfig

export default claudeCodeConfigData
