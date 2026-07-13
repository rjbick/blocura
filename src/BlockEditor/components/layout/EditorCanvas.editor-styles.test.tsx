import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BlockEditor } from '../../index'
import type { Block } from '../../types'

const PARAGRAPH_BLOCK: Block[] = [
  {
    clientId: 'styles-1',
    name: 'core/separator',
    attributes: {},
    innerBlocks: [],
  },
]

describe('editor styles injection', () => {
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
    vi.restoreAllMocks()
  })

  it('renders scoped css from settings.editorStyles inside the canvas wrapper', async () => {
    await act(async () => {
      root.render(
        <BlockEditor
          initialBlocks={PARAGRAPH_BLOCK}
          settings={{
            editorStyles: [{ css: 'body { background: #123456; } h1 { color: red; }' }],
          }}
        />
      )
    })

    const wrapper = container.querySelector('.editor-styles-wrapper')
    expect(wrapper).not.toBeNull()

    const styleEl = container.querySelector('style[data-blocura-editor-styles]')
    expect(styleEl).not.toBeNull()
    expect(styleEl?.textContent).toContain('.editor-styles-wrapper { background: #123456; }')
    expect(styleEl?.textContent).toContain('.editor-styles-wrapper h1 { color: red; }')
    expect(styleEl?.textContent).not.toMatch(/^body\s*\{/m)
  })

  it('treats deprecated defaultEditorStyles as the first editor style', async () => {
    await act(async () => {
      root.render(
        <BlockEditor
          initialBlocks={PARAGRAPH_BLOCK}
          settings={{ defaultEditorStyles: 'p { line-height: 1.8; }' }}
        />
      )
    })

    const styleEl = container.querySelector('style[data-blocura-editor-styles]')
    expect(styleEl?.textContent).toContain('.editor-styles-wrapper p { line-height: 1.8; }')
  })

  it('fetches assetUrl styles and injects them scoped once loaded', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('.site-card { border-radius: 8px; }'),
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => {
      root.render(
        <BlockEditor
          initialBlocks={PARAGRAPH_BLOCK}
          settings={{
            editorStyles: [{ assetUrl: 'https://example.com/site.css' }],
          }}
        />
      )
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/site.css',
      expect.objectContaining({ credentials: 'same-origin' })
    )

    const styleEl = container.querySelector('style[data-blocura-editor-styles]')
    expect(styleEl?.textContent).toContain(
      '.editor-styles-wrapper .site-card { border-radius: 8px; }'
    )
  })

  it('renders no style element when no editor styles are configured', async () => {
    await act(async () => {
      root.render(<BlockEditor initialBlocks={PARAGRAPH_BLOCK} />)
    })

    expect(container.querySelector('style[data-blocura-editor-styles]')).toBeNull()
  })

  it('applies the chrome theme via data-theme on the shell', async () => {
    await act(async () => {
      root.render(<BlockEditor initialBlocks={PARAGRAPH_BLOCK} settings={{ theme: 'dark' }} />)
    })

    expect(container.querySelector('.editor-shell')?.getAttribute('data-theme')).toBe('dark')
  })

  it('defaults the chrome theme to light', async () => {
    await act(async () => {
      root.render(<BlockEditor initialBlocks={PARAGRAPH_BLOCK} />)
    })

    expect(container.querySelector('.editor-shell')?.getAttribute('data-theme')).toBe('light')
  })
})
