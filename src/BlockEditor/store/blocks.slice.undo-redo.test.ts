import { describe, expect, it, vi } from 'vitest'
import type { Block } from '../types'
import { createEditorStore } from './index'

describe('blocks slice undo/redo', () => {
  it('tracks insert and attribute updates through undo/redo history', () => {
    const store = createEditorStore()
    const paragraph: Block = {
      clientId: 'undo-1',
      name: 'core/paragraph',
      attributes: { content: 'Before', dropCap: false },
      innerBlocks: [],
    }

    store.getState().insertBlock(paragraph, null, 0)
    expect(store.getState().selectedClientIds).toEqual(['undo-1'])
    expect(store.getState().sidebarTab).toBe('block')
    store.getState().setSidebarTab('document')
    store.getState().selectBlock('undo-1')
    expect(store.getState().sidebarTab).toBe('block')

    store.getState().updateBlockAttributes('undo-1', { content: 'After' })

    expect(store.getState().blocks).toHaveLength(1)
    expect((store.getState().blocks[0].attributes as { content?: string }).content).toBe('After')
    expect(store.getState().canUndo).toBe(true)

    store.getState().undo()
    expect((store.getState().blocks[0].attributes as { content?: string }).content).toBe('Before')

    store.getState().undo()
    expect(store.getState().blocks).toHaveLength(0)
    expect(store.getState().canUndo).toBe(false)
    expect(store.getState().canRedo).toBe(true)

    store.getState().redo()
    expect(store.getState().blocks).toHaveLength(1)
    expect((store.getState().blocks[0].attributes as { content?: string }).content).toBe('Before')

    store.getState().redo()
    expect((store.getState().blocks[0].attributes as { content?: string }).content).toBe('After')
  })

  it('selects the cloned block after duplicate', () => {
    const store = createEditorStore()
    const paragraph: Block = {
      clientId: 'dup-source',
      name: 'core/paragraph',
      attributes: { content: 'Duplicate me', dropCap: false },
      innerBlocks: [],
    }

    store.getState().insertBlock(paragraph, null, 0)
    store.getState().duplicateBlock('dup-source')

    const state = store.getState()
    expect(state.blocks).toHaveLength(2)

    const cloneId = state.blocks.find((b) => b.clientId !== 'dup-source')?.clientId
    expect(cloneId).toBeDefined()
    expect(state.selectedClientIds).toEqual([cloneId as string])
    expect(state.sidebarTab).toBe('block')
  })

  it('coalesces rapid typing updates into one undo step', () => {
    const store = createEditorStore()
    const paragraph: Block = {
      clientId: 'typing-1',
      name: 'core/paragraph',
      attributes: { content: 'Start' },
      innerBlocks: [],
    }

    store.getState().insertBlock(paragraph, null, 0)

    const nowSpy = vi.spyOn(Date, 'now')
    nowSpy.mockReturnValue(1000)
    store.getState().updateBlockAttributes('typing-1', { content: 'A' })
    nowSpy.mockReturnValue(1200)
    store.getState().updateBlockAttributes('typing-1', { content: 'AB' })
    nowSpy.mockReturnValue(1400)
    store.getState().updateBlockAttributes('typing-1', { content: 'ABC' })

    expect((store.getState().blocks[0].attributes as { content?: string }).content).toBe('ABC')

    store.getState().undo()
    expect((store.getState().blocks[0].attributes as { content?: string }).content).toBe('Start')

    store.getState().redo()
    expect((store.getState().blocks[0].attributes as { content?: string }).content).toBe('ABC')

    nowSpy.mockRestore()
  })
})
