import { describe, expect, it } from 'vitest'
import { parseBlocksJson } from './parseBlocksJson'

describe('parseBlocksJson', () => {
  it('parses blocks from a JSON string', () => {
    const parsed = parseBlocksJson(
      JSON.stringify([
        {
          name: 'core/paragraph',
          attributes: { content: 'Hello' },
          innerBlocks: [],
        },
      ])
    )

    expect(parsed).toHaveLength(1)
    expect(parsed[0]?.name).toBe('core/paragraph')
    expect(parsed[0]?.attributes).toEqual({ content: 'Hello' })
    expect(typeof parsed[0]?.clientId).toBe('string')
    expect(parsed[0]?.clientId.length).toBeGreaterThan(0)
  })

  it('supports payloads that wrap blocks in a root object', () => {
    const parsed = parseBlocksJson(
      JSON.stringify({
        blocks: [
          {
            clientId: 'block-1',
            name: 'core/heading',
            attributes: { content: 'Title', level: 2 },
            innerBlocks: [],
          },
        ],
      })
    )

    expect(parsed).toHaveLength(1)
    expect(parsed[0]?.clientId).toBe('block-1')
    expect(parsed[0]?.name).toBe('core/heading')
  })

  it('returns an empty list for invalid JSON', () => {
    expect(parseBlocksJson('{not valid json')).toEqual([])
  })
})
