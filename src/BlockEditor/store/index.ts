import { createStore, useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { immer } from 'zustand/middleware/immer'
import { createContext, useContext, useMemo } from 'react'
import type { Block, PostSettings } from '../types'
import { createBlocksSlice, type BlocksSlice } from './slices/blocks.slice'
import { createSelectionSlice, type SelectionSlice } from './slices/selection.slice'
import { createUISlice, type UISlice } from './slices/ui.slice'
import { createNoticesSlice, type NoticesSlice } from './slices/notices.slice'
import { createPreferencesSlice, type PreferencesSlice } from './slices/preferences.slice'
import { createPostSettingsSlice, type PostSettingsSlice } from './slices/postSettings.slice'
import {
  createSyncedPatternsSlice,
  type SyncedPatternsSlice,
} from './slices/syncedPatterns.slice'
import { findBlock } from '../helpers/flattenBlocks'

export type EditorStore =
  BlocksSlice &
  SelectionSlice &
  UISlice &
  NoticesSlice &
  PreferencesSlice &
  PostSettingsSlice &
  SyncedPatternsSlice

export interface EditorStoreOptions {
  initialBlocks?: Block[]
  initialTitle?: string
  initialPostSettings?: Partial<PostSettings>
}

export function createEditorStore(options: EditorStoreOptions = {}) {
  const store = createStore<EditorStore>()(
    immer((set, get) => ({
      ...createBlocksSlice(
        set as Parameters<typeof createBlocksSlice>[0],
        get as Parameters<typeof createBlocksSlice>[1]
      ),
      ...createSelectionSlice(
        set as Parameters<typeof createSelectionSlice>[0],
        get as Parameters<typeof createSelectionSlice>[1]
      ),
      ...createUISlice(
        set as Parameters<typeof createUISlice>[0]
      ),
      ...createNoticesSlice(
        set as Parameters<typeof createNoticesSlice>[0]
      ),
      ...createPreferencesSlice(
        set as Parameters<typeof createPreferencesSlice>[0]
      ),
      ...createPostSettingsSlice(
        set as Parameters<typeof createPostSettingsSlice>[0],
        options.initialTitle ?? '',
        options.initialPostSettings ?? {}
      ),
      ...createSyncedPatternsSlice(
        set as Parameters<typeof createSyncedPatternsSlice>[0],
        get as Parameters<typeof createSyncedPatternsSlice>[1]
      ),
    }))
  )

  // Initialize with initial blocks if provided
  if (options.initialBlocks && options.initialBlocks.length > 0) {
    store.getState().resetBlocks(options.initialBlocks)
  }

  return store
}

export type EditorStoreInstance = ReturnType<typeof createEditorStore>

// React context for editor store
export const EditorStoreContext = createContext<EditorStoreInstance | null>(null)

function useEditorStoreInstance(): EditorStoreInstance {
  const store = useContext(EditorStoreContext)
  if (!store) {
    throw new Error('useEditorStore must be used within an EditorStoreProvider')
  }
  return store
}

export function useEditorStoreApi(): EditorStoreInstance {
  return useEditorStoreInstance()
}

// Subscribe to a slice of state. The selector must return a stable primitive or
// use useShallow at the call site for object selectors.
export function useEditorStore<T>(selector: (state: EditorStore) => T): T {
  const store = useEditorStoreInstance()
  return useStore(store, selector)
}

// ─── Stable convenience hooks ─────────────────────────────────────────────────

export function useBlocks() {
  return useEditorStore(s => s.blocks)
}

export function useSelectedClientIds() {
  return useEditorStore(s => s.selectedClientIds)
}

/**
 * Returns the single selected block, or null.
 * Uses a stable memoized selector to avoid re-render loops.
 */
export function useSelectedBlock(): Block | null {
  // We read blocks + selected ids separately; both are stable array references
  // after an Immer produce — so this is fine.
  const store = useEditorStoreInstance()
  return useStore(store, (s) => {
    const { selectedClientIds, blocks } = s
    if (selectedClientIds.length !== 1) return null
    return findBlock(blocks, selectedClientIds[0])
  })
}

/**
 * useEditorActions — returns stable action references from the store.
 *
 * Zustand action functions are created ONCE inside the store factory and
 * never change between renders. We read them directly from getState() to
 * avoid subscribing to state changes with a new-object selector (which
 * causes the "getSnapshot should be cached" infinite-loop).
 *
 * We still need to call this as a hook (for React rules), but we use
 * useMemo so the returned object is referentially stable across renders.
 */
export function useEditorActions() {
  const store = useEditorStoreInstance()

  // Actions are stable — reading from getState() is safe; they never change.
  // useMemo with [] gives us a stable object reference for the lifetime of
  // the component.
  return useMemo(() => {
    const s = store.getState()
    return {
      // Blocks
      insertBlock: s.insertBlock,
      insertBlocks: s.insertBlocks,
      updateBlockAttributes: s.updateBlockAttributes,
      updateBlockAttributesBatch: s.updateBlockAttributesBatch,
      removeBlock: s.removeBlock,
      removeBlocks: s.removeBlocks,
      moveBlockUp: s.moveBlockUp,
      moveBlockDown: s.moveBlockDown,
      moveBlockToPosition: s.moveBlockToPosition,
      duplicateBlock: s.duplicateBlock,
      replaceBlock: s.replaceBlock,
      replaceBlocks: s.replaceBlocks,
      mergeBlocks: s.mergeBlocks,
      resetBlocks: s.resetBlocks,
      undo: s.undo,
      redo: s.redo,
      // Selection
      selectBlock: s.selectBlock,
      multiSelectBlocks: s.multiSelectBlocks,
      addToSelection: s.addToSelection,
      removeFromSelection: s.removeFromSelection,
      clearSelection: s.clearSelection,
      selectAll: s.selectAll,
      setHoveredBlock: s.setHoveredBlock,
      setInsertionPoint: s.setInsertionPoint,
      setFocusedBlock: s.setFocusedBlock,
      setSelectionStart: s.setSelectionStart,
      setSelectionEnd: s.setSelectionEnd,
      // UI
      toggleSidebar: s.toggleSidebar,
      openSidebar: s.openSidebar,
      closeSidebar: s.closeSidebar,
      setSidebarTab: s.setSidebarTab,
      toggleListView: s.toggleListView,
      toggleInserter: s.toggleInserter,
      closeInserter: s.closeInserter,
      setCodeMode: s.setCodeMode,
      toggleCodeMode: s.toggleCodeMode,
      setPreviewDevice: s.setPreviewDevice,
      toggleFullscreen: s.toggleFullscreen,
      toggleDistractionFree: s.toggleDistractionFree,
      toggleSpotlightMode: s.toggleSpotlightMode,
      toggleZoomOut: s.toggleZoomOut,
      setIsDragging: s.setIsDragging,
      openCommandPalette: s.openCommandPalette,
      closeCommandPalette: s.closeCommandPalette,
      openKeyboardShortcuts: s.openKeyboardShortcuts,
      closeKeyboardShortcuts: s.closeKeyboardShortcuts,
      openPreferences: s.openPreferences,
      closePreferences: s.closePreferences,
      openAIAssistant: s.openAIAssistant,
      closeAIAssistant: s.closeAIAssistant,
      // Notices
      addNotice: s.addNotice,
      createSuccessNotice: s.createSuccessNotice,
      createErrorNotice: s.createErrorNotice,
      createWarningNotice: s.createWarningNotice,
      createInfoNotice: s.createInfoNotice,
      removeNotice: s.removeNotice,
      clearNotices: s.clearNotices,
      // Post settings
      setTitle: s.setTitle,
      updatePostSettings: s.updatePostSettings,
      // Synced patterns
      createSyncedPattern: s.createSyncedPattern,
      insertSyncedPattern: s.insertSyncedPattern,
      updateSyncedPattern: s.updateSyncedPattern,
      refreshSyncedPatternFromInstance: s.refreshSyncedPatternFromInstance,
      detachSyncedPattern: s.detachSyncedPattern,
      removeSyncedPattern: s.removeSyncedPattern,
      // Preferences
      setPreference: s.setPreference,
      togglePreference: s.togglePreference,
      resetPreferences: s.resetPreferences,
    }
  }, [store]) // store is stable (created once in BlockEditor)
}

// Re-export useShallow for components that return object selectors
export { useShallow }
