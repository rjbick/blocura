import { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { ZoomOut } from 'lucide-react'
import { useEditorStore, useEditorActions, useBlocks, useEditorStoreApi } from '../../store'
import type { Block } from '../../types'
import { BlockList } from '../block/BlockList'
import { BlockFloatingToolbar } from '../block/BlockFloatingToolbar'
import { BlockMultiControls } from '../block/BlockMultiControls'
import { BlockAppender } from '../inserter/BlockAppender'
import { findBlock, flattenBlocks, findBlockParent, getBlockAncestors } from '../../helpers/flattenBlocks'
import { BlockRegistry } from '../../registry/BlockRegistry'
import { blocksToRawHtml } from '../../helpers/blocksToRawHtml'
import { parseHtmlToBlocks } from '../../helpers/parseHtmlToBlocks'
import { migrateLegacyHtmlClasses } from '../../helpers/migrateLegacyClasses'
import { CodeMirrorEditor } from '../ui/CodeMirrorEditor'

interface EditorCanvasProps {
  maxWidth?: number
}

export function EditorCanvas({ maxWidth }: EditorCanvasProps) {
  const isCodeMode = useEditorStore(s => s.isCodeMode)
  const isZoomOut = useEditorStore(s => s.isZoomOut)
  const zoomLevel = useEditorStore(s => s.zoomLevel)
  const selectedClientIds = useEditorStore(s => s.selectedClientIds)
  const showBlockBreadcrumb = useEditorStore(s => s.preferences.showBlockBreadcrumb)
  const fixedToolbar = useEditorStore(s => s.preferences.fixedToolbar)
  const isDistractionFree = useEditorStore(s => s.isDistractionFree)
  const { selectBlock, clearSelection, moveBlockToPosition, setIsDragging, toggleZoomOut } = useEditorActions()
  const store = useEditorStoreApi()
  const blocks = useBlocks()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleNavigateOut = useCallback(
    (clientId: string, direction: 'up' | 'down') => {
      const latestBlocks = store.getState().blocks
      const flat = flattenBlocks(latestBlocks)
      const index = flat.findIndex(b => b.clientId === clientId)
      const target = direction === 'down' ? flat[index + 1] : flat[index - 1]
      if (!target) return
      selectBlock(target.clientId, direction === 'down' ? -1 : 1)
    },
    [selectBlock, store]
  )

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === canvasRef.current || e.target === e.currentTarget) {
        clearSelection()
      }
    },
    [clearSelection]
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
    setIsDragging(true)
  }, [setIsDragging])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragId(null)
    setIsDragging(false)
    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId = over.id as string

    if (overId.startsWith('dropzone:')) {
      const rawRoot = overId.slice('dropzone:'.length)
      const toRoot = rawRoot === '__root__' ? null : rawRoot
      if (toRoot && !findBlock(blocks, toRoot)) return
      const destinationSiblings = toRoot ? (findBlock(blocks, toRoot)?.innerBlocks ?? []) : blocks
      moveBlockToPosition(
        activeId,
        findBlockParent(blocks, activeId)?.clientId ?? null,
        toRoot,
        destinationSiblings.length
      )
      return
    }

    const fromParent = findBlockParent(blocks, activeId)
    const toParent = findBlockParent(blocks, overId)
    const destinationSiblings = toParent ? toParent.innerBlocks : blocks
    const toIdx = destinationSiblings.findIndex((b) => b.clientId === overId)
    if (toIdx === -1) return

    moveBlockToPosition(
      activeId,
      fromParent?.clientId ?? null,
      toParent?.clientId ?? null,
      toIdx
    )
  }, [blocks, moveBlockToPosition, setIsDragging])

  const activeBlock = activeDragId ? blocks.find(b => b.clientId === activeDragId) : null
  const activeDef = activeBlock ? BlockRegistry.get(activeBlock.name) : null
  const selectedBlockForFixedToolbar = useMemo(() => {
    if (!fixedToolbar || selectedClientIds.length !== 1) return null
    return findBlock(blocks, selectedClientIds[0])
  }, [blocks, fixedToolbar, selectedClientIds])
  const selectedDefForFixedToolbar = selectedBlockForFixedToolbar
    ? BlockRegistry.get(selectedBlockForFixedToolbar.name)
    : null
  const breadcrumbPath = useMemo(() => {
    if (!showBlockBreadcrumb || selectedClientIds.length !== 1) return []
    const selectedId = selectedClientIds[0]
    const selectedBlock = findBlock(blocks, selectedId)
    if (!selectedBlock) return []
    const ancestors = getBlockAncestors(blocks, selectedId)
    return [...ancestors, selectedBlock]
      .map((block) => BlockRegistry.get(block.name)?.title ?? block.name)
      .slice(-5)
  }, [blocks, selectedClientIds, showBlockBreadcrumb])

  if (isCodeMode) {
    return <CodeEditorView blocks={blocks} />
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Zoom-out exit banner */}
      {isZoomOut && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            backgroundColor: '#1e1e1e',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '8px 16px',
            fontSize: 13,
            fontFamily: 'var(--editor-font-family)',
          }}
        >
          <ZoomOut size={14} />
          <span>Zoom out</span>
          <button
            type="button"
            onClick={toggleZoomOut}
            style={{
              marginLeft: 8,
              padding: '2px 10px',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 2,
              background: 'transparent',
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'var(--editor-font-family)',
            }}
          >
            Exit
          </button>
        </div>
      )}

      {fixedToolbar && selectedBlockForFixedToolbar && selectedDefForFixedToolbar && (
        <BlockFloatingToolbar
          block={selectedBlockForFixedToolbar}
          def={selectedDefForFixedToolbar}
          variant="fixed"
          topOffset={isDistractionFree ? 12 : 64}
        />
      )}

      <BlockMultiControls />

      <div
        style={{
          minHeight: '100%',
          backgroundColor: 'var(--editor-editor-bg)',
          padding: '40px 24px 200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        onClick={handleCanvasClick}
      >
        <div
          ref={canvasRef}
          style={{
            width: '100%',
            maxWidth: maxWidth ?? '100%',
            backgroundColor: 'var(--editor-canvas-bg)',
            boxShadow: 'var(--editor-canvas-shadow)',
            borderRadius: 2,
            minHeight: 400,
            padding: '48px 56px 80px 80px',
            transform: isZoomOut ? `scale(${zoomLevel})` : 'scale(1)',
            transformOrigin: 'top center',
            transition: 'transform 0.3s ease',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <PostTitleArea />

          <BlockList
            blocks={blocks}
            rootClientId={null}
            onNavigateOut={handleNavigateOut}
          />

          <BlockAppender rootClientId={null} />
        </div>
      </div>

      {breadcrumbPath.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 'min(900px, calc(100% - 48px))',
            backgroundColor: 'var(--editor-breadcrumb-bg)',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: 2,
            height: 'var(--editor-breadcrumb-height)',
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0 10px',
            fontSize: 'var(--editor-breadcrumb-font-size)',
            fontFamily: 'var(--editor-font-family)',
            color: '#1e1e1e',
            gap: 6,
            zIndex: 90,
            backdropFilter: 'blur(2px)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
          }}
          aria-label="Block breadcrumb"
        >
          {breadcrumbPath.map((label, index) => (
            <span
              key={`${label}-${index}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                minWidth: 0,
                maxWidth: 180,
              }}
            >
              {index > 0 && (
                <span aria-hidden style={{ color: '#757575' }}>
                  /
                </span>
              )}
              <span
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontWeight: index === breadcrumbPath.length - 1 ? 600 : 400,
                }}
              >
                {label}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Drag ghost */}
      <DragOverlay>
        {activeBlock && activeDef && (
          <div
            style={{
              backgroundColor: '#fff',
              boxShadow: 'var(--editor-elevation-z4)',
              borderRadius: 2,
              padding: '12px 16px',
              fontSize: 13,
              fontFamily: 'var(--editor-font-family)',
              color: '#1e1e1e',
              opacity: 0.9,
              maxWidth: 400,
              transform: 'scale(0.95)',
              cursor: 'grabbing',
            }}
          >
            <span style={{ fontWeight: 500 }}>{activeDef.title}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

function PostTitleArea() {
  const title = useEditorStore(s => s.title)
  const includeTitleInContent = useEditorStore(s => s.postSettings.includeTitleInContent)
  const { setTitle } = useEditorActions()

  if (!includeTitleInContent) return null

  return (
    <div style={{ marginBottom: 32 }}>
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add title"
        rows={1}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          resize: 'none',
          fontSize: 40,
          fontWeight: 700,
          lineHeight: 1.3,
          fontFamily: 'var(--editor-font-family)',
          color: '#1e1e1e',
          padding: 0,
          background: 'transparent',
          overflow: 'hidden',
        }}
        onInput={(e) => {
          const el = e.currentTarget
          el.style.height = 'auto'
          el.style.height = el.scrollHeight + 'px'
        }}
      />
    </div>
  )
}

// ─── Code Editor View ─────────────────────────────────────────────────────────

function CodeEditorView({ blocks }: { blocks: Block[] }) {
  const { resetBlocks } = useEditorActions()
  const [markup, setMarkup] = useState(() => blocksToRawHtml(blocks))
  const [error, setError] = useState<string | null>(null)

  // Keep markup in sync when blocks change externally (e.g. undo)
  const markupFromBlocks = blocksToRawHtml(blocks)
  useEffect(() => {
    setMarkup(markupFromBlocks)
    setError(null)
  }, [markupFromBlocks])

  const handleApply = useCallback(() => {
    try {
      const migrated = migrateLegacyHtmlClasses(markup)
      const parsed = parseHtmlToBlocks(migrated.value)
      resetBlocks(parsed)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Parse error')
    }
  }, [markup, resetBlocks])

  return (
    <div
      style={{
        minHeight: '100%',
        backgroundColor: '#1e1e1e',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Code editor header */}
      <div
        style={{
          backgroundColor: '#2c2c2c',
          borderBottom: '1px solid #444',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontFamily: 'var(--editor-font-family)',
            color: '#a0a0a0',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
          }}
        >
          Raw HTML
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {error && (
            <span style={{ fontSize: 11, color: '#f87171', fontFamily: 'var(--editor-font-family)' }}>
              {error}
            </span>
          )}
          <button
            type="button"
            onClick={handleApply}
            style={{
              height: 28,
              paddingInline: 12,
              backgroundColor: '#3858e9',
              color: '#fff',
              border: 'none',
              borderRadius: 2,
              fontSize: 12,
              fontFamily: 'var(--editor-font-family)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            >
            Apply
          </button>
        </div>
      </div>

      <CodeMirrorEditor
        value={markup}
        onChange={(nextValue) => {
          setMarkup(nextValue)
          setError(null)
        }}
        onBlur={handleApply}
        language="html"
        className="editor-code-mirror"
        style={{
          flex: 1,
          width: '100%',
          minHeight: 400,
          backgroundColor: 'transparent',
          color: '#d4d4d4',
        }}
      />
    </div>
  )
}
