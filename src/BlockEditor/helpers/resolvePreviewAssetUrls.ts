import type { PreviewAssetUrlContext } from '../types'

type PreviewAssetUrlResolver = (
  url: string,
  context: PreviewAssetUrlContext
) => string | null | undefined

const URL_ATTRIBUTES = new Set([
  'src',
  'href',
  'poster',
  'data-src',
  'data-href',
  'action',
  'formaction',
])

function resolveUrl(
  url: string,
  context: PreviewAssetUrlContext,
  resolver: PreviewAssetUrlResolver
): string {
  try {
    const resolved = resolver(url, context)
    if (typeof resolved !== 'string') return url
    const trimmed = resolved.trim()
    return trimmed || url
  } catch {
    return url
  }
}

function resolveSrcset(
  srcset: string,
  tagName: string,
  resolver: PreviewAssetUrlResolver
): string {
  return srcset
    .split(',')
    .map((candidate) => {
      const trimmed = candidate.trim()
      if (!trimmed) return ''
      const parts = trimmed.split(/\s+/)
      const sourceUrl = parts[0]
      if (!sourceUrl) return trimmed
      const nextUrl = resolveUrl(sourceUrl, { tagName, attribute: 'srcset' }, resolver)
      if (parts.length === 1) return nextUrl
      return `${nextUrl} ${parts.slice(1).join(' ')}`
    })
    .filter(Boolean)
    .join(', ')
}

export function resolvePreviewAssetUrls(
  rawHtml: string,
  resolver?: PreviewAssetUrlResolver
): string {
  if (!resolver) return rawHtml
  if (!rawHtml || !rawHtml.trim()) return rawHtml

  const container = document.createElement('div')
  container.innerHTML = rawHtml

  for (const node of container.querySelectorAll<HTMLElement>('*')) {
    const tagName = node.tagName.toLowerCase()
    for (const attrName of node.getAttributeNames()) {
      const lower = attrName.toLowerCase()
      const value = node.getAttribute(attrName)
      if (!value) continue

      if (lower === 'srcset') {
        const nextSrcset = resolveSrcset(value, tagName, resolver)
        if (nextSrcset && nextSrcset !== value) {
          node.setAttribute(attrName, nextSrcset)
        }
        continue
      }

      if (!URL_ATTRIBUTES.has(lower)) continue

      const nextValue = resolveUrl(value, { tagName, attribute: lower }, resolver)
      if (nextValue !== value) {
        node.setAttribute(attrName, nextValue)
      }
    }
  }

  return container.innerHTML
}
