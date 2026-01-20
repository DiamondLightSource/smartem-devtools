import { useNavigate } from '@tanstack/react-router'
import type React from 'react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useSearch } from '~/hooks/useSearch'
import type { SearchResult, SearchSourceType } from '~/types/search'
import './SearchPalette.css'

const SOURCE_ICONS: Record<SearchSourceType, React.ReactNode> = {
  docs: (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" />
      <path d="M8 7h4M8 10h4M8 13h2" stroke="currentColor" strokeWidth="1.5" fill="none" />
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
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  ),
  commits: (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
        clipRule="evenodd"
      />
      <circle cx="10" cy="10" r="3" fill="currentColor" />
    </svg>
  ),
}

const SOURCE_LABELS: Record<SearchSourceType, string> = {
  docs: 'Docs',
  issues: 'Issues',
  prs: 'PRs',
  commits: 'Commits',
}

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

  const flatResults = results

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
            placeholder="Search docs, issues, PRs, commits..."
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
          {orderedSources.map((source) => (
            <button
              key={source}
              type="button"
              className={`search-palette__filter ${activeFilters.includes(source) ? 'search-palette__filter--active' : ''}`}
              onClick={() => toggleFilter(source)}
            >
              <span className="search-palette__filter-icon">{SOURCE_ICONS[source]}</span>
              {SOURCE_LABELS[source]}
              {groupedResults[source].length > 0 && (
                <span className="search-palette__filter-count">
                  {groupedResults[source].length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div
          ref={listRef}
          id={listId}
          className="search-palette__list"
          style={{ maxHeight }}
          role="listbox"
        >
          {!query.trim() ? (
            <div className="search-palette__empty">Type to search documentation and GitHub</div>
          ) : flatResults.length === 0 && !isLoading ? (
            <div className="search-palette__empty">No results found for "{query}"</div>
          ) : (
            orderedSources
              .filter(
                (source) => activeFilters.includes(source) && groupedResults[source].length > 0
              )
              .map((source) => (
                <div key={source} className="search-palette__group">
                  <div className="search-palette__group-label">
                    <span className="search-palette__group-icon">{SOURCE_ICONS[source]}</span>
                    {SOURCE_LABELS[source]}
                  </div>
                  {groupedResults[source].map((result) => {
                    globalIndex++
                    const isSelected = globalIndex === selectedIndex
                    const currentIndex = globalIndex

                    return (
                      <div
                        key={result.id}
                        className={`search-palette__item ${isSelected ? 'search-palette__item--selected' : ''}`}
                        data-selected={isSelected}
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={isSelected ? 0 : -1}
                        onClick={() => handleSelect(result)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleSelect(result)
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
                        {result.source !== 'docs' && (
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
                      </div>
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
