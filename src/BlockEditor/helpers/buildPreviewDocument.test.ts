import { describe, expect, it } from 'vitest'
import { buildPreviewDocument } from './buildPreviewDocument'

describe('buildPreviewDocument', () => {
  it('includes cover block layout CSS so preview matches editor structure', () => {
    const html = buildPreviewDocument({
      rawHtml: '<div class="editor-block-cover"></div>',
      title: 'Preview',
    })

    expect(html).toContain('.editor-block-cover__image-background')
    expect(html).toContain('.editor-block-cover__inner-container')
  })

  it('embeds provided rawHtml into the preview body', () => {
    const html = buildPreviewDocument({
      rawHtml: '<div class="editor-block-cover is-dark"></div>',
      title: 'Preview',
    })

    expect(html).toContain('<body><div class="editor-block-cover is-dark"></div></body>')
  })

  it('supports loading external preview assets and body class', () => {
    const html = buildPreviewDocument({
      rawHtml: '<main>Content</main>',
      title: 'Preview',
      preview: {
        stylesheets: ['https://cdn.example.com/site.css'],
        scripts: ['https://cdn.example.com/site.js'],
        htmlClassName: 'site-html',
        bodyClassName: 'site-shell theme-dark',
        baseUrl: 'https://example.com/base/',
      },
    })

    expect(html).toContain('<link rel="stylesheet" href="https://cdn.example.com/site.css" />')
    expect(html).toContain('<script src="https://cdn.example.com/site.js" defer></script>')
    expect(html).toContain('<html lang="en" class="site-html">')
    expect(html).toContain('<base href="https://example.com/base/" />')
    expect(html).toContain('<body class="site-shell theme-dark"><main>Content</main>')
  })

  it('can disable built-in fallback preview styles', () => {
    const html = buildPreviewDocument({
      rawHtml: '<p>Body</p>',
      title: 'Preview',
      preview: { includeDefaultStyles: false },
    })

    expect(html).not.toContain('.editor-block-cover__image-background')
    expect(html).not.toContain('font-family: -apple-system')
  })

  it('supports templateHtml with {{content}} placeholder', () => {
    const html = buildPreviewDocument({
      rawHtml: '<article>Body</article>',
      title: 'Preview',
      preview: {
        templateHtml: '<div class="layout"><main>{{content}}</main></div>',
      },
    })

    expect(html).toContain('<body><div class="layout"><main><article>Body</article></main></div></body>')
  })
})
