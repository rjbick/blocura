import { describe, expect, it } from 'vitest'
import type { Block } from '../types'
import { blocksToRawHtml } from './blocksToRawHtml'
import { parseHtmlToBlocks } from './parseHtmlToBlocks'

describe('blocksToRawHtml', () => {
  it('does not emit internal editor-* class names in output html', () => {
    const blocks: Block[] = [
      {
        clientId: 'p-1',
        name: 'core/paragraph',
        attributes: {
          content: 'Hello',
          className: 'custom-class editor-internal another-class',
        },
        innerBlocks: [],
      },
      {
        clientId: 'img-1',
        name: 'core/image',
        attributes: {
          url: 'https://example.com/a.jpg',
          alt: 'a',
          className: 'editor-block-image alignwide user-image',
        },
        innerBlocks: [],
      },
    ]

    const html = blocksToRawHtml(blocks)
    expect(html).not.toContain('editor-')
    expect(html).toContain('custom-class')
    expect(html).toContain('another-class')
  })

  it('includes title without internal class names when includeTitle is enabled', () => {
    const html = blocksToRawHtml([], { includeTitle: true, title: 'My title' })
    expect(html).toBe('<h1>My title</h1>')
    expect(html).not.toContain('editor-')
  })

  it('preserves heading text decoration in raw html output', () => {
    const blocks: Block[] = [
      {
        clientId: 'h-1',
        name: 'core/heading',
        attributes: {
          content: 'Decorated heading',
          level: 2,
          style: {
            typography: {
              textDecoration: 'underline',
            },
          },
        },
        innerBlocks: [],
      },
    ]

    const html = blocksToRawHtml(blocks)
    expect(html).toContain('<h2')
    expect(html).toContain('style="text-decoration:underline"')
    expect(html).toContain('Decorated heading')
  })

  it('can preserve internal editor classes for preview rendering', () => {
    const blocks: Block[] = [
      {
        clientId: 'columns-1',
        name: 'core/columns',
        attributes: {},
        innerBlocks: [
          {
            clientId: 'column-1',
            name: 'core/column',
            attributes: { width: '33.33%' },
            innerBlocks: [],
          },
          {
            clientId: 'column-2',
            name: 'core/column',
            attributes: { width: '66.67%' },
            innerBlocks: [],
          },
        ],
      },
    ]

    const html = blocksToRawHtml(blocks, { preserveInternalClasses: true })
    expect(html).toContain('editor-block-columns')
    expect(html).toContain('editor-block-column')
  })

  it('round-trips imported section/button html without dropping classes or inline styles', () => {
    const html = `
      <section class="hero-bg">
        <div>
          <p class="fu1">Toledo, Ohio · Ottawa River</p>
          <h1 class="fu2 hero-h1">Life is Better<br>on the River.</h1>
          <div class="fu3" style="display:flex;flex-wrap:wrap;gap:12px;">
            <a href="#" class="btn-gold">Join the Club</a>
            <a href="#" class="btn-outline-w">Explore the Marina</a>
          </div>
        </div>
        <div style="background:rgba(15,35,64,.9);border-top:1px solid rgba(255,255,255,.1);">
          <div style="max-width:1152px;margin:0 auto;padding:12px 24px;display:flex;flex-wrap:wrap;align-items:center;gap:24px;">
            <span>72°F · Sunny</span>
          </div>
        </div>
      </section>
    `

    const blocks = parseHtmlToBlocks(html)
    const serialized = blocksToRawHtml(blocks)

    expect(serialized).toContain('<section class="hero-bg">')
    expect(serialized).toContain('<div class="fu3" style="display:flex;flex-wrap:wrap;gap:12px">')
    expect(serialized).toContain('<a class="btn-gold" href="#">Join the Club</a>')
    expect(serialized).toContain('<a class="btn-outline-w" href="#">Explore the Marina</a>')
    expect(serialized).toContain('background:rgba(15, 35, 64, 0.9);border-top:1px solid rgba(255, 255, 255, 0.1)')
  })
})
