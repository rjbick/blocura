import { useCallback, useMemo } from 'react'
import { BlockRegistry } from '../registry/BlockRegistry'
import {
  createBlockFromDefinition,
  filterBlockDefinitionsForRoot,
  getInsertTargetFromSelection,
} from '../helpers/insertionRules'
import type { BlockDefinition } from '../types'
import { useEditorActions, useEditorStore } from '../store'

interface InsertOptions {
  rootClientId?: string | null
  index?: number
}

export function useInserter(rootClientId?: string | null) {
  const blocks = useEditorStore((state) => state.blocks)
  const selectedClientId = useEditorStore((state) => state.selectedClientIds[0] ?? null)
  const isOpen = useEditorStore((state) => state.inserterOpen)
  const { insertBlock, selectBlock, toggleInserter, closeInserter } = useEditorActions()

  const insertTarget = useMemo(() => {
    if (rootClientId !== undefined) {
      const siblings = rootClientId
        ? (blocks.find((b) => b.clientId === rootClientId)?.innerBlocks?.length ?? 0)
        : blocks.length
      return { rootClientId, index: siblings }
    }
    return getInsertTargetFromSelection(blocks, selectedClientId)
  }, [blocks, rootClientId, selectedClientId])

  const availableBlocks = useMemo(() => {
    const defs = BlockRegistry.getInsertable()
    return filterBlockDefinitionsForRoot(defs, blocks, insertTarget.rootClientId)
  }, [blocks, insertTarget.rootClientId])

  const insertBlockDefinition = useCallback((def: BlockDefinition, options: InsertOptions = {}) => {
    const targetRoot = options.rootClientId ?? insertTarget.rootClientId
    const targetIndex = options.index ?? insertTarget.index
    const block = createBlockFromDefinition(def)
    insertBlock(block, targetRoot, targetIndex)
    selectBlock(block.clientId)
  }, [insertBlock, insertTarget.index, insertTarget.rootClientId, selectBlock])

  const insertBlockByName = useCallback((name: string, options: InsertOptions = {}) => {
    const def = BlockRegistry.get(name)
    if (!def) return false
    insertBlockDefinition(def, options)
    return true
  }, [insertBlockDefinition])

  return {
    isOpen,
    toggleInserter,
    closeInserter,
    insertTarget,
    availableBlocks,
    insertBlockDefinition,
    insertBlockByName,
  }
}
