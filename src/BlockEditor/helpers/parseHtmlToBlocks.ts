import type { Block } from '../types'
import { BlockRegistry } from '../registry/BlockRegistry'
import { parseBlockMarkup } from './parseBlockMarkup'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function wrap(shortName: string, html: string, attrs?: Record<string, unknown>): string {
  const attrsPart =
    attrs && Object.keys(attrs).length > 0
      ? ` ${JSON.stringify(attrs)}`
      : ''
  return `<!-- wp:${shortName}${attrsPart} -->\n${html}\n<!-- /wp:${shortName} -->`
}

function normalizeShortName(candidate: string): string | null {
  const coreName = `core/${candidate}`
  return BlockRegistry.has(coreName) ? candidate : null
}

function fromClassName(el: HTMLElement): string | null {
  const classes = el.className.split(/\s+/).filter(Boolean)
  for (const className of classes) {
    if (!className.startsWith('wp-block-')) continue
    const candidate = className.replace(/^wp-block-/, '')
    const short = normalizeShortName(candidate)
    if (short) return short
  }
  return null
}

function elementToMarkup(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase()
  const classDetected = fromClassName(el)

  if (classDetected) {
    return wrap(classDetected, el.outerHTML)
  }

  if (tag === 'p') return wrap('paragraph', el.outerHTML)
  if (/^h[1-6]$/.test(tag)) {
    const level = Number(tag.slice(1))
    return wrap('heading', el.outerHTML, Number.isFinite(level) ? { level } : undefined)
  }
  if (tag === 'ul' || tag === 'ol') return wrap('list', el.outerHTML)
  if (tag === 'li') return wrap('list-item', el.outerHTML)
  if (tag === 'blockquote') {
    return wrap(el.classList.contains('wp-block-pullquote') ? 'pullquote' : 'quote', el.outerHTML)
  }
  if (tag === 'pre') {
    const hasCode = Boolean(el.querySelector('code'))
    return wrap(hasCode ? 'code' : 'preformatted', el.outerHTML)
  }
  if (tag === 'code') return wrap('code', `<pre><code>${el.innerHTML}</code></pre>`)
  if (tag === 'hr') return wrap('separator', el.outerHTML)
  if (tag === 'table') return wrap('table', `<figure class="wp-block-table">${el.outerHTML}</figure>`)
  if (tag === 'img') return wrap('image', `<figure class="wp-block-image">${el.outerHTML}</figure>`)

  if (tag === 'figure') {
    if (el.querySelector('img')) return wrap('image', el.outerHTML)
    if (el.querySelector('video')) return wrap('video', el.outerHTML)
    if (el.querySelector('audio')) return wrap('audio', el.outerHTML)
    if (el.querySelector('table')) return wrap('table', el.outerHTML)
  }

  if (tag === 'video') return wrap('video', `<figure class="wp-block-video">${el.outerHTML}</figure>`)
  if (tag === 'audio') return wrap('audio', `<figure class="wp-block-audio">${el.outerHTML}</figure>`)
  if (tag === 'iframe') return wrap('embed', `<figure class="wp-block-embed"><div class="wp-block-embed__wrapper">${el.outerHTML}</div></figure>`)
  if (tag === 'nav') return wrap('navigation', el.outerHTML)

  return wrap('html', el.outerHTML)
}

export function parseHtmlToBlocks(html: string): Block[] {
  if (!html || !html.trim()) return []

  const container = document.createElement('div')
  container.innerHTML = html

  const fragments: string[] = []
  for (const node of Array.from(container.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim()
      if (text) {
        fragments.push(wrap('paragraph', `<p>${escapeHtml(text)}</p>`))
      }
      continue
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue
    fragments.push(elementToMarkup(node as HTMLElement))
  }

  const markup = fragments.join('\n\n')
  return parseBlockMarkup(markup)
}
