import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BlockEditor } from '../../../index'
import type { Block } from '../../../types'

function htmlBlockWith(content: string): Block[] {
  return [
    {
      clientId: 'html-styles-1',
      name: 'core/html',
      attributes: { content },
      innerBlocks: [],
    },
  ]
}

describe('core/html editor preview style scoping', () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => {
      root.unmount()
    })
    container.remove()
  })

  it('rescopes <style> content instead of leaking it document-wide', async () => {
    const content = '<style>body { background: #000; }</style><div class="hero">Hi</div>'

    await act(async () => {
      root.render(<BlockEditor initialBlocks={htmlBlockWith(content)} />)
    })

    const blockEl = container.querySelector('[data-block="html-styles-1"]')
    expect(blockEl).not.toBeNull()

    // The markup renders without the raw <style> tag inside the preview HTML.
    const previewHost = blockEl?.querySelector('[style*="pointer-events"]')
    expect(previewHost?.innerHTML).toContain('class="hero"')
    expect(previewHost?.innerHTML).not.toContain('<style>')

    // The css re-renders scoped under the canvas wrapper.
    const styles = Array.from(blockEl?.querySelectorAll('style') ?? [])
    const scoped = styles.map((el) => el.textContent ?? '').join('\n')
    expect(scoped).toContain('.editor-styles-wrapper { background: #000; }')
    expect(scoped).not.toMatch(/^body\s*\{/m)

    // The block's stored attribute is untouched — save output keeps the raw <style>.
    expect(content).toContain('<style>')
  })

  it('renders style-free html content unchanged', async () => {
    await act(async () => {
      root.render(<BlockEditor initialBlocks={htmlBlockWith('<p>Plain</p>')} />)
    })

    const blockEl = container.querySelector('[data-block="html-styles-1"]')
    const previewHost = blockEl?.querySelector('[style*="pointer-events"]')
    expect(previewHost?.innerHTML).toContain('<p>Plain</p>')
  })
})
