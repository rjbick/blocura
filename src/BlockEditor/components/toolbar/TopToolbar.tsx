import {
  Plus,
  Undo2,
  Redo2,
  List,
  PanelRight,
  Sparkles,
} from 'lucide-react'
import { useEditorStore, useEditorActions } from '../../store'
import { useEditorRuntime } from '../../context'
import { ToolbarButton } from './ToolbarButton'
import { ViewModeToggle } from './ViewModeToggle'
import { SaveButton } from './SaveButton'
import { DocumentTitle } from './DocumentTitle'
import { MoreMenu } from './MoreMenu'
import { PreviewDropdown } from './PreviewDropdown'
import type { EditorSettings, PreviewAssetUrlContext } from '../../types'

interface TopToolbarProps {
  onSave?: () => void | Promise<void>
  isSaving?: boolean
  logoSrc?: string
  previewSettings?: EditorSettings['preview']
  previewAssetUrlResolver?: (
    url: string,
    context: PreviewAssetUrlContext
  ) => string | null | undefined
}

export function TopToolbar({
  onSave,
  isSaving,
  logoSrc,
  previewSettings,
  previewAssetUrlResolver,
}: TopToolbarProps) {
  const canUndo = useEditorStore(s => s.canUndo)
  const canRedo = useEditorStore(s => s.canRedo)
  const inserterOpen = useEditorStore(s => s.inserterOpen)
  const listViewOpen = useEditorStore(s => s.listViewOpen)
  const isCodeMode = useEditorStore(s => s.isCodeMode)
  const sidebarOpen = useEditorStore(s => s.sidebarOpen)
  const showIconLabels = useEditorStore(s => s.preferences.showIconLabels)
  const { onPromptAI } = useEditorRuntime()

  const {
    undo,
    redo,
    toggleInserter,
    toggleListView,
    toggleSidebar,
    setCodeMode,
    openAIAssistant,
  } = useEditorActions()

  return (
    <header
      role="region"
      aria-label="Editor top bar"
      style={{
        height: 'var(--editor-toolbar-height)',
        backgroundColor: 'var(--editor-toolbar-bg)',
        borderBottom: 'var(--editor-toolbar-border)',
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        userSelect: 'none',
      }}
    >
      {/* LEFT GROUP */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 8,
          gap: 4,
          flexShrink: 0,
        }}
      >
        {logoSrc && (
          <button
            type="button"
            aria-label="Site logo"
            style={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              backgroundColor: '#fff',
              border: '1px solid rgba(0,0,0,0.08)',
              padding: 0,
            }}
          >
            <img
              src={logoSrc}
              alt="Site logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </button>
        )}

        {/* Inserter toggle */}
        <ToolbarButton
          icon={<Plus size={24} />}
          label={showIconLabels ? 'Add' : undefined}
          tooltip="Toggle block inserter"
          shortcut="⇧⌘K"
          isActive={inserterOpen}
          onClick={toggleInserter}
        />

        {/* Undo */}
        <ToolbarButton
          icon={<Undo2 size={24} />}
          label={showIconLabels ? 'Undo' : undefined}
          tooltip="Undo"
          shortcut="Ctrl+Z"
          isDisabled={!canUndo}
          onClick={undo}
        />

        {/* Redo */}
        <ToolbarButton
          icon={<Redo2 size={24} />}
          label={showIconLabels ? 'Redo' : undefined}
          tooltip="Redo"
          shortcut="Ctrl+Shift+Z"
          isDisabled={!canRedo}
          onClick={redo}
        />

        {/* Separator */}
        <div
          aria-hidden
          style={{
            width: 1,
            height: 24,
            backgroundColor: 'rgba(0,0,0,0.1)',
            margin: '0 4px',
          }}
        />

        {/* View mode toggle */}
        <ViewModeToggle
          isCodeMode={isCodeMode}
          onChange={(mode) => setCodeMode(mode === 'code')}
        />

        {/* List View toggle */}
        <ToolbarButton
          icon={<List size={24} />}
          label={showIconLabels ? 'List' : undefined}
          tooltip="List View"
          shortcut="Ctrl+Shift+J"
          isActive={listViewOpen}
          onClick={toggleListView}
        />
      </div>

      {/* CENTER */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          padding: '0 16px',
        }}
      >
        <DocumentTitle />
      </div>

      {/* RIGHT GROUP */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          paddingRight: 8,
          gap: 4,
          flexShrink: 0,
        }}
      >
        {onPromptAI && (
          <ToolbarButton
            icon={<Sparkles size={20} />}
            label={showIconLabels ? 'AI' : undefined}
            tooltip="Ask AI"
            onClick={openAIAssistant}
          />
        )}

        {/* Preview dropdown */}
        <PreviewDropdown
          previewSettings={previewSettings}
          previewAssetUrlResolver={previewAssetUrlResolver}
        />

        {/* Save button */}
        <SaveButton onSave={onSave} isSaving={isSaving} />

        {/* Separator */}
        <div
          aria-hidden
          style={{
            width: 1,
            height: 24,
            backgroundColor: 'rgba(0,0,0,0.1)',
            margin: '0 4px',
          }}
        />

        {/* Settings toggle */}
        <ToolbarButton
          icon={<PanelRight size={24} />}
          label={showIconLabels ? 'Settings' : undefined}
          tooltip="Settings"
          shortcut="Ctrl+,"
          isActive={sidebarOpen}
          onClick={toggleSidebar}
        />

        {/* More menu */}
        <MoreMenu />
      </div>
    </header>
  )
}
