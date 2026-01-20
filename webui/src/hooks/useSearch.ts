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

interface GitHubSearchResponse {
  results: SearchResult[]
  rateLimited: boolean
  resetTime: Date | null
}

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
): Promise<GitHubSearchResponse> {
  if (!query.trim() || !searchConfig.enableGithubSearch) {
    return { results: [], rateLimited: false, resetTime: null }
  }

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
        const resetTimestamp = res.headers.get('X-RateLimit-Reset')
        const resetTime = resetTimestamp ? new Date(parseInt(resetTimestamp, 10) * 1000) : null
        return { results: [], rateLimited: true, resetTime }
      }
      throw new Error(`GitHub API error: ${res.status}`)
    }

    const data = await res.json()
    const items = data.items as GitHubIssue[]

    const results = items.map((item) => {
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
    return { results, rateLimited: false, resetTime: null }
  } catch (err) {
    console.error(`GitHub ${type} search failed:`, err)
    return { results: [], rateLimited: false, resetTime: null }
  }
}

async function searchGitHubCommits(
  query: string,
  limit: number,
  token?: string
): Promise<GitHubSearchResponse> {
  if (!query.trim() || !searchConfig.enableGithubSearch) {
    return { results: [], rateLimited: false, resetTime: null }
  }

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
        const resetTimestamp = res.headers.get('X-RateLimit-Reset')
        const resetTime = resetTimestamp ? new Date(parseInt(resetTimestamp, 10) * 1000) : null
        return { results: [], rateLimited: true, resetTime }
      }
      throw new Error(`GitHub API error: ${res.status}`)
    }

    const data = await res.json()
    const items = data.items as GitHubCommit[]

    const results = items.map((item) => {
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
    return { results, rateLimited: false, resetTime: null }
  } catch (err) {
    console.error('GitHub commits search failed:', err)
    return { results: [], rateLimited: false, resetTime: null }
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
  githubRateLimited: boolean
  rateLimitResetTime: Date | null
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { githubToken, enabledSources = ['docs', 'issues', 'prs', 'commits'] } = options

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<SearchSourceType[]>(enabledSources)
  const [githubRateLimited, setGithubRateLimited] = useState(false)
  const [rateLimitResetTime, setRateLimitResetTime] = useState<Date | null>(null)

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
      const docsSearches: Promise<SearchResult[]>[] = []
      const githubSearches: Promise<GitHubSearchResponse>[] = []

      if (activeFilters.includes('docs')) {
        docsSearches.push(searchDocs(searchQuery, limit))
      }

      if (activeFilters.includes('issues')) {
        githubSearches.push(searchGitHubIssues(searchQuery, limit, 'issue', githubToken))
      }

      if (activeFilters.includes('prs')) {
        githubSearches.push(searchGitHubIssues(searchQuery, limit, 'pr', githubToken))
      }

      if (activeFilters.includes('commits')) {
        githubSearches.push(searchGitHubCommits(searchQuery, limit, githubToken))
      }

      try {
        const [docsResults, githubResults] = await Promise.all([
          Promise.all(docsSearches),
          Promise.all(githubSearches),
        ])

        if (!abortRef.current?.signal.aborted) {
          const flatDocsResults = docsResults.flat()
          const flatGitHubResults = githubResults.flatMap((r) => r.results)
          setResults([...flatDocsResults, ...flatGitHubResults])

          const anyRateLimited = githubResults.some((r) => r.rateLimited)
          const latestResetTime =
            githubResults
              .map((r) => r.resetTime)
              .filter((t): t is Date => t !== null)
              .sort((a, b) => b.getTime() - a.getTime())[0] ?? null

          if (anyRateLimited) {
            setGithubRateLimited(true)
            setRateLimitResetTime(latestResetTime)
          } else if (githubResults.length > 0) {
            setGithubRateLimited(false)
            setRateLimitResetTime(null)
          }
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
    githubRateLimited,
    rateLimitResetTime,
  }
}
