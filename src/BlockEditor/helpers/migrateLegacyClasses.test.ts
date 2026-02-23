import { describe, expect, it } from 'vitest'
import type { Block } from '../types'
import { migrateLegacyBlockClasses, migrateLegacyHtmlClasses } from './migrateLegacyClasses'

describe('migrateLegacyClasses', () => {
  it('migrates legacy wp-* class names in HTML class attributes', () => {
    const input = '<div class="wp-block-group"><figure class="wp-block-image alignwide"><img class="wp-image-12 custom" src="/x.jpg" /></figure><p>wp-block-group text</p></div>'
    const migrated = migrateLegacyHtmlClasses(input)

    expect(migrated.changed).toBe(true)
    expect(migrated.value).toContain('class="editor-block-group"')
    expect(migrated.value).toContain('class="editor-block-image alignwide"')
    expect(migrated.value).toContain('class="editor-image-12 custom"')
    expect(migrated.value).toContain('wp-block-group text')
  })

  it('migrates legacy wp-* class names in block attributes recursively', () => {
    const blocks: Block[] = [
      {
        clientId: 'a',
        name: 'core/group',
        attributes: { className: 'wp-block-group custom' },
        innerBlocks: [
          {
            clientId: 'b',
            name: 'core/column',
            attributes: { className: 'wp-block-column' },
            innerBlocks: [],
          },
        ],
      },
    ]

    const migrated = migrateLegacyBlockClasses(blocks)
    expect(migrated.changed).toBe(true)
    expect((migrated.value[0]?.attributes as { className?: string }).className).toBe('editor-block-group custom')
    expect((migrated.value[0]?.innerBlocks[0]?.attributes as { className?: string }).className).toBe('editor-block-column')
  })
})
