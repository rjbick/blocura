import { describe, expect, it } from 'vitest'
import type { Block } from '../types'
import { migrateLegacyBlockClasses, migrateLegacyHtmlClasses } from './migrateLegacyClasses'

describe('migrateLegacyClasses', () => {
  const legacyPrefix = `${String.fromCharCode(119)}${String.fromCharCode(112)}-`

  it('migrates legacy prefixed class names in HTML class attributes', () => {
    const input = `<div class="${legacyPrefix}block-group"><figure class="${legacyPrefix}block-image alignwide"><img class="${legacyPrefix}image-12 custom" src="/x.jpg" /></figure><p>${legacyPrefix}block-group text</p></div>`
    const migrated = migrateLegacyHtmlClasses(input)

    expect(migrated.changed).toBe(true)
    expect(migrated.value).toContain('class="editor-block-group"')
    expect(migrated.value).toContain('class="editor-block-image alignwide"')
    expect(migrated.value).toContain('class="editor-image-12 custom"')
    expect(migrated.value).toContain(`${legacyPrefix}block-group text`)
  })

  it('migrates legacy prefixed class names in block attributes recursively', () => {
    const blocks: Block[] = [
      {
        clientId: 'a',
        name: 'core/group',
        attributes: { className: `${legacyPrefix}block-group custom` },
        innerBlocks: [
          {
            clientId: 'b',
            name: 'core/column',
            attributes: { className: `${legacyPrefix}block-column` },
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
