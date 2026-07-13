import type { EditorStyle } from '../types'

/**
 * Scoped-CSS transform for editor canvas style injection.
 *
 * Page/site CSS is written against the real document (`body { ... }`, bare
 * element selectors, `:root` variables). To apply it inside the editing
 * canvas without leaking into the editor chrome, every selector is rewritten
 * to live under a scope selector (the canvas wrapper):
 *
 *   body { ... }          -> .editor-styles-wrapper { ... }
 *   body.dark { ... }     -> .editor-styles-wrapper.dark { ... }
 *   h1, .hero { ... }     -> .editor-styles-wrapper h1, .editor-styles-wrapper .hero { ... }
 *
 * Conditional group rules (`@media`, `@supports`, ...) are recursed into;
 * name-defining at-rules (`@keyframes`, `@font-face`, ...) pass through
 * untouched because prefixing their inner selectors would corrupt them.
 */

/** Class on the canvas wrapper that scoped editor styles are rewritten under. */
export const EDITOR_STYLES_SCOPE = '.editor-styles-wrapper'

const CONDITIONAL_AT_RULES = new Set(['media', 'supports', 'container', 'layer', 'scope'])

const ROOT_TOKEN_PATTERN = /^(?:html|body|:root)(?![\w-])/i
const ATTACHED_COMPOUND_PATTERN = /^(?:[.:#[][^\s>+~,]*)+/

function findStringEnd(css: string, start: number): number {
  const quote = css[start]
  let i = start + 1
  while (i < css.length) {
    if (css[i] === '\\') {
      i += 2
      continue
    }
    if (css[i] === quote) return i + 1
    i += 1
  }
  return css.length
}

function stripComments(css: string): string {
  let out = ''
  let i = 0
  while (i < css.length) {
    const ch = css[i]
    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2)
      i = end === -1 ? css.length : end + 2
      continue
    }
    if (ch === '"' || ch === "'") {
      const end = findStringEnd(css, i)
      out += css.slice(i, end)
      i = end
      continue
    }
    out += ch
    i += 1
  }
  return out
}

/** Index of the `}` that closes the block opened at `braceIndex`. */
function findBlockEnd(css: string, braceIndex: number): number {
  let depth = 0
  let i = braceIndex
  while (i < css.length) {
    const ch = css[i]
    if (ch === '"' || ch === "'") {
      i = findStringEnd(css, i)
      continue
    }
    if (ch === '{') depth += 1
    if (ch === '}') {
      depth -= 1
      if (depth === 0) return i
    }
    i += 1
  }
  return css.length
}

function splitSelectorList(header: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  let i = 0
  while (i < header.length) {
    const ch = header[i]
    if (ch === '"' || ch === "'") {
      i = findStringEnd(header, i)
      continue
    }
    if (ch === '(' || ch === '[') depth += 1
    else if (ch === ')' || ch === ']') depth -= 1
    else if (ch === ',' && depth === 0) {
      parts.push(header.slice(start, i))
      start = i + 1
    }
    i += 1
  }
  parts.push(header.slice(start))
  return parts.map((part) => part.trim()).filter(Boolean)
}

function scopeSelector(selector: string, scope: string): string {
  if (selector.startsWith(scope)) return selector

  if (!ROOT_TOKEN_PATTERN.test(selector)) {
    return `${scope} ${selector}`
  }

  // Consume leading document-root tokens ("html body", ":root", "body.dark")
  // so their qualifiers re-attach to the scope selector itself.
  let rest = selector
  let attached = ''
  while (ROOT_TOKEN_PATTERN.test(rest)) {
    rest = rest.replace(ROOT_TOKEN_PATTERN, '')
    const attachMatch = rest.match(ATTACHED_COMPOUND_PATTERN)
    if (attachMatch) {
      attached += attachMatch[0]
      rest = rest.slice(attachMatch[0].length)
    }
    const combinatorMatch = rest.match(/^\s*(?:>\s*)?/)
    const afterCombinator = rest.slice(combinatorMatch ? combinatorMatch[0].length : 0)
    if (!ROOT_TOKEN_PATTERN.test(afterCombinator)) break
    rest = afterCombinator
  }

  rest = rest.trim()
  return rest ? `${scope}${attached} ${rest}` : `${scope}${attached}`
}

function rewriteUrls(css: string, baseURL: string): string {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (match, quote, url) => {
    const trimmed = String(url).trim()
    if (/^(?:data:|blob:|#|\/\/|[a-z][a-z0-9+.-]*:)/i.test(trimmed)) {
      return match
    }
    try {
      return `url(${quote}${new URL(trimmed, baseURL).href}${quote})`
    } catch {
      return match
    }
  })
}

function walk(css: string, scope: string): string {
  const out: string[] = []
  let i = 0
  while (i < css.length) {
    while (i < css.length && /\s/.test(css[i])) i += 1
    if (i >= css.length) break

    // Find the end of the next statement: either a declaration-block `{`
    // or a `;` terminating a statement at-rule (@import, @charset, ...).
    let j = i
    let braceIndex = -1
    while (j < css.length) {
      const ch = css[j]
      if (ch === '"' || ch === "'") {
        j = findStringEnd(css, j)
        continue
      }
      if (ch === '{') {
        braceIndex = j
        break
      }
      if (ch === ';') break
      j += 1
    }

    if (braceIndex === -1) {
      const statement = css.slice(i, Math.min(j + 1, css.length)).trim()
      if (statement && statement !== ';') out.push(statement)
      i = j + 1
      continue
    }

    const header = css.slice(i, braceIndex).trim()
    const blockEnd = findBlockEnd(css, braceIndex)
    const body = css.slice(braceIndex + 1, blockEnd)

    if (header.startsWith('@')) {
      const name = header.slice(1).split(/[\s({]/, 1)[0].toLowerCase()
      if (CONDITIONAL_AT_RULES.has(name)) {
        out.push(`${header} {\n${walk(body, scope)}\n}`)
      } else {
        out.push(`${header} {${body}}`)
      }
    } else if (header) {
      const scoped = splitSelectorList(header)
        .map((selector) => scopeSelector(selector, scope))
        .join(', ')
      out.push(`${scoped} {${body}}`)
    }

    i = blockEnd + 1
  }
  return out.join('\n')
}

/**
 * Rewrite a stylesheet so every rule only applies under `scopeSelector`.
 * When `baseURL` is provided, relative `url()` references are resolved
 * against it first (so page CSS keeps working from the editor's origin).
 */
export function scopeCss(css: string, scopeSelector: string, baseURL?: string): string {
  if (typeof css !== 'string' || css.trim() === '') return ''
  let prepared = stripComments(css)
  if (baseURL) prepared = rewriteUrls(prepared, baseURL)
  return walk(prepared, scopeSelector)
}

/**
 * Transform inline `{ css }` editor styles into one scoped stylesheet.
 * `{ assetUrl }` entries are skipped here — they need fetching first
 * (see `useEditorStyles`), after which their text goes through `scopeCss`
 * with the stylesheet URL as the base for `url()` resolution.
 */
export function transformEditorStyles(
  styles: EditorStyle[] | undefined,
  scopeSelector: string
): string {
  if (!styles || styles.length === 0) return ''
  return styles
    .map((entry) => ('css' in entry ? scopeCss(entry.css, scopeSelector, entry.baseURL) : ''))
    .filter(Boolean)
    .join('\n\n')
}
