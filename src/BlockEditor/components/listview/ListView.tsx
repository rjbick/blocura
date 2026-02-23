import { useState, useCallback, type DragEvent } from 'react'
import { useBlocks, useEditorActions, useEditorStore } from '../../store'
import type { Block } from '../../types'
import { findBlockParent } from '../../helpers/flattenBlocks'
import { ListViewBranch } from './ListViewBranch'

type ListViewTab = 'list' | 'outline'
type DropPosition = 'before' | 'after'

interface DropHint {
  targetClientId: string
  position: DropPosition
}

export function ListView() {
  const blocks = useBlocks()
  const { selectBlock, moveBlockToPosition } = useEditorActions()
  const selectedClientIds = useEditorStore(s => s.selectedClientIds)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<ListViewTab>('list')
  const [draggingClientId, setDraggingClientId] = useState<string | null>(null)
  const [dropHint, setDropHint] = useState<DropHint | null>(null)
  const totalBlocks = countBlocks(blocks)

  const toggleCollapsed = useCallback((clientId: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(clientId)) next.delete(clientId)
      else next.add(clientId)
      return next
    })
  }, [])

  const getDropPosition = useCallback((event: DragEvent<HTMLElement>): DropPosition => {
    const rect = event.currentTarget.getBoundingClientRect()
    return event.clientY <= rect.top + rect.height / 2 ? 'before' : 'after'
  }, [])

  const moveDraggedBlock = useCallback((sourceId: string, targetId: string, position: DropPosition) => {
    if (sourceId === targetId) return

    const fromParent = findBlockParent(blocks, sourceId)
    const toParent = findBlockParent(blocks, targetId)
    const fromRoot = fromParent?.clientId ?? null
    const toRoot = toParent?.clientId ?? null
    const fromSiblings = fromParent ? fromParent.innerBlocks : blocks
    const toSiblings = toParent ? toParent.innerBlocks : blocks
    const fromIndex = fromSiblings.findIndex((b) => b.clientId === sourceId)
    const targetIndex = toSiblings.findIndex((b) => b.clientId === targetId)
    if (fromIndex === -1 || targetIndex === -1) return

    let destinationIndex = position === 'before' ? targetIndex : targetIndex + 1
    const isSameParent = fromRoot === toRoot
    if (isSameParent && fromIndex < targetIndex) {
      destinationIndex -= 1
    }

    moveBlockToPosition(sourceId, fromRoot, toRoot, destinationIndex)
    selectBlock(sourceId)
  }, [blocks, moveBlockToPosition, selectBlock])

  const handleDragStart = useCallback((clientId: string, event: DragEvent<HTMLElement>) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', clientId)
    setDraggingClientId(clientId)
    setDropHint(null)
  }, [])

  const handleDragOver = useCallback((clientId: string, event: DragEvent<HTMLElement>) => {
    if (!draggingClientId || draggingClientId === clientId) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    const position = getDropPosition(event)
    setDropHint((prev) => {
      if (prev?.targetClientId === clientId && prev.position === position) {
        return prev
      }
      return { targetClientId: clientId, position }
    })
  }, [draggingClientId, getDropPosition])

  const handleDrop = useCallback((clientId: string, event: DragEvent<HTMLElement>) => {
    if (!draggingClientId || draggingClientId === clientId) return
    event.preventDefault()
    const position = getDropPosition(event)
    moveDraggedBlock(draggingClientId, clientId, position)
    setDraggingClientId(null)
    setDropHint(null)
  }, [draggingClientId, getDropPosition, moveDraggedBlock])

  const handleDragEnd = useCallback(() => {
    setDraggingClientId(null)
    setDropHint(null)
  }, [])

  if (blocks.length === 0) {
    return (
      <div
        className="list-view-empty"
        style={{
          padding: 24,
          textAlign: 'center',
          color: '#757575',
          fontSize: 13,
          fontFamily: 'var(--editor-font-family)',
        }}
      >
        No blocks in this document.
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'var(--editor-font-family)' }}>
      <div
        className="list-view-header"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0 12px 8px',
          borderBottom: '1px solid var(--editor-sidebar-border)',
          gap: 8,
        }}
      >
        <div
          style={{
            width: '100%',
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontWeight: 600,
            color: '#757575',
          }}
        >
          <span>List View</span>
          <span>{totalBlocks}</span>
        </div>

        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            border: '1px solid #dcdcde',
            borderRadius: 3,
            overflow: 'hidden',
            backgroundColor: '#f6f7f7',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            aria-pressed={activeTab === 'list'}
            style={{
              height: 30,
              border: 'none',
              fontSize: 12,
              fontWeight: activeTab === 'list' ? 600 : 500,
              fontFamily: 'inherit',
              color: activeTab === 'list' ? '#1e1e1e' : '#50575e',
              backgroundColor: activeTab === 'list' ? '#fff' : 'transparent',
              cursor: 'pointer',
            }}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('outline')}
            aria-pressed={activeTab === 'outline'}
            style={{
              height: 30,
              border: 'none',
              borderLeft: '1px solid #dcdcde',
              fontSize: 12,
              fontWeight: activeTab === 'outline' ? 600 : 500,
              fontFamily: 'inherit',
              color: activeTab === 'outline' ? '#1e1e1e' : '#50575e',
              backgroundColor: activeTab === 'outline' ? '#fff' : 'transparent',
              cursor: 'pointer',
            }}
          >
            Outline
          </button>
        </div>
      </div>

      <div style={{ padding: '6px 0' }} role="tree" aria-label="Block list">
        <ListViewBranch
          blocks={blocks}
          mode={activeTab}
          depth={0}
          selectedClientIds={selectedClientIds}
          onSelect={selectBlock}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          draggingClientId={draggingClientId}
          dropHint={dropHint}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      </div>
    </div>
  )
}

function countBlocks(blocks: Block[]): number {
  let total = 0
  for (const block of blocks) {
    total += 1
    total += countBlocks(block.innerBlocks)
  }
  return total
}
