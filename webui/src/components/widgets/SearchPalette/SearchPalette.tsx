import { useNavigate } from '@tanstack/react-router'
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { webUiAppContents } from '~/config'
import { useSearch } from '~/hooks/useSearch'
import type { SearchResult, SearchSourceType } from '~/types/search'
import './SearchPalette.css'

const { searchConfig } = webUiAppContents

const GITHUB_SOURCES: SearchSourceType[] = ['issues', 'prs', 'commits']

type SortOrder = 'relevance' | 'date' | 'alphabetical'

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffMins = Math.ceil(diffMs / 60000)
  if (diffMins <= 0) return 'now'
  if (diffMins === 1) return 'in 1 minute'
  return `in ${diffMins} minutes`
}

const SOURCE_ICONS: Record<SearchSourceType, React.ReactNode> = {
  docs: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z" />
    </svg>
  ),
  issues: (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 7a1 1 0 011 1v3a1 1 0 11-2 0V8a1 1 0 011-1zm0 7a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
  prs: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
    </svg>
  ),
  commits: (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
    </svg>
  ),
}

const SOURCE_LABELS: Record<SearchSourceType, string> = {
  docs: 'Docs',
  issues: 'Issues',
  prs: 'PRs',
  commits: 'Commits',
}

const SOURCE_TOOLTIPS: Record<SearchSourceType, string> = {
  docs: 'Search documentation',
  issues: 'Search GitHub issues',
  prs: 'Search GitHub pull requests',
  commits: 'Search GitHub commits',
}

const GitHubMark = () => (
  <svg
    className="search-palette__github-mark"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
)

export interface SearchPaletteProps {
  isOpen?: boolean
  onClose?: () => void
  shortcutEnabled?: boolean
  shortcutKey?: string
  requireMeta?: boolean
  requireShift?: boolean
  maxHeight?: number
  githubToken?: string
}

export const SearchPalette: React.FC<SearchPaletteProps> = ({
  isOpen: controlledIsOpen,
  onClose,
  shortcutEnabled = true,
  shortcutKey = '/',
  requireMeta = false,
  requireShift = false,
  maxHeight = 480,
  githubToken,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [sortOrder, setSortOrder] = useState<SortOrder>('relevance')
  const [selectedRepos, setSelectedRepos] = useState<string[]>([])
  const navigate = useNavigate()

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const isOpen = controlledIsOpen ?? internalIsOpen

  const {
    query,
    setQuery,
    results,
    isLoading,
    groupedResults,
    activeFilters,
    toggleFilter,
    clearResults,
    githubRateLimited,
    rateLimitResetTime,
  } = useSearch({
    githubToken,
    enabledSources: ['docs', 'issues', 'prs', 'commits'],
  })

  const setIsOpen = useCallback(
    (open: boolean) => {
      if (controlledIsOpen === undefined) {
        setInternalIsOpen(open)
      }
      if (!open) {
        onClose?.()
        clearResults()
        setSelectedIndex(0)
      }
    },
    [controlledIsOpen, onClose, clearResults]
  )

  const availableRepos = useMemo(() => {
    return searchConfig.githubRepos.map((r) => `${r.owner}/${r.repo}`)
  }, [])

  const filteredAndSortedResults = useMemo(() => {
    let filtered = results

    if (selectedRepos.length > 0) {
      filtered = results.filter((r) => {
        if (r.source === 'docs') return true
        const repo = r.metadata?.repo as string | undefined
        return repo && selectedRepos.includes(repo)
      })
    }

    const sorted = [...filtered]
    switch (sortOrder) {
      case 'date':
        sorted.sort((a, b) => {
          const dateA = a.metadata?.date as string | undefined
          const dateB = b.metadata?.date as string | undefined
          if (!dateA && !dateB) return 0
          if (!dateA) return 1
          if (!dateB) return -1
          return new Date(dateB).getTime() - new Date(dateA).getTime()
        })
        break
      case 'alphabetical':
        sorted.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'relevance':
      default:
        break
    }
    return sorted
  }, [results, sortOrder, selectedRepos])

  const flatResults = filteredAndSortedResults

  const sortedGroupedResults = useMemo(() => {
    const groups: Record<SearchSourceType, SearchResult[]> = {
      docs: [],
      issues: [],
      prs: [],
      commits: [],
    }
    for (const result of filteredAndSortedResults) {
      groups[result.source].push(result)
    }
    return groups
  }, [filteredAndSortedResults])

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (result.source === 'docs') {
        navigate({ to: result.href })
      } else {
        window.open(result.href, '_blank', 'noopener,noreferrer')
      }
      setIsOpen(false)
    },
    [navigate, setIsOpen]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        setIsOpen(false)
        return
      }

      if (!shortcutEnabled) return

      const metaPressed = e.metaKey || e.ctrlKey
      if (e.key === shortcutKey && (!requireMeta || metaPressed) && (!requireShift || e.shiftKey)) {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setIsOpen, shortcutEnabled, shortcutKey, requireMeta, requireShift])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = flatResults.length

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (totalItems > 0) {
          setSelectedIndex((i) => (i + 1) % totalItems)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (totalItems > 0) {
          setSelectedIndex((i) => (i - 1 + totalItems) % totalItems)
        }
        break
      case 'Enter':
        e.preventDefault()
        if (flatResults[selectedIndex]) {
          handleSelect(flatResults[selectedIndex])
        }
        break
      case 'Tab':
        e.preventDefault()
        if (e.shiftKey) {
          setSelectedIndex((i) => (i - 1 + totalItems) % totalItems)
        } else {
          setSelectedIndex((i) => (i + 1) % totalItems)
        }
        break
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional - scroll when selection changes
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector('[data-selected="true"]')
    selectedElement?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional - reset selection when query/filters change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query, activeFilters])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
    }
  }

  if (!isOpen) return null

  const orderedSources: SearchSourceType[] = ['docs', 'issues', 'prs', 'commits']
  let globalIndex = -1

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-close is standard modal UX
    <div
      className="search-palette-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
      role="presentation"
    >
      <div className="search-palette" role="dialog" aria-modal="true" aria-label="Search">
        <div className="search-palette__header">
          <svg
            className="search-palette__search-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-palette__input"
            placeholder={searchConfig.placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            aria-label="Search"
            aria-autocomplete="list"
            aria-controls={listId}
          />
          {isLoading && <div className="search-palette__spinner" />}
          <kbd className="search-palette__shortcut">ESC</kbd>
        </div>

        <div className="search-palette__filters">
          {orderedSources.map((source, index) => {
            const isGitHubSource = GITHUB_SOURCES.includes(source)
            const isDisabled = isGitHubSource && githubRateLimited
            const isFirstGitHubSource =
              isGitHubSource && !GITHUB_SOURCES.includes(orderedSources[index - 1])
            const showDivider = searchConfig.githubChipDisplay === 'divider' && isFirstGitHubSource
            const showLabel = searchConfig.githubChipDisplay === 'label' && isFirstGitHubSource
            const showGitHubIcon = searchConfig.githubChipDisplay === 'icon' && isGitHubSource

            return (
              <React.Fragment key={source}>
                {showDivider && <span className="search-palette__filter-divider" />}
                {showLabel && <span className="search-palette__filter-label">GitHub</span>}
                <button
                  type="button"
                  className={`search-palette__filter ${activeFilters.includes(source) ? 'search-palette__filter--active' : ''} ${isDisabled ? 'search-palette__filter--disabled' : ''}`}
                  onClick={() => toggleFilter(source)}
                  disabled={isDisabled}
                  title={SOURCE_TOOLTIPS[source]}
                >
                  {showGitHubIcon && <GitHubMark />}
                  <span className="search-palette__filter-icon">{SOURCE_ICONS[source]}</span>
                  {SOURCE_LABELS[source]}
                  {groupedResults[source].length > 0 && (
                    <span className="search-palette__filter-count">
                      {groupedResults[source].length}
                    </span>
                  )}
                </button>
              </React.Fragment>
            )
          })}
        </div>

        <div className="search-palette__controls">
          <div className="search-palette__control-group">
            <label className="search-palette__control-label" htmlFor="sort-select">
              Sort
            </label>
            <select
              id="sort-select"
              className="search-palette__select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
              <option value="alphabetical">A-Z</option>
            </select>
          </div>
          <div className="search-palette__control-group">
            <label className="search-palette__control-label" htmlFor="repo-select">
              Repos
            </label>
            <select
              id="repo-select"
              className="search-palette__select"
              value={selectedRepos.length === 0 ? '' : selectedRepos[0]}
              onChange={(e) => {
                const value = e.target.value
                setSelectedRepos(value ? [value] : [])
              }}
            >
              <option value="">All repos</option>
              {availableRepos.map((repo) => (
                <option key={repo} value={repo}>
                  {repo.split('/')[1]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {githubRateLimited && (
          <div className="search-palette__rate-limit-banner">
            <span>{searchConfig.rateLimitMessage}</span>
            {rateLimitResetTime && (
              <span className="search-palette__rate-limit-reset">
                Resets {formatRelativeTime(rateLimitResetTime)}
              </span>
            )}
          </div>
        )}

        <div
          ref={listRef}
          id={listId}
          className="search-palette__list"
          style={{ maxHeight }}
          role="listbox"
        >
          {!query.trim() ? (
            <div className="search-palette__empty">{searchConfig.emptyStateHint}</div>
          ) : flatResults.length === 0 && !isLoading ? (
            <div className="search-palette__empty">
              {searchConfig.noResultsText} for "{query}"
            </div>
          ) : (
            orderedSources
              .filter(
                (source) =>
                  activeFilters.includes(source) && sortedGroupedResults[source].length > 0
              )
              .map((source) => (
                <div key={source} className="search-palette__group">
                  <div className="search-palette__group-label">
                    <span className="search-palette__group-icon">{SOURCE_ICONS[source]}</span>
                    {SOURCE_LABELS[source]}
                  </div>
                  {sortedGroupedResults[source].map((result) => {
                    globalIndex++
                    const isSelected = globalIndex === selectedIndex
                    const currentIndex = globalIndex
                    const isExternal = result.source !== 'docs'

                    return (
                      <a
                        key={result.id}
                        href={result.href}
                        target={isExternal ? '_blank' : undefined}
                        rel={isExternal ? 'noopener noreferrer' : undefined}
                        className={`search-palette__item ${isSelected ? 'search-palette__item--selected' : ''}`}
                        data-selected={isSelected}
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={isSelected ? 0 : -1}
                        onClick={(e) => {
                          if (!isExternal) {
                            e.preventDefault()
                            navigate({ to: result.href })
                          }
                          setIsOpen(false)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            if (!isExternal) {
                              e.preventDefault()
                              navigate({ to: result.href })
                            }
                            setIsOpen(false)
                          }
                        }}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                      >
                        <div className="search-palette__item-content">
                          <span className="search-palette__item-title">{result.title}</span>
                          {result.description && (
                            <span className="search-palette__item-description">
                              {result.description}
                            </span>
                          )}
                        </div>
                        <span className="search-palette__item-source">{result.sourceLabel}</span>
                        {isExternal && (
                          <svg
                            className="search-palette__external-icon"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
                        )}
                      </a>
                    )
                  })}
                </div>
              ))
          )}
        </div>

        <div className="search-palette__footer">
          <span className="search-palette__hint">
            <kbd className="search-palette__kbd">↑</kbd>
            <kbd className="search-palette__kbd">↓</kbd>
            navigate
          </span>
          <span className="search-palette__hint">
            <kbd className="search-palette__kbd">↵</kbd>
            select
          </span>
          <span className="search-palette__hint">
            <kbd className="search-palette__kbd">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  )
}
