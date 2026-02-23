import { describe, expect, it } from 'vitest'
import type { Block } from '../types'
import { blocksToRawHtml } from './blocksToRawHtml'

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
})
