import { describe, expect, it } from 'vitest'
import type { Block } from '../types'
import {
  createDefaultBlockForRoot,
  isBlockNameAllowedAtRoot,
} from './insertionRules'

describe('insertionRules', () => {
  it('restricts structural child blocks at the document root', () => {
    expect(isBlockNameAllowedAtRoot('core/paragraph', [], null)).toBe(true)
    expect(isBlockNameAllowedAtRoot('core/column', [], null)).toBe(false)
    expect(isBlockNameAllowedAtRoot('core/list-item', [], null)).toBe(false)
  })

  it('allows only button children inside core/buttons', () => {
    const blocks: Block[] = [
      {
        clientId: 'buttons-1',
        name: 'core/buttons',
        attributes: {},
        innerBlocks: [],
      },
    ]

    expect(isBlockNameAllowedAtRoot('core/button', blocks, 'buttons-1')).toBe(true)
    expect(isBlockNameAllowedAtRoot('core/paragraph', blocks, 'buttons-1')).toBe(false)
  })

  it('uses container-aware defaults for insertions', () => {
    const blocks: Block[] = [
      {
        clientId: 'buttons-2',
        name: 'core/buttons',
        attributes: {},
        innerBlocks: [],
      },
    ]

    const next = createDefaultBlockForRoot(blocks, 'buttons-2')

    expect(next).not.toBeNull()
    expect(next?.name).toBe('core/button')
  })
})
