import { describe, expect, it } from 'vitest'
import { parseHtmlToBlocks } from './parseHtmlToBlocks'

describe('parseHtmlToBlocks', () => {
  it('parses paragraph HTML into a paragraph block', () => {
    const blocks = parseHtmlToBlocks('<p>Hello <strong>world</strong></p>')

    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.name).toBe('core/paragraph')
    expect(blocks[0]?.attributes).toMatchObject({
      content: 'Hello <strong>world</strong>',
    })
  })

  it('parses lists into nested list/list-item blocks', () => {
    const blocks = parseHtmlToBlocks('<ul><li>First</li><li>Second</li></ul>')

    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.name).toBe('core/list')
    expect(blocks[0]?.innerBlocks).toHaveLength(2)
    expect(blocks[0]?.innerBlocks[0]?.name).toBe('core/list-item')
    expect(blocks[0]?.innerBlocks[0]?.attributes).toMatchObject({ content: 'First' })
  })

  it('parses heading text decoration style into heading typography attributes', () => {
    const blocks = parseHtmlToBlocks('<h2 style="text-decoration: underline;">Decorated</h2>')

    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.name).toBe('core/heading')
    expect(blocks[0]?.attributes).toMatchObject({
      content: 'Decorated',
      level: 2,
      style: {
        typography: {
          textDecoration: 'underline',
        },
      },
    })
  })

  it('falls back to core/html for unknown top-level elements', () => {
    const blocks = parseHtmlToBlocks('<section data-role="hero">Custom</section>')

    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.name).toBe('core/html')
    expect(blocks[0]?.attributes).toMatchObject({
      content: '<section data-role="hero">Custom</section>',
    })
  })
})
