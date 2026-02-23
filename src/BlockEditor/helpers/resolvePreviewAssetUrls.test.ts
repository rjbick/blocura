import { describe, expect, it } from 'vitest'
import { resolvePreviewAssetUrls } from './resolvePreviewAssetUrls'

describe('resolvePreviewAssetUrls', () => {
  it('rewrites URL-based attributes with resolver output', () => {
    const html = [
      '<img src="blob:http://localhost:5173/image-1" alt="" />',
      '<a href="/docs/start">Docs</a>',
    ].join('')

    const resolved = resolvePreviewAssetUrls(html, (url) => {
      if (url.startsWith('blob:')) return 'https://cdn.example.com/assets/image-1.jpg'
      if (url.startsWith('/')) return `https://example.com${url}`
      return url
    })

    expect(resolved).toContain('src="https://cdn.example.com/assets/image-1.jpg"')
    expect(resolved).toContain('href="https://example.com/docs/start"')
  })

  it('rewrites srcset candidates', () => {
    const html = '<source srcset="/small.jpg 480w, /large.jpg 1080w" />'
    const resolved = resolvePreviewAssetUrls(html, (url) => `https://example.com${url}`)

    expect(resolved).toContain('srcset="https://example.com/small.jpg 480w, https://example.com/large.jpg 1080w"')
  })

  it('keeps original URL when resolver throws', () => {
    const html = '<img src="blob:http://localhost/test" alt="" />'
    const resolved = resolvePreviewAssetUrls(html, () => {
      throw new Error('resolver failed')
    })

    expect(resolved).toContain('src="blob:http://localhost/test"')
  })
})
