import { useRef, useCallback, useState, useEffect } from 'react'
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
import { useEditorStore, useEditorActions, useBlocks } from '../../store'
import type { Block } from '../../types'
import { BlockList } from '../block/BlockList'
import { BlockAppender } from '../inserter/BlockAppender'
import { findBlock, flattenBlocks, findBlockParent } from '../../helpers/flattenBlocks'
import { BlockRegistry } from '../../registry/BlockRegistry'
import { blocksToBlockMarkup } from '../../helpers/blocksToBlockMarkup'
import { parseBlockMarkup } from '../../helpers/parseBlockMarkup'

interface EditorCanvasProps {
  maxWidth?: number
}

export function EditorCanvas({ maxWidth = 620 }: EditorCanvasProps) {
  const isCodeMode = useEditorStore(s => s.isCodeMode)
  const isZoomOut = useEditorStore(s => s.isZoomOut)
  const zoomLevel = useEditorStore(s => s.zoomLevel)
  const { selectBlock, clearSelection, moveBlockToPosition, setIsDragging, toggleZoomOut } = useEditorActions()
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
      const flat = flattenBlocks(blocks)
      const index = flat.findIndex(b => b.clientId === clientId)
      const target = direction === 'down' ? flat[index + 1] : flat[index - 1]
      if (!target) return
      selectBlock(target.clientId, direction === 'down' ? -1 : 1)
    },
    [blocks, selectBlock]
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
            fontFamily: 'var(--wp-font-family)',
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
              fontFamily: 'var(--wp-font-family)',
            }}
          >
            Exit
          </button>
        </div>
      )}
      <div
        style={{
          minHeight: '100%',
          backgroundColor: 'var(--wp-editor-bg)',
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
            maxWidth,
            backgroundColor: 'var(--wp-canvas-bg)',
            boxShadow: 'var(--wp-canvas-shadow)',
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

      {/* Drag ghost */}
      <DragOverlay>
        {activeBlock && activeDef && (
          <div
            style={{
              backgroundColor: '#fff',
              boxShadow: 'var(--wp-elevation-z4)',
              borderRadius: 2,
              padding: '12px 16px',
              fontSize: 13,
              fontFamily: 'var(--wp-font-family)',
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
  const { setTitle } = useEditorActions()

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
          fontFamily: 'var(--wp-font-family)',
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
  const [markup, setMarkup] = useState(() => blocksToBlockMarkup(blocks))
  const [error, setError] = useState<string | null>(null)

  // Keep markup in sync when blocks change externally (e.g. undo)
  const markupFromBlocks = blocksToBlockMarkup(blocks)
  useEffect(() => {
    setMarkup(markupFromBlocks)
    setError(null)
  // Only sync if the serialized form differs from what we have
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markupFromBlocks])

  const handleApply = useCallback(() => {
    try {
      const parsed = parseBlockMarkup(markup)
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
            fontFamily: 'var(--wp-font-family)',
            color: '#a0a0a0',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 600,
          }}
        >
          Block Markup
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {error && (
            <span style={{ fontSize: 11, color: '#f87171', fontFamily: 'var(--wp-font-family)' }}>
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
              fontFamily: 'var(--wp-font-family)',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Apply
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={markup}
        onChange={(e) => {
          setMarkup(e.target.value)
          setError(null)
        }}
        onBlur={handleApply}
        spellCheck={false}
        style={{
          flex: 1,
          width: '100%',
          padding: '20px 24px',
          backgroundColor: 'transparent',
          color: '#d4d4d4',
          fontFamily: '"Courier New", "Consolas", monospace',
          fontSize: 13,
          lineHeight: 1.6,
          border: 'none',
          outline: 'none',
          resize: 'none',
          boxSizing: 'border-box',
          minHeight: 400,
        }}
      />
    </div>
  )
}
