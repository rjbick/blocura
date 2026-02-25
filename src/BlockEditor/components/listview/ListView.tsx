import { useState, useMemo, useRef, useCallback, type DragEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
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

interface ListViewItemMeta {
  clientId: string
  parentClientId: string | null
  hasChildren: boolean
  isCollapsed: boolean
  setSize: number
  posInSet: number
}

export function ListView() {
  const blocks = useBlocks()
  const { selectBlock, moveBlockToPosition } = useEditorActions()
  const selectedClientIds = useEditorStore(s => s.selectedClientIds)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<ListViewTab>('list')
  const [draggingClientId, setDraggingClientId] = useState<string | null>(null)
  const [dropHint, setDropHint] = useState<DropHint | null>(null)
  const treeRef = useRef<HTMLDivElement>(null)
  const totalBlocks = countBlocks(blocks)
  const visibleItemMeta = useMemo(
    () => flattenVisibleItemMeta(blocks, collapsed),
    [blocks, collapsed]
  )
  const visibleClientIds = visibleItemMeta.map((item) => item.clientId)
  const visibleItemMetaById = useMemo(
    () => new Map(visibleItemMeta.map((item) => [item.clientId, item])),
    [visibleItemMeta]
  )
  const activeClientId =
    selectedClientIds.find((clientId) => visibleItemMetaById.has(clientId))
      ?? visibleClientIds[0]
      ?? null

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

  const focusListItem = useCallback((clientId: string) => {
    const listItem = treeRef.current?.querySelector<HTMLElement>(
      `[data-listview-item-id="${clientId}"]`
    )
    listItem?.focus()
  }, [])

  const selectAndFocus = useCallback((clientId: string) => {
    selectBlock(clientId)
    focusListItem(clientId)
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        focusListItem(clientId)
      }, 0)
      window.requestAnimationFrame(() => {
        focusListItem(clientId)
      })
    }
  }, [focusListItem, selectBlock])

  const handleItemKeyDown = useCallback(
    (clientId: string, event: ReactKeyboardEvent<HTMLElement>) => {
      const currentIndex = visibleClientIds.indexOf(clientId)
      if (currentIndex === -1) return
      const itemMeta = visibleItemMetaById.get(clientId)
      if (!itemMeta) return

      const key = event.key
      if (key === 'Enter' || key === ' ') {
        event.preventDefault()
        selectAndFocus(clientId)
        return
      }

      if (key === 'ArrowDown') {
        const nextId = visibleClientIds[currentIndex + 1]
        if (!nextId) return
        event.preventDefault()
        selectAndFocus(nextId)
        return
      }

      if (key === 'ArrowUp') {
        const previousId = visibleClientIds[currentIndex - 1]
        if (!previousId) return
        event.preventDefault()
        selectAndFocus(previousId)
        return
      }

      if (key === 'Home') {
        const firstId = visibleClientIds[0]
        if (!firstId) return
        event.preventDefault()
        selectAndFocus(firstId)
        return
      }

      if (key === 'End') {
        const lastId = visibleClientIds[visibleClientIds.length - 1]
        if (!lastId) return
        event.preventDefault()
        selectAndFocus(lastId)
        return
      }

      if (key === 'ArrowRight') {
        if (itemMeta.hasChildren && itemMeta.isCollapsed) {
          event.preventDefault()
          toggleCollapsed(clientId)
          return
        }

        if (itemMeta.hasChildren && !itemMeta.isCollapsed) {
          const childCandidate = visibleClientIds[currentIndex + 1]
          if (!childCandidate) return
          const childMeta = visibleItemMetaById.get(childCandidate)
          if (childMeta?.parentClientId !== clientId) return
          event.preventDefault()
          selectAndFocus(childCandidate)
        }
        return
      }

      if (key === 'ArrowLeft') {
        if (itemMeta.hasChildren && !itemMeta.isCollapsed) {
          event.preventDefault()
          toggleCollapsed(clientId)
          return
        }

        if (itemMeta.parentClientId) {
          event.preventDefault()
          selectAndFocus(itemMeta.parentClientId)
        }
      }
    },
    [selectAndFocus, toggleCollapsed, visibleClientIds, visibleItemMetaById]
  )

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

      <div
        ref={treeRef}
        style={{ padding: '6px 0' }}
        role="tree"
        aria-label="Block list"
        aria-multiselectable={true}
      >
        <ListViewBranch
          blocks={blocks}
          mode={activeTab}
          depth={0}
          selectedClientIds={selectedClientIds}
          activeClientId={activeClientId}
          onSelect={selectBlock}
          getItemMeta={(clientId) => visibleItemMetaById.get(clientId) ?? null}
          onItemKeyDown={handleItemKeyDown}
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

function flattenVisibleItemMeta(
  blocks: Block[],
  collapsed: Set<string>,
  parentClientId: string | null = null
): ListViewItemMeta[] {
  const items: ListViewItemMeta[] = []
  const siblingCount = blocks.length

  for (const [index, block] of blocks.entries()) {
    const hasChildren = block.innerBlocks.length > 0
    const isCollapsed = hasChildren && collapsed.has(block.clientId)
    items.push({
      clientId: block.clientId,
      parentClientId,
      hasChildren,
      isCollapsed,
      setSize: siblingCount,
      posInSet: index + 1,
    })
    if (hasChildren && !isCollapsed) {
      items.push(...flattenVisibleItemMeta(block.innerBlocks, collapsed, block.clientId))
    }
  }

  return items
}
