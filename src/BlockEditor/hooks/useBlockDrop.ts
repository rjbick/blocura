import { useCallback, useState } from 'react'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { findBlock, findBlockParent } from '../helpers/flattenBlocks'
import { useEditorActions, useEditorStore } from '../store'

const DROPZONE_PREFIX = 'dropzone:'

function parseDropzoneRoot(overId: string): string | null | undefined {
  if (!overId.startsWith(DROPZONE_PREFIX)) return undefined
  const raw = overId.slice(DROPZONE_PREFIX.length)
  return raw === '__root__' ? null : raw
}

export function useBlockDrop() {
  const blocks = useEditorStore((state) => state.blocks)
  const { moveBlockToPosition, setIsDragging } = useEditorActions()
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const onDragStart = useCallback((event: DragStartEvent) => {
    const clientId = String(event.active.id)
    setActiveDragId(clientId)
    setIsDragging(true, clientId)
  }, [setIsDragging])

  const onDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null)
    setIsDragging(false, null)

    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    if (!activeId || activeId === overId) return

    const fromRoot = findBlockParent(blocks, activeId)?.clientId ?? null
    const dropRoot = parseDropzoneRoot(overId)

    if (dropRoot !== undefined) {
      if (dropRoot && !findBlock(blocks, dropRoot)) return
      const siblings = dropRoot ? (findBlock(blocks, dropRoot)?.innerBlocks ?? []) : blocks
      moveBlockToPosition(activeId, fromRoot, dropRoot, siblings.length)
      return
    }

    const toParent = findBlockParent(blocks, overId)
    const toRoot = toParent?.clientId ?? null
    const siblings = toParent ? toParent.innerBlocks : blocks
    const index = siblings.findIndex((block) => block.clientId === overId)
    if (index < 0) return

    moveBlockToPosition(activeId, fromRoot, toRoot, index)
  }, [blocks, moveBlockToPosition, setIsDragging])

  const onDragCancel = useCallback(() => {
    setActiveDragId(null)
    setIsDragging(false, null)
  }, [setIsDragging])

  return {
    activeDragId,
    onDragStart,
    onDragEnd,
    onDragCancel,
  }
}
