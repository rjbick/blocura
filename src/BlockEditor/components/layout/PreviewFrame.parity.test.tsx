import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import { createEditorStore, EditorStoreContext } from '../../store'
import { blocksToRawHtml } from '../../helpers/blocksToRawHtml'
import type { Block } from '../../types'
import { PreviewFrame } from './PreviewFrame'

function getDesktopPreviewFrame(container: HTMLElement): HTMLIFrameElement {
  const iframe = container.querySelector<HTMLIFrameElement>('iframe[title="Desktop preview"]')
  if (!iframe) {
    throw new Error('Desktop preview iframe was not rendered.')
  }

  return iframe
}

describe('Preview parity', () => {
  it('builds preview iframe markup from the same structured HTML as the editor serialization', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const initialBlocks: Block[] = [
      {
        clientId: 'cover-1',
        name: 'core/cover',
        attributes: {
          url: 'https://example.com/hero.jpg',
          minHeight: 320,
          dimRatio: 40,
        },
        innerBlocks: [
          {
            clientId: 'cols-1',
            name: 'core/columns',
            attributes: { isStackedOnMobile: true },
            innerBlocks: [
              {
                clientId: 'col-1',
                name: 'core/column',
                attributes: { width: '66.67%' },
                innerBlocks: [
                  {
                    clientId: 'p-1',
                    name: 'core/paragraph',
                    attributes: { content: 'Column one' },
                    innerBlocks: [],
                  },
                ],
              },
              {
                clientId: 'col-2',
                name: 'core/column',
                attributes: { width: '33.33%' },
                innerBlocks: [],
              },
            ],
          },
        ],
      },
    ]
    const store = createEditorStore({ initialBlocks })
    store.getState().setPreviewDevice('desktop')

    await act(async () => {
      root.render(
        <EditorStoreContext.Provider value={store}>
          <PreviewFrame />
        </EditorStoreContext.Provider>
      )
    })

    const expectedStructuredHtml = blocksToRawHtml(initialBlocks, {
      preserveInternalClasses: true,
    })

    const iframe = getDesktopPreviewFrame(container)
    const srcDoc = iframe.getAttribute('srcdoc') ?? iframe.srcdoc ?? ''

    expect(srcDoc).toContain(expectedStructuredHtml)
    expect(srcDoc).toContain('editor-block-cover')
    expect(srcDoc).toContain('editor-block-columns')
    expect(srcDoc).toContain('.editor-block-cover__inner-container')

    await act(async () => {
      root.unmount()
    })
  })

  it('uses onResolvePreviewAssetUrl to map runtime URLs for preview', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const initialBlocks: Block[] = [
      {
        clientId: 'image-1',
        name: 'core/image',
        attributes: {
          url: 'blob:http://localhost:5173/temp-image',
          alt: 'Runtime image',
        },
        innerBlocks: [],
      },
    ]
    const store = createEditorStore({ initialBlocks })
    store.getState().setPreviewDevice('desktop')

    await act(async () => {
      root.render(
        <EditorStoreContext.Provider value={store}>
          <PreviewFrame
            previewAssetUrlResolver={(url, context) => {
              if (context.tagName === 'img' && context.attribute === 'src' && url.startsWith('blob:')) {
                return 'https://cdn.example.com/media/runtime-image.jpg'
              }
              return url
            }}
          />
        </EditorStoreContext.Provider>
      )
    })

    const iframe = getDesktopPreviewFrame(container)
    const srcDoc = iframe.getAttribute('srcdoc') ?? iframe.srcdoc ?? ''

    expect(srcDoc).toContain('https://cdn.example.com/media/runtime-image.jpg')
    expect(srcDoc).not.toContain('blob:http://localhost:5173/temp-image')

    await act(async () => {
      root.unmount()
    })
  })
})
