import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import { createEditorStore, EditorStoreContext } from '../store'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

function ShortcutsHarness() {
  useKeyboardShortcuts()
  return null
}

async function pressEscape(): Promise<void> {
  await act(async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await Promise.resolve()
  })
}

describe('useKeyboardShortcuts Escape handling', () => {
  it('exits preview and editor modes before clearing selection', async () => {
    const store = createEditorStore()
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <EditorStoreContext.Provider value={store}>
          <ShortcutsHarness />
        </EditorStoreContext.Provider>
      )
    })

    await act(async () => {
      store.getState().setPreviewDevice('mobile')
    })
    expect(store.getState().previewDevice).toBe('mobile')
    await pressEscape()
    expect(store.getState().previewDevice).toBeNull()

    await act(async () => {
      store.getState().toggleZoomOut()
    })
    expect(store.getState().isZoomOut).toBe(true)
    await pressEscape()
    expect(store.getState().isZoomOut).toBe(false)

    await act(async () => {
      store.getState().toggleSpotlightMode()
    })
    expect(store.getState().isSpotlightMode).toBe(true)
    await pressEscape()
    expect(store.getState().isSpotlightMode).toBe(false)

    await act(async () => {
      store.getState().toggleDistractionFree()
    })
    expect(store.getState().isDistractionFree).toBe(true)
    await pressEscape()
    expect(store.getState().isDistractionFree).toBe(false)

    await act(async () => {
      store.getState().toggleFullscreen()
    })
    expect(store.getState().isFullscreen).toBe(true)
    await pressEscape()
    expect(store.getState().isFullscreen).toBe(false)

    await act(async () => {
      root.unmount()
    })
  })
})
