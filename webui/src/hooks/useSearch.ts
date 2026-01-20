import MiniSearch from 'minisearch'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { webUiAppContents } from '~/config'
import type {
  GitHubCommit,
  GitHubIssue,
  SearchDocument,
  SearchIndex,
  SearchResult,
  SearchSourceType,
} from '~/types/search'

const { searchConfig } = webUiAppContents

let miniSearchInstance: MiniSearch<SearchDocument> | null = null
let searchIndexPromise: Promise<SearchIndex> | null = null

async function loadSearchIndex(): Promise<SearchIndex> {
  if (searchIndexPromise) return searchIndexPromise

  searchIndexPromise = fetch('/search-index.json')
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load search index: ${res.status}`)
      return res.json()
    })
    .catch((err) => {
      searchIndexPromise = null
      throw err
    })

  return searchIndexPromise
}

async function getMiniSearch(): Promise<MiniSearch<SearchDocument>> {
  if (miniSearchInstance) return miniSearchInstance

  const index = await loadSearchIndex()

  miniSearchInstance = new MiniSearch<SearchDocument>({
    fields: ['title', 'content', 'section'],
    storeFields: ['title', 'href', 'section', 'excerpt'],
    searchOptions: {
      boost: { title: 3, section: 1.5, content: 1 },
      fuzzy: 0.2,
      prefix: true,
    },
  })

  miniSearchInstance.addAll(index.documents)
  return miniSearchInstance
}

async function searchDocs(query: string, limit: number): Promise<SearchResult[]> {
  if (!query.trim()) return []

  try {
    const miniSearch = await getMiniSearch()
    const results = miniSearch.search(query).slice(0, limit)

    return results.map((result) => ({
      id: `doc-${result.id}`,
      title: result.title as string,
      description: result.excerpt as string,
      href: result.href as string,
      source: 'docs' as const,
      sourceLabel: result.section as string,
      metadata: { score: result.score },
    }))
  } catch (err) {
    console.error('Docs search failed:', err)
    return []
  }
}

async function searchGitHubIssues(
  query: string,
  limit: number,
  type: 'issue' | 'pr',
  token?: string
): Promise<SearchResult[]> {
  if (!query.trim() || !searchConfig.enableGithubSearch) return []

  const repos = searchConfig.githubRepos.map((r) => `repo:${r.owner}/${r.repo}`).join(' ')
  const typeFilter = type === 'pr' ? 'is:pr' : 'is:issue'
  const searchQuery = encodeURIComponent(`${query} ${repos} ${typeFilter}`)

  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const res = await fetch(
      `https://api.github.com/search/issues?q=${searchQuery}&per_page=${limit}`,
      {
        headers,
      }
    )

    if (!res.ok) {
      if (res.status === 403) {
        console.warn('GitHub API rate limit exceeded')
        return []
      }
      throw new Error(`GitHub API error: ${res.status}`)
    }

    const data = await res.json()
    const items = data.items as GitHubIssue[]

    return items.map((item) => {
      const repoName = item.repository_url.split('/').slice(-2).join('/')
      return {
        id: `${type}-${item.id}`,
        title: item.title,
        description: `#${item.number} in ${repoName}`,
        href: item.html_url,
        source: type === 'pr' ? ('prs' as const) : ('issues' as const),
        sourceLabel: repoName,
        metadata: {
          number: item.number,
          state: item.state,
          author: item.user?.login,
          labels: item.labels,
        },
      }
    })
  } catch (err) {
    console.error(`GitHub ${type} search failed:`, err)
    return []
  }
}

async function searchGitHubCommits(
  query: string,
  limit: number,
  token?: string
): Promise<SearchResult[]> {
  if (!query.trim() || !searchConfig.enableGithubSearch) return []

  const repos = searchConfig.githubRepos.map((r) => `repo:${r.owner}/${r.repo}`).join(' ')
  const searchQuery = encodeURIComponent(`${query} ${repos}`)

  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const res = await fetch(
      `https://api.github.com/search/commits?q=${searchQuery}&per_page=${limit}`,
      {
        headers,
      }
    )

    if (!res.ok) {
      if (res.status === 403) {
        console.warn('GitHub API rate limit exceeded')
        return []
      }
      throw new Error(`GitHub API error: ${res.status}`)
    }

    const data = await res.json()
    const items = data.items as GitHubCommit[]

    return items.map((item) => {
      const shortSha = item.sha.slice(0, 7)
      const message = item.commit.message.split('\n')[0]
      const repoName = item.repository?.full_name || 'unknown'

      return {
        id: `commit-${item.sha}`,
        title: message,
        description: `${shortSha} in ${repoName}`,
        href: item.html_url,
        source: 'commits' as const,
        sourceLabel: repoName,
        metadata: {
          sha: item.sha,
          author: item.commit.author?.name,
          date: item.commit.author?.date,
        },
      }
    })
  } catch (err) {
    console.error('GitHub commits search failed:', err)
    return []
  }
}

export interface UseSearchOptions {
  githubToken?: string
  enabledSources?: SearchSourceType[]
}

export interface UseSearchReturn {
  query: string
  setQuery: (query: string) => void
  results: SearchResult[]
  isLoading: boolean
  error: string | null
  activeFilters: SearchSourceType[]
  toggleFilter: (source: SearchSourceType) => void
  groupedResults: Record<SearchSourceType, SearchResult[]>
  clearResults: () => void
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { githubToken, enabledSources = ['docs', 'issues', 'prs', 'commits'] } = options

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<SearchSourceType[]>(enabledSources)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([])
        setIsLoading(false)
        return
      }

      abortRef.current?.abort()
      abortRef.current = new AbortController()

      setIsLoading(true)
      setError(null)

      const limit = searchConfig.resultsPerSource
      const searches: Promise<SearchResult[]>[] = []

      if (activeFilters.includes('docs')) {
        searches.push(searchDocs(searchQuery, limit))
      }

      if (activeFilters.includes('issues')) {
        searches.push(searchGitHubIssues(searchQuery, limit, 'issue', githubToken))
      }

      if (activeFilters.includes('prs')) {
        searches.push(searchGitHubIssues(searchQuery, limit, 'pr', githubToken))
      }

      if (activeFilters.includes('commits')) {
        searches.push(searchGitHubCommits(searchQuery, limit, githubToken))
      }

      try {
        const searchResults = await Promise.all(searches)
        const flatResults = searchResults.flat()

        if (!abortRef.current?.signal.aborted) {
          setResults(flatResults)
        }
      } catch (err) {
        if (!abortRef.current?.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Search failed')
        }
      } finally {
        if (!abortRef.current?.signal.aborted) {
          setIsLoading(false)
        }
      }
    },
    [activeFilters, githubToken]
  )

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!query.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    debounceRef.current = setTimeout(() => {
      performSearch(query)
    }, searchConfig.debounceMs)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, performSearch])

  const toggleFilter = useCallback((source: SearchSourceType) => {
    setActiveFilters((prev) => {
      if (prev.includes(source)) {
        return prev.filter((s) => s !== source)
      }
      return [...prev, source]
    })
  }, [])

  const groupedResults = useMemo(() => {
    const groups: Record<SearchSourceType, SearchResult[]> = {
      docs: [],
      issues: [],
      prs: [],
      commits: [],
    }

    for (const result of results) {
      groups[result.source].push(result)
    }

    return groups
  }, [results])

  const clearResults = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
  }, [])

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    activeFilters,
    toggleFilter,
    groupedResults,
    clearResults,
  }
}
