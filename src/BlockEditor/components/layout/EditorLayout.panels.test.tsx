import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import { createEditorStore, EditorStoreContext } from '../../store'
import { EditorLayout } from './EditorLayout'

function LayoutHarness() {
  return (
    <EditorLayout
      toolbar={<div data-testid="toolbar-content">Toolbar</div>}
      inserter={<div data-testid="inserter-content">Inserter</div>}
      canvas={<div data-testid="canvas-content">Canvas</div>}
      sidebar={<div data-testid="sidebar-content">Sidebar</div>}
      listView={<div data-testid="listview-content">List View</div>}
      snackbarList={<div data-testid="snackbar-content">Snackbar</div>}
    />
  )
}

describe('EditorLayout panel offsets', () => {
  it('updates canvas offset as inserter/list view panels open and close', async () => {
    const store = createEditorStore()
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <EditorStoreContext.Provider value={store}>
          <LayoutHarness />
        </EditorStoreContext.Provider>
      )
    })

    const canvasWrapper = container.querySelector('[data-testid="canvas-content"]')?.parentElement
    if (!canvasWrapper) throw new Error('Canvas wrapper was not rendered.')

    expect((canvasWrapper as HTMLElement).style.marginLeft).toBe('0px')

    await act(async () => {
      store.getState().toggleInserter()
      await Promise.resolve()
    })
    expect((canvasWrapper as HTMLElement).style.marginLeft).toBe('280px')

    await act(async () => {
      store.getState().toggleListView()
      await Promise.resolve()
    })
    expect((canvasWrapper as HTMLElement).style.marginLeft).toBe('560px')

    await act(async () => {
      store.getState().toggleInserter()
      await Promise.resolve()
    })
    expect((canvasWrapper as HTMLElement).style.marginLeft).toBe('280px')

    await act(async () => {
      root.unmount()
    })
  })

  it('positions list view panel next to inserter when both are open', async () => {
    const store = createEditorStore()
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <EditorStoreContext.Provider value={store}>
          <LayoutHarness />
        </EditorStoreContext.Provider>
      )
    })

    await act(async () => {
      store.getState().toggleInserter()
      store.getState().toggleListView()
      await Promise.resolve()
    })

    let listViewPanel = container.querySelector('[data-testid="listview-content"]')?.parentElement
    if (!listViewPanel) throw new Error('List view panel was not rendered.')
    expect((listViewPanel as HTMLElement).style.left).toBe('280px')

    await act(async () => {
      store.getState().toggleInserter()
      await Promise.resolve()
    })

    listViewPanel = container.querySelector('[data-testid="listview-content"]')?.parentElement
    if (!listViewPanel) throw new Error('List view panel was not rendered after closing inserter.')
    expect((listViewPanel as HTMLElement).style.left).toBe('0px')

    await act(async () => {
      root.unmount()
    })
  })
})
