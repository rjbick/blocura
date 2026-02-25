import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import type { Block } from '../../types'
import { createEditorStore, EditorStoreContext } from '../../store'
import { ListView } from './ListView'

function ListViewHarness() {
  return <ListView />
}

function keydown(target: HTMLElement, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
}

describe('ListView keyboard accessibility', () => {
  it('renders focusable treeitems with sibling ARIA metadata', async () => {
    const blocks: Block[] = [
      {
        clientId: 'group-1',
        name: 'core/group',
        attributes: {},
        innerBlocks: [
          {
            clientId: 'paragraph-1',
            name: 'core/paragraph',
            attributes: { content: 'Child paragraph' },
            innerBlocks: [],
          },
          {
            clientId: 'heading-1',
            name: 'core/heading',
            attributes: { content: 'Child heading', level: 2 },
            innerBlocks: [],
          },
        ],
      },
      {
        clientId: 'paragraph-2',
        name: 'core/paragraph',
        attributes: { content: 'Second root paragraph' },
        innerBlocks: [],
      },
    ]
    const store = createEditorStore({ initialBlocks: blocks })
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <EditorStoreContext.Provider value={store}>
          <ListViewHarness />
        </EditorStoreContext.Provider>
      )
    })

    const rootItem = container.querySelector<HTMLElement>('[data-listview-item-id="group-1"]')
    if (!rootItem) throw new Error('Root treeitem was not rendered.')
    expect(rootItem.tabIndex).toBe(0)
    expect(rootItem.getAttribute('aria-level')).toBe('1')
    expect(rootItem.getAttribute('aria-setsize')).toBe('2')
    expect(rootItem.getAttribute('aria-posinset')).toBe('1')

    const childItem = container.querySelector<HTMLElement>('[data-listview-item-id="paragraph-1"]')
    if (!childItem) throw new Error('Child treeitem was not rendered.')
    expect(childItem.getAttribute('aria-level')).toBe('2')
    expect(childItem.getAttribute('aria-setsize')).toBe('2')
    expect(childItem.getAttribute('aria-posinset')).toBe('1')

    await act(async () => {
      root.unmount()
    })
  })

  it('supports arrow-key navigation and expand/collapse behavior', async () => {
    const blocks: Block[] = [
      {
        clientId: 'group-1',
        name: 'core/group',
        attributes: {},
        innerBlocks: [
          {
            clientId: 'paragraph-1',
            name: 'core/paragraph',
            attributes: { content: 'Child paragraph' },
            innerBlocks: [],
          },
          {
            clientId: 'heading-1',
            name: 'core/heading',
            attributes: { content: 'Child heading', level: 2 },
            innerBlocks: [],
          },
        ],
      },
      {
        clientId: 'paragraph-2',
        name: 'core/paragraph',
        attributes: { content: 'Second root paragraph' },
        innerBlocks: [],
      },
    ]
    const store = createEditorStore({ initialBlocks: blocks })
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <EditorStoreContext.Provider value={store}>
          <ListViewHarness />
        </EditorStoreContext.Provider>
      )
    })

    const groupItem = container.querySelector<HTMLElement>('[data-listview-item-id="group-1"]')
    if (!groupItem) throw new Error('Group treeitem was not rendered.')

    await act(async () => {
      groupItem.focus()
      keydown(groupItem, 'ArrowDown')
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(store.getState().selectedClientIds).toEqual(['paragraph-1'])
    const childItem = container.querySelector<HTMLElement>('[data-listview-item-id="paragraph-1"]')
    expect(document.activeElement).toBe(childItem)

    await act(async () => {
      keydown(childItem as HTMLElement, 'ArrowLeft')
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(store.getState().selectedClientIds).toEqual(['group-1'])

    const groupItemAfterMove = container.querySelector<HTMLElement>('[data-listview-item-id="group-1"]')
    if (!groupItemAfterMove) throw new Error('Group treeitem was not rendered after moving to parent.')

    await act(async () => {
      keydown(groupItemAfterMove, 'ArrowLeft')
      await Promise.resolve()
    })
    expect(container.querySelector('[data-listview-item-id="paragraph-1"]')).toBeNull()

    await act(async () => {
      keydown(groupItemAfterMove, 'ArrowRight')
      await Promise.resolve()
    })
    expect(container.querySelector('[data-listview-item-id="paragraph-1"]')).not.toBeNull()

    await act(async () => {
      keydown(groupItemAfterMove, 'ArrowRight')
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(store.getState().selectedClientIds).toEqual(['paragraph-1'])

    await act(async () => {
      root.unmount()
    })
  })
})
