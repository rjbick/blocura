import { describe, expect, it } from 'vitest'
import type { Block, BlockDefinition } from '../types'
import { applyBlockSupports } from './applyBlockSupports'

const stubDefinition: BlockDefinition = {
  name: 'core/paragraph',
  title: 'Paragraph',
  category: 'text',
  icon: 'P',
  supports: {},
  attributes: {},
  edit: (() => null) as BlockDefinition['edit'],
  save: () => '',
}

describe('applyBlockSupports', () => {
  it('maps support attributes to stable classes and inline style values', () => {
    const block: Block = {
      clientId: 'supports-1',
      name: 'core/paragraph',
      attributes: {
        align: 'wide',
        className: 'custom-class',
        __hideOn: { mobile: true },
        textColor: 'contrast',
        backgroundColor: 'base',
        gradient: 'sunset',
        fontSize: 'large',
        style: {
          color: {
            text: '#111111',
            background: '#f4f4f4',
            gradient: 'linear-gradient(red, blue)',
          },
          typography: {
            fontSize: '20px',
            lineHeight: '1.5',
            textColumns: 2,
          },
          spacing: {
            padding: { top: '1rem', left: '2rem' },
            margin: '8px',
            blockGap: '12px',
          },
          dimensions: {
            minHeight: '200px',
            aspectRatio: '16/9',
          },
          border: {
            color: '#000000',
            radius: '4px',
            style: 'solid',
            width: '1px',
          },
        },
      },
      innerBlocks: [],
    }

    const result = applyBlockSupports(block, stubDefinition)

    expect(result.className).toContain('editor-block-paragraph')
    expect(result.className).toContain('alignwide')
    expect(result.className).toContain('custom-class')
    expect(result.className).toContain('hide-on-mobile')
    expect(result.className).toContain('has-contrast-color')
    expect(result.className).toContain('has-base-background-color')
    expect(result.className).toContain('has-sunset-gradient-background')
    expect(result.className).toContain('has-large-font-size')

    expect(result.style).toMatchObject({
      color: '#111111',
      backgroundColor: '#f4f4f4',
      backgroundImage: 'linear-gradient(red, blue)',
      fontSize: '20px',
      lineHeight: '1.5',
      columnCount: 2,
      paddingTop: '1rem',
      paddingLeft: '2rem',
      margin: '8px',
      gap: '12px',
      minHeight: '200px',
      aspectRatio: '16/9',
      borderColor: '#000000',
      borderRadius: '4px',
      borderStyle: 'solid',
      borderWidth: '1px',
    })
  })
})
