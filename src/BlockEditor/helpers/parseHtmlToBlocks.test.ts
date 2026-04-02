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

  it('parses section elements into a section block', () => {
    const blocks = parseHtmlToBlocks('<section id="hero" class="hero-bg"><h2>Welcome</h2><p>Body</p></section>')

    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.name).toBe('core/section')
    expect(blocks[0]?.attributes).toMatchObject({
      anchor: 'hero',
      className: 'hero-bg',
    })
    expect(blocks[0]?.innerBlocks).toHaveLength(2)
    expect(blocks[0]?.innerBlocks[0]?.name).toBe('core/heading')
    expect(blocks[0]?.innerBlocks[1]?.name).toBe('core/paragraph')
  })

  it('prefers section blocks for semantic section tags even with group-like classes', () => {
    const blocks = parseHtmlToBlocks('<section class="editor-block-group hero-shell"><p>Body</p></section>')

    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.name).toBe('core/section')
    expect(blocks[0]?.attributes).toMatchObject({
      className: 'hero-shell',
    })
    expect(blocks[0]?.innerBlocks).toHaveLength(1)
    expect(blocks[0]?.innerBlocks[0]?.name).toBe('core/paragraph')
  })

  it('parses wrapper divs into groups while leaving unsupported svg/icon rows as html fallbacks', () => {
    const html = `
      <section class="hero-bg">
        <div>
          <p class="fu1">Toledo, Ohio · Ottawa River</p>
          <h1 class="fu2 hero-h1">Life is Better<br>on the River.</h1>
          <p class="fu3">Downtown Toledo's premier member-owned yacht club.</p>
          <div class="fu3" style="display:flex;flex-wrap:wrap;gap:12px;">
            <a href="#" class="btn-gold">Join the Club</a>
            <a href="#" class="btn-outline-w">Explore the Marina</a>
          </div>
        </div>
        <div style="background:rgba(15,35,64,.9);border-top:1px solid rgba(255,255,255,.1);">
          <div style="max-width:1152px;margin:0 auto;padding:12px 24px;display:flex;flex-wrap:wrap;align-items:center;gap:24px;font-size:.82rem;color:rgba(255,255,255,.7);font-weight:300;">
            <span style="display:flex;align-items:center;gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24"></svg>72°F · Sunny</span>
            <span style="display:flex;align-items:center;gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24"></svg>Fuel Dock Open · 6pm</span>
            <span style="display:flex;align-items:center;gap:8px;"><svg width="16" height="16" viewBox="0 0 24 24"></svg>Upcoming: AYC Rendezvous · July 18–21</span>
            <a href="https://example.com/water" style="display:flex;align-items:center;gap:8px;">Live Water Levels</a>
          </div>
        </div>
      </section>
    `

    const blocks = parseHtmlToBlocks(html)
    expect(blocks).toHaveLength(1)

    const section = blocks[0]
    expect(section?.name).toBe('core/section')
    expect(section?.attributes).toMatchObject({
      className: 'hero-bg',
    })
    expect(section?.innerBlocks).toHaveLength(2)

    const introGroup = section?.innerBlocks[0]
    expect(introGroup?.name).toBe('core/group')
    expect(introGroup?.innerBlocks.map((block) => block.name)).toEqual([
      'core/paragraph',
      'core/heading',
      'core/paragraph',
      'core/buttons',
    ])

    const buttons = introGroup?.innerBlocks[3]
    expect(buttons?.attributes).toMatchObject({
      className: 'fu3',
      __htmlStyle: 'display:flex;flex-wrap:wrap;gap:12px',
    })
    expect(buttons?.innerBlocks).toHaveLength(2)

    const infoBar = section?.innerBlocks[1]
    expect(infoBar?.name).toBe('core/group')
    expect(infoBar?.attributes).toMatchObject({
      __htmlStyle: 'background:rgba(15,35,64,.9);border-top:1px solid rgba(255,255,255,.1)',
    })
    expect(infoBar?.innerBlocks).toHaveLength(1)

    const infoRow = infoBar?.innerBlocks[0]
    expect(infoRow?.name).toBe('core/group')
    expect(infoRow?.attributes).toMatchObject({
      __htmlStyle: 'max-width:1152px;margin:0 auto;padding:12px 24px;display:flex;flex-wrap:wrap;align-items:center;gap:24px;font-size:.82rem;color:rgba(255,255,255,.7);font-weight:300',
    })
    expect(infoRow?.innerBlocks.map((block) => block.name)).toEqual([
      'core/html',
      'core/html',
      'core/html',
      'core/html',
    ])
    expect(infoRow?.innerBlocks[0]?.attributes).toMatchObject({
      content: expect.stringContaining('72°F · Sunny'),
    })
    expect(infoRow?.innerBlocks[3]?.attributes).toMatchObject({
      content: expect.stringContaining('Live Water Levels'),
    })
  })

  it('preserves card components with inline svg fragments as single html blocks inside layout wrappers', () => {
    const html = `
      <div class="three-col">
        <div class="fcard">
          <div class="ficon" style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;">
            <svg width="22" height="22" viewBox="0 0 24 24"></svg>
          </div>
          <h3>The Marina</h3>
          <p>249 modern docks.</p>
          <a href="#" class="pill-link">Explore Docks <svg width="14" height="14" viewBox="0 0 24 24"></svg></a>
        </div>
      </div>
    `

    const blocks = parseHtmlToBlocks(html)
    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.name).toBe('core/group')
    expect(blocks[0]?.attributes).toMatchObject({
      className: 'three-col',
    })
    expect(blocks[0]?.innerBlocks).toHaveLength(1)

    const card = blocks[0]?.innerBlocks[0]
    expect(card?.name).toBe('core/html')
    expect(card?.attributes).toMatchObject({
      content: expect.stringContaining('class="fcard"'),
    })
    expect(card?.attributes).toMatchObject({
      content: expect.stringContaining('Explore Docks'),
    })
  })

  it('parses generic grid divs into columns with preserved card wrappers', () => {
    const html = `
      <div class="three-col">
        <div class="fcard">
          <h3>The Marina</h3>
          <p>249 modern docks.</p>
        </div>
        <div class="fcard">
          <h3>River View Cafe</h3>
          <p>Dining on the water.</p>
        </div>
        <div class="fcard">
          <h3>Our Community</h3>
          <p>Boating families for generations.</p>
        </div>
      </div>
    `

    const blocks = parseHtmlToBlocks(html)
    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.name).toBe('core/columns')
    expect(blocks[0]?.attributes).toMatchObject({
      className: 'three-col',
      columns: 3,
    })
    expect(blocks[0]?.innerBlocks).toHaveLength(3)
    expect(blocks[0]?.innerBlocks.map((block) => block.name)).toEqual([
      'core/column',
      'core/column',
      'core/column',
    ])
    expect(blocks[0]?.innerBlocks[0]?.innerBlocks[0]?.name).toBe('core/group')
    expect(blocks[0]?.innerBlocks[0]?.innerBlocks[0]?.attributes).toMatchObject({
      className: 'fcard',
    })
  })

  it('falls back to core/html for unknown top-level elements', () => {
    const blocks = parseHtmlToBlocks('<article data-role="hero">Custom</article>')

    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.name).toBe('core/html')
    expect(blocks[0]?.attributes).toMatchObject({
      content: '<article data-role="hero">Custom</article>',
    })
  })
})
