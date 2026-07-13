import { useEffect, useMemo, useState } from 'react'
import type { EditorStyle } from '../types'
import { scopeCss } from '../helpers/transformEditorStyles'

// Fetched asset stylesheets survive editor remounts within the session.
const assetCssCache = new Map<string, string>()

/**
 * Resolve `settings.editorStyles` into a single scoped stylesheet string.
 * Inline `{ css }` entries transform synchronously; `{ assetUrl }` entries
 * are fetched once (cached module-wide) and transformed when they arrive,
 * using the stylesheet URL itself as the base for relative `url()`s.
 */
export function useEditorStyles(
  styles: EditorStyle[] | undefined,
  scopeSelector: string
): string {
  const [fetchedVersion, setFetchedVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    for (const entry of styles ?? []) {
      if (!('assetUrl' in entry) || assetCssCache.has(entry.assetUrl)) continue
      const url = entry.assetUrl
      fetch(url, { credentials: 'same-origin' })
        .then((response) => (response.ok ? response.text() : ''))
        .then((text) => {
          assetCssCache.set(url, text)
          if (!cancelled) setFetchedVersion((version) => version + 1)
        })
        .catch(() => {
          assetCssCache.set(url, '')
        })
    }
    return () => {
      cancelled = true
    }
  }, [styles])

  return useMemo(() => {
    void fetchedVersion
    return (styles ?? [])
      .map((entry) => {
        if ('assetUrl' in entry) {
          const css = assetCssCache.get(entry.assetUrl)
          return css ? scopeCss(css, scopeSelector, entry.assetUrl) : ''
        }
        return entry.css ? scopeCss(entry.css, scopeSelector, entry.baseURL) : ''
      })
      .filter(Boolean)
      .join('\n\n')
  }, [styles, scopeSelector, fetchedVersion])
}
