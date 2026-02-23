import { useMemo } from 'react'
import { findBlock } from '../helpers/flattenBlocks'
import { useEditorActions, useEditorStore } from '../store'

export function useBlockSelection() {
  const blocks = useEditorStore((state) => state.blocks)
  const selectedClientIds = useEditorStore((state) => state.selectedClientIds)
  const hoveredClientId = useEditorStore((state) => state.hoveredClientId)
  const {
    selectBlock,
    multiSelectBlocks,
    addToSelection,
    removeFromSelection,
    clearSelection,
    setHoveredBlock,
  } = useEditorActions()

  const selectedBlocks = useMemo(() => {
    if (selectedClientIds.length === 0) return []
    return selectedClientIds
      .map((clientId) => findBlock(blocks, clientId))
      .filter((block): block is NonNullable<typeof block> => block !== null)
  }, [blocks, selectedClientIds])

  return {
    selectedClientIds,
    selectedBlock: selectedBlocks.length === 1 ? selectedBlocks[0] : null,
    selectedBlocks,
    hoveredClientId,
    isMultiSelection: selectedClientIds.length > 1,
    selectBlock,
    multiSelectBlocks,
    addToSelection,
    removeFromSelection,
    clearSelection,
    setHoveredBlock,
  }
}
