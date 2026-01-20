export type SearchSourceType = 'docs' | 'issues' | 'prs' | 'commits'

export interface SearchResult {
  id: string
  title: string
  description?: string
  href: string
  source: SearchSourceType
  sourceLabel: string
  icon?: string
  metadata?: Record<string, unknown>
}

export interface SearchSource {
  type: SearchSourceType
  label: string
  enabled: boolean
}

export interface SearchState {
  query: string
  results: SearchResult[]
  isLoading: boolean
  error: string | null
  activeFilters: SearchSourceType[]
}

export interface SearchIndex {
  version: number
  generatedAt: string
  documentCount: number
  documents: SearchDocument[]
}

export interface SearchDocument {
  id: string
  title: string
  href: string
  section: string
  content: string
  excerpt: string
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string | null
  html_url: string
  state: 'open' | 'closed'
  pull_request?: { url: string }
  repository_url: string
  created_at: string
  updated_at: string
  user: {
    login: string
    avatar_url: string
  } | null
  labels: Array<{
    name: string
    color: string
  }>
}

export interface GitHubCommit {
  sha: string
  html_url: string
  commit: {
    message: string
    author: {
      name: string
      date: string
    } | null
  }
  repository?: {
    full_name: string
  }
}
