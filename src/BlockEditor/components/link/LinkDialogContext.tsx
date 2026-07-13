import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type {
  LinkablePage,
  SearchPagesOptions,
  SearchPagesResult,
} from '../../types'
import { useEditorRuntime } from '../../context'
import { Modal } from '../ui/Modal'

interface LinkDialogRequest {
  initialHref?: string
  title?: string
}

interface LinkDialogContextValue {
  openLinkDialog: (request?: LinkDialogRequest) => Promise<string | null>
}

const LinkDialogContext = createContext<LinkDialogContextValue | null>(null)

const SEARCH_DEBOUNCE_MS = 180
const SEARCH_PAGE_SIZE = 20

interface NormalizedSearchResult {
  pages: LinkablePage[]
  nextPage: number | null
}

function normalizePages(input: LinkablePage[]): LinkablePage[] {
  const dedupe = new Set<string>()
  const pages: LinkablePage[] = []

  for (const candidate of input) {
    const title = typeof candidate.title === 'string' ? candidate.title.trim() : ''
    const url = typeof candidate.url === 'string' ? candidate.url.trim() : ''
    if (!title || !url) continue
    const dedupeKey = `${title.toLowerCase()}|${url}`
    if (dedupe.has(dedupeKey)) continue
    dedupe.add(dedupeKey)
    pages.push({
      id: candidate.id,
      title,
      url,
      type: candidate.type,
    })
  }

  return pages
}

function normalizeSearchResult(
  result: SearchPagesResult,
  requestedPage: number,
  perPage: number
): NormalizedSearchResult {
  if (Array.isArray(result)) {
    return {
      pages: normalizePages(result),
      nextPage: result.length === perPage ? requestedPage + 1 : null,
    }
  }

  const pages = normalizePages(Array.isArray(result.pages) ? result.pages : [])
  const nextPage =
    typeof result.nextPage === 'number' && Number.isFinite(result.nextPage) && result.nextPage > requestedPage
      ? Math.floor(result.nextPage)
      : null

  return { pages, nextPage }
}

export function LinkDialogProvider({ children }: { children: React.ReactNode }) {
  const { onSearchPages } = useEditorRuntime()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('Add link')
  const [urlValue, setUrlValue] = useState('')
  const [pageQuery, setPageQuery] = useState('')
  const [pageResults, setPageResults] = useState<LinkablePage[]>([])
  const [nextPage, setNextPage] = useState<number | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const resolverRef = useRef<((value: string | null) => void) | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)
  const searchRequestRef = useRef(0)

  const resolveAndClose = useCallback((value: string | null) => {
    if (resolverRef.current) {
      resolverRef.current(value)
      resolverRef.current = null
    }
    searchAbortRef.current?.abort()
    searchAbortRef.current = null
    setOpen(false)
    setPageQuery('')
    setPageResults([])
    setNextPage(null)
    setIsSearching(false)
    setIsLoadingMore(false)
    setSearchError(null)
  }, [])

  const runPageSearch = useCallback(async (
    options: {
      query: string
      page: number
      append: boolean
    }
  ) => {
    if (!onSearchPages) return
    searchAbortRef.current?.abort()
    const controller = new AbortController()
    searchAbortRef.current = controller
    const requestId = searchRequestRef.current + 1
    searchRequestRef.current = requestId
    if (options.append) {
      setIsLoadingMore(true)
    } else {
      setIsSearching(true)
    }
    setSearchError(null)

    const searchOptions: SearchPagesOptions = {
      query: options.query,
      page: options.page,
      perPage: SEARCH_PAGE_SIZE,
      signal: controller.signal,
    }

    try {
      const result = await onSearchPages(searchOptions)
      if (searchRequestRef.current !== requestId) return

      const normalized = normalizeSearchResult(
        result,
        options.page,
        SEARCH_PAGE_SIZE
      )
      setPageResults((prev) => {
        if (!options.append) return normalized.pages
        const merged = [...prev, ...normalized.pages]
        return normalizePages(merged)
      })
      setNextPage(normalized.nextPage)
    } catch (error) {
      if (searchRequestRef.current !== requestId) return
      if (controller.signal.aborted) return
      setSearchError('Could not load pages from the host site.')
      if (!options.append) {
        setPageResults([])
      }
      setNextPage(null)
      if (import.meta.env.DEV) {
        console.error('[LinkDialog] onSearchPages failed', error)
      }
    } finally {
      if (searchRequestRef.current === requestId) {
        if (options.append) {
          setIsLoadingMore(false)
        } else {
          setIsSearching(false)
        }
      }
    }
  }, [onSearchPages])

  useEffect(() => {
    if (!open || !onSearchPages) return
    const query = pageQuery.trim()
    const timer = window.setTimeout(() => {
      void runPageSearch({ query, page: 1, append: false })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [open, onSearchPages, pageQuery, runPageSearch])

  useEffect(() => {
    if (!open) return
    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (resolverRef.current) {
        resolverRef.current(null)
        resolverRef.current = null
      }
      searchAbortRef.current?.abort()
      searchAbortRef.current = null
    }
  }, [])

  const openLinkDialog = useCallback((request: LinkDialogRequest = {}) => {
    if (resolverRef.current) {
      resolverRef.current(null)
      resolverRef.current = null
    }

    setTitle(request.title?.trim() || 'Add link')
    setUrlValue(request.initialHref ?? '')
    setPageQuery('')
    setPageResults([])
    setNextPage(null)
    setIsSearching(false)
    setIsLoadingMore(false)
    setSearchError(null)
    setOpen(true)

    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const contextValue = useMemo<LinkDialogContextValue>(() => ({
    openLinkDialog,
  }), [openLinkDialog])

  return (
    <LinkDialogContext.Provider value={contextValue}>
      {children}
      <Modal
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            resolveAndClose(null)
            return
          }
          setOpen(true)
        }}
        title={title}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            resolveAndClose(urlValue.trim())
          }}
          style={{ display: 'grid', gap: 12 }}
        >
          <div>
            <label htmlFor="editor-link-url" style={labelStyle}>
              Link URL
            </label>
            <input
              id="editor-link-url"
              ref={inputRef}
              type="url"
              value={urlValue}
              onChange={(event) => setUrlValue(event.target.value)}
              placeholder="https://example.com/page"
              style={inputStyle}
            />
          </div>

          {onSearchPages && (
            <div>
              <label htmlFor="editor-link-pages-search" style={labelStyle}>
                Link to existing page
              </label>
              <input
                id="editor-link-pages-search"
                type="search"
                value={pageQuery}
                onChange={(event) => setPageQuery(event.target.value)}
                placeholder="Search pages..."
                style={inputStyle}
              />
              <div style={resultsListStyle}>
                {isSearching && (
                  <div style={hintStyle}>Searching pages...</div>
                )}
                {!isSearching && searchError && (
                  <div style={errorStyle}>{searchError}</div>
                )}
                {!isSearching && !searchError && pageResults.length === 0 && (
                  <div style={hintStyle}>No pages found.</div>
                )}
                {!isSearching && !searchError && pageResults.map((page) => (
                  <button
                    key={`${String(page.id ?? page.url)}-${page.url}`}
                    type="button"
                    onClick={() => {
                      setUrlValue(page.url)
                      inputRef.current?.focus()
                    }}
                    style={resultButtonStyle}
                  >
                    <div style={{ fontSize: 13, color: 'var(--editor-text)' }}>{page.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--editor-text-muted)' }}>{page.url}</div>
                  </button>
                ))}
              </div>
              {nextPage !== null && (
                <button
                  type="button"
                  onClick={() => {
                    const query = pageQuery.trim()
                    void runPageSearch({
                      query,
                      page: nextPage,
                      append: true,
                    })
                  }}
                  disabled={isLoadingMore}
                  style={{
                    ...secondaryButtonStyle,
                    marginTop: 8,
                    width: '100%',
                    opacity: isLoadingMore ? 0.7 : 1,
                    cursor: isLoadingMore ? 'default' : 'pointer',
                  }}
                >
                  {isLoadingMore ? 'Loading...' : 'Load more results'}
                </button>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => resolveAndClose('')}
              style={secondaryButtonStyle}
            >
              Remove
            </button>
            <button
              type="button"
              onClick={() => resolveAndClose(null)}
              style={secondaryButtonStyle}
            >
              Cancel
            </button>
            <button type="submit" style={primaryButtonStyle}>
              Apply
            </button>
          </div>
        </form>
      </Modal>
    </LinkDialogContext.Provider>
  )
}

export function useLinkDialog() {
  const context = useContext(LinkDialogContext)
  if (!context) {
    throw new Error('useLinkDialog must be used within LinkDialogProvider')
  }
  return context.openLinkDialog
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--editor-text)',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--editor-border)',
  borderRadius: 2,
  padding: '8px 10px',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
  color: 'var(--editor-text)',
  backgroundColor: 'var(--editor-surface)',
}

const resultsListStyle: React.CSSProperties = {
  marginTop: 8,
  border: '1px solid var(--editor-border)',
  borderRadius: 2,
  maxHeight: 220,
  overflow: 'auto',
}

const resultButtonStyle: React.CSSProperties = {
  width: '100%',
  border: 'none',
  borderTop: '1px solid #f0f0f0',
  background: 'transparent',
  padding: '8px 10px',
  textAlign: 'left',
  cursor: 'pointer',
}

const hintStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 12,
  color: 'var(--editor-text-muted)',
}

const errorStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 12,
  color: '#b32d2e',
}

const secondaryButtonStyle: React.CSSProperties = {
  border: '1px solid var(--editor-border)',
  borderRadius: 2,
  background: 'var(--editor-surface)',
  color: 'var(--editor-text)',
  height: 32,
  padding: '0 10px',
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
}

const primaryButtonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 2,
  background: '#2271b1',
  color: '#fff',
  height: 32,
  padding: '0 12px',
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
}
