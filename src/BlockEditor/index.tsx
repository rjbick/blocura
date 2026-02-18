import { useMemo, useCallback, useEffect, useRef, useState } from 'react'
import type { BlockEditorProps, SavePayload } from './types'
import { createEditorStore, EditorStoreContext, useEditorStore } from './store'
import { useEditorActions } from './store'
import { registerCoreBlocks } from './registry/registerCoreBlocks'
import { EditorLayout } from './components/layout/EditorLayout'
import { EditorCanvas } from './components/layout/EditorCanvas'
import { TopToolbar } from './components/toolbar/TopToolbar'
import { Inserter } from './components/inserter/Inserter'
import { Sidebar } from './components/sidebar/Sidebar'
import { ListView } from './components/listview/ListView'
import { SnackbarList } from './components/ui/SnackbarList'
import { FormatToolbar } from './components/richtext/FormatToolbar'
import { CommandPalette } from './components/commandpalette/CommandPalette'
import { PreviewFrame } from './components/layout/PreviewFrame'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { BlockRegistry } from './registry/BlockRegistry'
import { blocksToBlockMarkup } from './helpers/blocksToBlockMarkup'
import { blocksToRawHtml } from './helpers/blocksToRawHtml'
import type { BlockDefinition } from './types'
import { EditorRuntimeContext } from './context'
import { InspectorControlsProvider } from './components/sidebar/InspectorControlsContext'

// Register core blocks once
registerCoreBlocks()

function EditorInner({
  onSave,
  onAutoSave,
  onChange,
  customBlocks = [],
  settings,
}: Omit<BlockEditorProps, 'initialBlocks' | 'initialTitle' | 'initialPostSettings'>) {
  const [isSaving, setIsSaving] = useState(false)
  const didMountRef = useRef(false)
  const blocks = useEditorStore(s => s.blocks)
  const title = useEditorStore(s => s.title)
  const postSettings = useEditorStore(s => s.postSettings)
  const { createSuccessNotice, createErrorNotice } = useEditorActions()

  // Register custom blocks
  useMemo(() => {
    for (const def of customBlocks) {
      if (!BlockRegistry.has(def.name)) {
        BlockRegistry.register(def as BlockDefinition)
      }
    }
  }, [customBlocks])

  const handleSave = useCallback(async () => {
    if (!onSave) return
    setIsSaving(true)
    try {
      const content = blocksToBlockMarkup(blocks)
      const rawHtml = blocksToRawHtml(blocks)
      const payload = {
        blocks,
        title,
        content,
        rawHtml,
        postSettings,
      } as SavePayload
      await onSave(payload)
      createSuccessNotice('Post updated.')
    } catch {
      createErrorNotice('Failed to save post.')
    } finally {
      setIsSaving(false)
    }
  }, [onSave, blocks, title, postSettings, createSuccessNotice, createErrorNotice])

  useEffect(() => {
    onChange?.(blocks)
  }, [blocks, onChange])

  useEffect(() => {
    if (!onAutoSave) return
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    const timer = window.setTimeout(() => {
      onAutoSave({
        blocks,
        title,
        content: blocksToBlockMarkup(blocks),
        rawHtml: blocksToRawHtml(blocks),
        postSettings,
      })
    }, 3000)
    return () => window.clearTimeout(timer)
  }, [blocks, title, postSettings, onAutoSave])

  useKeyboardShortcuts({ onSave: handleSave })

  return (
    <>
      <EditorLayout
        toolbar={<TopToolbar onSave={handleSave} isSaving={isSaving} />}
        inserter={<Inserter />}
        canvas={<EditorCanvas maxWidth={settings?.maxWidth ?? 620} />}
        sidebar={<Sidebar />}
        listView={<ListView />}
        snackbarList={<SnackbarList />}
      />
      <FormatToolbar />
      <CommandPalette />
      <PreviewFrame />
    </>
  )
}

export function BlockEditor({
  initialBlocks = [],
  initialTitle = '',
  initialPostSettings = {},
  customBlocks,
  settings,
  onSave,
  onAutoSave,
  onChange,
  className: _className,
  contentRef: _contentRef,
  onImageUpload,
  onSearchTerms,
  onSearchCategories,
  patterns,
}: BlockEditorProps) {
  const runtime = useMemo(
    () => ({
      onImageUpload,
      onSearchTerms,
      onSearchCategories,
      patterns: patterns ?? [],
    }),
    [onImageUpload, onSearchTerms, onSearchCategories, patterns]
  )

  // Create editor store instance (stable reference)
  const store = useMemo(
    () =>
      createEditorStore({
        initialBlocks,
        initialTitle,
        initialPostSettings,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Only create once
  )

  return (
    <EditorStoreContext.Provider value={store}>
      <EditorRuntimeContext.Provider value={runtime}>
        <InspectorControlsProvider>
          <EditorInner
            onSave={onSave}
            onAutoSave={onAutoSave}
            customBlocks={customBlocks}
            settings={settings}
            onChange={onChange}
          />
        </InspectorControlsProvider>
      </EditorRuntimeContext.Provider>
    </EditorStoreContext.Provider>
  )
}

export type { BlockEditorProps, SavePayload } from './types'
