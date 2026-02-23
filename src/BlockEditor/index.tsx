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
import { collectImageAssets } from './helpers/collectImageAssets'
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
  const showListViewByDefault = useEditorStore(s => s.preferences.showListViewByDefault)
  const listViewOpen = useEditorStore(s => s.listViewOpen)
  const {
    createSuccessNotice,
    createErrorNotice,
    toggleListView,
  } = useEditorActions()
  const didApplyListViewDefaultRef = useRef(false)

  // Register custom blocks
  useMemo(() => {
    for (const def of customBlocks) {
      if (!BlockRegistry.has(def.name)) {
        BlockRegistry.register(def as BlockDefinition)
      }
    }
  }, [customBlocks])

  const buildPayload = useCallback((): SavePayload => {
    const rawHtml = blocksToRawHtml(blocks, {
      title,
      includeTitle: postSettings.includeTitleInContent,
    })
    return {
      blocks,
      title,
      content: blocksToBlockMarkup(blocks),
      rawHtml,
      postSettings,
      metadata: postSettings.meta,
      images: collectImageAssets(blocks, rawHtml),
      titleIncludedInContent: postSettings.includeTitleInContent,
    }
  }, [blocks, title, postSettings])

  const handleSave = useCallback(async () => {
    if (!onSave) return
    setIsSaving(true)
    try {
      const payload = buildPayload()
      await onSave(payload)
      createSuccessNotice('Post updated.')
    } catch {
      createErrorNotice('Failed to save post.')
    } finally {
      setIsSaving(false)
    }
  }, [onSave, buildPayload, createSuccessNotice, createErrorNotice])

  useEffect(() => {
    onChange?.(blocks)
  }, [blocks, onChange])

  useEffect(() => {
    if (didApplyListViewDefaultRef.current) return
    didApplyListViewDefaultRef.current = true
    if (showListViewByDefault && !listViewOpen) {
      toggleListView()
    }
  }, [listViewOpen, showListViewByDefault, toggleListView])

  useEffect(() => {
    if (!onAutoSave) return
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    const timer = window.setTimeout(() => {
      onAutoSave(buildPayload())
    }, 3000)
    return () => window.clearTimeout(timer)
  }, [buildPayload, onAutoSave])

  useKeyboardShortcuts({ onSave: handleSave })

  return (
    <>
      <EditorLayout
        toolbar={<TopToolbar onSave={handleSave} isSaving={isSaving} logoSrc={settings?.logo} />}
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

export type { BlockEditorProps, SavePayload, ImageAsset } from './types'
export { parseBlockMarkup } from './helpers/parseBlockMarkup'
export { parseHtmlToBlocks } from './helpers/parseHtmlToBlocks'
export { blocksToBlockMarkup } from './helpers/blocksToBlockMarkup'
export { blocksToRawHtml } from './helpers/blocksToRawHtml'
export { collectImageAssets } from './helpers/collectImageAssets'
