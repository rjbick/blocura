import { describe, expect, it } from 'vitest'
import type { Block } from '../types'
import { extractTailwindSafelist } from './extractTailwindSafelist'

describe('extractTailwindSafelist', () => {
  it('collects user classes from block className attributes recursively', () => {
    const blocks: Block[] = [
      {
        clientId: 'group-1',
        name: 'core/group',
        attributes: { className: 'grid grid-cols-2 editor-block-group' },
        innerBlocks: [
          {
            clientId: 'para-1',
            name: 'core/paragraph',
            attributes: { className: 'text-xl font-semibold' },
            innerBlocks: [],
          },
        ],
      },
    ]

    expect(extractTailwindSafelist(blocks)).toEqual([
      'font-semibold',
      'grid',
      'grid-cols-2',
      'text-xl',
    ])
  })

  it('collects classes from core/html block content', () => {
    const blocks: Block[] = [
      {
        clientId: 'html-1',
        name: 'core/html',
        attributes: {
          content: '<section class="prose lg:prose-xl"><div class="mt-6"></div></section>',
        },
        innerBlocks: [],
      },
    ]

    expect(extractTailwindSafelist(blocks)).toEqual([
      'lg:prose-xl',
      'mt-6',
      'prose',
    ])
  })
})
