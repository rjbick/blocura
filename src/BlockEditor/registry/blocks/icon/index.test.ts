import { describe, expect, it } from 'vitest'
import { iconBlock } from './index'
import { gridBlock } from '../grid'
import { mapBlock } from '../map'
import { accordionBlock } from '../accordion'

describe('iconBlock.save', () => {
  it('wraps the stored svg with sizing and color', () => {
    const html = iconBlock.save({
      attributes: { svg: '<svg data-x="1"></svg>', size: 32, color: '#c8952a' },
      innerBlocks: [],
    })
    expect(html).toContain('class="editor-block-icon"')
    expect(html).toContain('width:32px')
    expect(html).toContain('color:#c8952a')
    expect(html).toContain('<svg data-x="1"></svg>')
    expect(html).toContain('aria-hidden="true"')
  })

  it('adds a circle background at double size and an accessible label', () => {
    const html = iconBlock.save({
      attributes: { svg: '<svg></svg>', size: 20, background: '#f5e6c8', label: 'Community' },
      innerBlocks: [],
    })
    expect(html).toContain('width:40px')
    expect(html).toContain('background:#f5e6c8;border-radius:50%')
    expect(html).toContain('role="img" aria-label="Community"')
  })
})

describe('gridBlock.save', () => {
  it('emits a grid container with column count and gap', () => {
    const html = gridBlock.save({
      attributes: { columns: 4, gap: 12 },
      innerBlocks: [{ clientId: 'a', name: 'core/paragraph', attributes: {}, innerBlocks: [] }],
    })
    expect(html).toContain('grid-template-columns:repeat(4,minmax(0,1fr))')
    expect(html).toContain('gap:12px')
    expect(html).toContain('is-stack-mobile')
    expect(html).toContain('<!-- inner block -->')
  })

  it('omits the mobile stack class when disabled', () => {
    const html = gridBlock.save({ attributes: { stackOnMobile: false }, innerBlocks: [] })
    expect(html).not.toContain('is-stack-mobile')
  })
})

describe('mapBlock.save', () => {
  it('embeds a keyless map iframe for the address', () => {
    const html = mapBlock.save({
      attributes: { address: '5981 Edgewater Drive, Toledo', zoom: 14, height: 260 },
      innerBlocks: [],
    })
    expect(html).toContain('https://www.google.com/maps?q=5981%20Edgewater%20Drive%2C%20Toledo&z=14&output=embed')
    expect(html).toContain('height:260px')
    expect(html).toContain('loading="lazy"')
  })

  it('returns empty output without an address', () => {
    expect(mapBlock.save({ attributes: {}, innerBlocks: [] })).toBe('')
  })
})

describe('accordionBlock.save', () => {
  it('wraps inner details in an accordion container', () => {
    const html = accordionBlock.save({
      attributes: { anchor: 'faq' },
      innerBlocks: [{ clientId: 'a', name: 'core/details', attributes: {}, innerBlocks: [] }],
    })
    expect(html).toContain('class="editor-block-accordion"')
    expect(html).toContain('id="faq"')
    expect(html).toContain('<!-- inner block -->')
  })
})
