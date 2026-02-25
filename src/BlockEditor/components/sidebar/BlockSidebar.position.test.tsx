import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import type { BlockDefinition } from '../../types'
import { BlockRegistry } from '../../registry/BlockRegistry'
import { createEditorStore, EditorStoreContext, useEditorStore } from '../../store'
import { InspectorControlsProvider } from './InspectorControlsContext'
import { BlockSidebar } from './BlockSidebar'

const stickyTestDefinition: BlockDefinition = {
  name: 'test/sticky-panel',
  title: 'Sticky Test',
  category: 'design',
  icon: 'S',
  supports: {
    position: { sticky: true },
  },
  attributes: {
    style: { type: 'object', default: {} },
  },
  edit: (() => null) as BlockDefinition['edit'],
  save: () => '<div></div>',
}

function SidebarHarness({ clientId }: { clientId: string }) {
  const block = useEditorStore((state) =>
    state.blocks.find((candidate) => candidate.clientId === clientId) ?? null
  )
  return <BlockSidebar block={block} />
}

function setInputValue(input: HTMLInputElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
  descriptor?.set?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('BlockSidebar Position panel', () => {
  it('toggles sticky position and updates top offset', async () => {
    BlockRegistry.register(stickyTestDefinition)

    const clientId = 'sticky-panel-1'
    const store = createEditorStore({
      initialBlocks: [
        {
          clientId,
          name: stickyTestDefinition.name,
          attributes: { style: {} },
          innerBlocks: [],
        },
      ],
    })

    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    try {
      await act(async () => {
        root.render(
          <EditorStoreContext.Provider value={store}>
            <InspectorControlsProvider>
              <SidebarHarness clientId={clientId} />
            </InspectorControlsProvider>
          </EditorStoreContext.Provider>
        )
      })

      const positionPanelToggle = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
        .find((button) => button.textContent?.trim() === 'Position')
      if (!positionPanelToggle) {
        throw new Error('Position panel toggle was not rendered.')
      }

      await act(async () => {
        positionPanelToggle.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        await Promise.resolve()
      })

      const stickyCheckbox = container.querySelector<HTMLInputElement>('input[type="checkbox"]')
      if (!stickyCheckbox) {
        throw new Error('Sticky toggle was not rendered.')
      }

      await act(async () => {
        stickyCheckbox.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        await Promise.resolve()
      })

      let positionStyle = (store.getState().blocks[0].attributes as {
        style?: { position?: { type?: string; top?: string } }
      }).style?.position
      expect(positionStyle).toEqual({ type: 'sticky', top: '0px' })

      const topOffsetInput = container.querySelector<HTMLInputElement>('input[placeholder="e.g. 0px"]')
      if (!topOffsetInput) {
        throw new Error('Top offset control was not rendered.')
      }

      await act(async () => {
        setInputValue(topOffsetInput, '12px')
        await Promise.resolve()
      })

      positionStyle = (store.getState().blocks[0].attributes as {
        style?: { position?: { type?: string; top?: string } }
      }).style?.position
      expect(positionStyle).toEqual({ type: 'sticky', top: '12px' })

      await act(async () => {
        stickyCheckbox.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        await Promise.resolve()
      })

      positionStyle = (store.getState().blocks[0].attributes as {
        style?: { position?: unknown }
      }).style?.position
      expect(positionStyle).toBeUndefined()
    } finally {
      await act(async () => {
        root.unmount()
      })
      BlockRegistry.unregister(stickyTestDefinition.name)
    }
  })
})
