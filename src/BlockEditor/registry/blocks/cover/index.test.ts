import { describe, expect, it } from 'vitest'
import { coverBlock } from './index'

describe('coverBlock.save', () => {
  it('serializes min and max height when maxHeight is set', () => {
    const html = coverBlock.save({
      attributes: {
        url: 'https://example.com/cover.jpg',
        minHeight: 320,
        maxHeight: 640,
      },
      innerBlocks: [],
    })

    expect(html).toContain('style="min-height:320px;max-height:640px"')
  })

  it('serializes only min-height when maxHeight is omitted', () => {
    const html = coverBlock.save({
      attributes: {
        url: 'https://example.com/cover.jpg',
        minHeight: 320,
      },
      innerBlocks: [],
    })

    expect(html).toContain('style="min-height:320px"')
    expect(html).not.toContain('max-height:')
  })
})
