import { useMemo, useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react'
import type {
  Block,
  BlockDefinition,
  BlockEditorProps,
  EditorSettings,
  PostSettings,
  SavePayload,
} from './types'
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
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { BlockRegistry } from './registry/BlockRegistry'
import { blocksToRawHtml } from './helpers/blocksToRawHtml'
import { collectImageAssets } from './helpers/collectImageAssets'
import { extractTailwindSafelist } from './helpers/extractTailwindSafelist'
import { parseHtmlToBlocks } from './helpers/parseHtmlToBlocks'
import { parseBlocksJson } from './helpers/parseBlocksJson'
import { migrateLegacyBlockClasses, migrateLegacyHtmlClasses } from './helpers/migrateLegacyClasses'
import { EditorRuntimeContext } from './context'
import { InspectorControlsProvider } from './components/sidebar/InspectorControlsContext'
import { LinkDialogProvider } from './components/link/LinkDialogContext'

const FormatToolbar = lazy(async () => {
  const mod = await import('./components/richtext/FormatToolbar')
  return { default: mod.FormatToolbar }
})

const CommandPalette = lazy(async () => {
  const mod = await import('./components/commandpalette/CommandPalette')
  return { default: mod.CommandPalette }
})

const PreviewFrame = lazy(async () => {
  const mod = await import('./components/layout/PreviewFrame')
  return { default: mod.PreviewFrame }
})

const AIAssistantPanel = lazy(async () => {
  const mod = await import('./components/ai/AIAssistantPanel')
  return { default: mod.AIAssistantPanel }
})

// Register core blocks once
registerCoreBlocks()

function resolveInitialBlocks(
  initialBlocks: BlockEditorProps['initialBlocks'],
  initialBlocksJson: BlockEditorProps['initialBlocksJson'],
  initialRawHtml: BlockEditorProps['initialRawHtml']
): Block[] {
  if (initialBlocksJson !== undefined) {
    const parsed = parseBlocksJson(initialBlocksJson)
    return migrateLegacyBlockClasses(parsed).value
  }

  if (initialBlocks !== undefined) {
    const parsed = parseBlocksJson(initialBlocks)
    return migrateLegacyBlockClasses(parsed).value
  }

  if (typeof initialRawHtml === 'string' && initialRawHtml.trim()) {
    try {
      const migrated = migrateLegacyHtmlClasses(initialRawHtml)
      return parseHtmlToBlocks(migrated.value)
    } catch {
      return []
    }
  }

  return []
}

function isBodyContentMode(settings?: Partial<EditorSettings>): boolean {
  return settings?.contentMode === 'body'
}

function resolveIncludeTitleInContent(
  includeTitleInContent: boolean,
  settings?: Partial<EditorSettings>
): boolean {
  return isBodyContentMode(settings) ? false : includeTitleInContent
}

function resolveInitialPostSettings(
  initialPostSettings: Partial<PostSettings>,
  settings?: Partial<EditorSettings>
): Partial<PostSettings> {
  if (!isBodyContentMode(settings)) {
    return initialPostSettings
  }

  return {
    ...initialPostSettings,
    includeTitleInContent: false,
  }
}

function EditorInner({
  onSave,
  onAutoSave,
  onChange,
  customBlocks = [],
  settings,
  onResolvePreviewAssetUrl,
}: Omit<
  BlockEditorProps,
  'initialBlocks' | 'initialBlocksJson' | 'initialRawHtml' | 'initialTitle' | 'initialPostSettings'
>) {
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
    const includeTitleInContent = resolveIncludeTitleInContent(
      postSettings.includeTitleInContent,
      settings
    )
    const resolvedPostSettings =
      includeTitleInContent === postSettings.includeTitleInContent
        ? postSettings
        : { ...postSettings, includeTitleInContent }

    const rawHtml = blocksToRawHtml(blocks, {
      title,
      includeTitle: includeTitleInContent,
    })
    return {
      blocks,
      blocksJson: JSON.stringify(blocks),
      title,
      rawHtml,
      postSettings: resolvedPostSettings,
      metadata: resolvedPostSettings.meta,
      images: collectImageAssets(blocks, rawHtml),
      tailwindSafelist: extractTailwindSafelist(blocks),
      titleIncludedInContent: includeTitleInContent,
    }
  }, [blocks, postSettings, settings, title])

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
        toolbar={
          <TopToolbar
            onSave={handleSave}
            isSaving={isSaving}
            logoSrc={settings?.logo}
            previewSettings={settings?.preview}
            previewAssetUrlResolver={onResolvePreviewAssetUrl}
          />
        }
        inserter={<Inserter />}
        canvas={<EditorCanvas maxWidth={settings?.maxWidth} />}
        sidebar={<Sidebar settings={settings} />}
        listView={<ListView />}
        snackbarList={<SnackbarList />}
      />
      <Suspense fallback={null}>
        <FormatToolbar />
        <CommandPalette />
        <AIAssistantPanel />
        <PreviewFrame
          previewSettings={settings?.preview}
          previewAssetUrlResolver={onResolvePreviewAssetUrl}
        />
      </Suspense>
    </>
  )
}

export function BlockEditor({
  initialBlocks,
  initialBlocksJson,
  initialRawHtml,
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
  onSearchPages,
  onFetchLatestPosts,
  onFetchLatestComments,
  onFetchRssFeed,
  onPromptAI,
  onResolvePreviewAssetUrl,
  patterns,
}: BlockEditorProps) {
  const resolvedInitialBlocks = useMemo(
    () => resolveInitialBlocks(initialBlocks, initialBlocksJson, initialRawHtml),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const resolvedInitialPostSettings = useMemo(
    () => resolveInitialPostSettings(initialPostSettings, settings),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const runtime = useMemo(
    () => ({
      onImageUpload,
      onSearchTerms,
      onSearchCategories,
      onSearchPages,
      onFetchLatestPosts,
      onFetchLatestComments,
      onFetchRssFeed,
      onPromptAI,
      patterns: patterns ?? [],
    }),
    [
      onImageUpload,
      onSearchTerms,
      onSearchCategories,
      onSearchPages,
      onFetchLatestPosts,
      onFetchLatestComments,
      onFetchRssFeed,
      onPromptAI,
      patterns,
    ]
  )

  // Create editor store instance (stable reference)
  const store = useMemo(
    () =>
      createEditorStore({
        initialBlocks: resolvedInitialBlocks,
        initialTitle,
        initialPostSettings: resolvedInitialPostSettings,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Only create once
  )

  return (
    <div className="editor-shell" style={{ width: '100%', height: '100%' }}>
      <EditorStoreContext.Provider value={store}>
        <EditorRuntimeContext.Provider value={runtime}>
          <LinkDialogProvider>
            <InspectorControlsProvider>
              <EditorInner
                onSave={onSave}
                onAutoSave={onAutoSave}
                customBlocks={customBlocks}
                settings={settings}
                onChange={onChange}
                onResolvePreviewAssetUrl={onResolvePreviewAssetUrl}
              />
            </InspectorControlsProvider>
          </LinkDialogProvider>
        </EditorRuntimeContext.Provider>
      </EditorStoreContext.Provider>
    </div>
  )
}

export type {
  BlockEditorProps,
  AiAssistantContext,
  AiAssistantRequest,
  AiAssistantResponse,
  SavePayload,
  ImageAsset,
  PreviewAssetUrlContext,
  LinkablePage,
  SearchPagesOptions,
  SearchPagesResponse,
  SearchPagesResult,
} from './types'
export { parseHtmlToBlocks } from './helpers/parseHtmlToBlocks'
export { blocksToRawHtml } from './helpers/blocksToRawHtml'
export { collectImageAssets } from './helpers/collectImageAssets'
export { extractTailwindSafelist } from './helpers/extractTailwindSafelist'
export { migrateLegacyHtmlClasses, migrateLegacyBlockClasses } from './helpers/migrateLegacyClasses'
