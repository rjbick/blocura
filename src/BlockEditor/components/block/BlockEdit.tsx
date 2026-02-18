import type { Block, BlockDefinition, BlockEditProps } from '../../types'
import { useEditorActions, useEditorStore } from '../../store'
import { flattenBlocks, findBlockParent } from '../../helpers/flattenBlocks'
import { BlockRegistry } from '../../registry/BlockRegistry'

interface BlockEditComponentProps {
  block: Block
  def: BlockDefinition
  isSelected: boolean
  onNavigateOut?: (clientId: string, direction: 'up' | 'down') => void
}

export function BlockEdit({
  block,
  def,
  isSelected,
  onNavigateOut,
}: BlockEditComponentProps) {
  const {
    updateBlockAttributes,
    insertBlocks,
    replaceBlock,
    removeBlock,
    mergeBlocks,
    selectBlock,
    clearSelection,
  } = useEditorActions()
  const allBlocks = useEditorStore(s => s.blocks)
  const initialPosition = useEditorStore(s => (
    s.selectedClientIds.length === 1 && s.selectedClientIds[0] === block.clientId
      ? s.selectionInitialPosition
      : null
  ))

  const setAttributes = (attrs: Record<string, unknown>) => {
    updateBlockAttributes(block.clientId, attrs)
  }

  const insertBlocksAfter = (newBlocks: Block[]) => {
    const parent = findBlockParent(allBlocks, block.clientId)
    const siblings = parent ? parent.innerBlocks : allBlocks
    const idx = siblings.findIndex((b) => b.clientId === block.clientId)
    if (idx === -1) {
      insertBlocks(newBlocks, null, allBlocks.length)
      return
    }
    insertBlocks(newBlocks, parent?.clientId ?? null, idx + 1)
  }

  const onReplace = (replacement: Block | Block[]) => {
    replaceBlock(block.clientId, replacement)
  }

  const onRemove = (forward = false) => {
    const flat = flattenBlocks(allBlocks)
    const idx = flat.findIndex((b) => b.clientId === block.clientId)
    const prev = idx > 0 ? flat[idx - 1] : null
    const next = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null
    removeBlock(block.clientId)
    const target = forward ? (next ?? prev) : (prev ?? next)
    if (target) {
      selectBlock(target.clientId, forward ? -1 : 1)
    } else {
      clearSelection()
    }
  }

  const getTextMergeKey = (attrs: Record<string, unknown>): string | null => {
    for (const key of ['content', 'value', 'text']) {
      if (typeof attrs[key] === 'string') return key
    }
    return null
  }

  const isRemoveLocked = (candidate: Block): boolean => {
    const lock = (candidate.attributes as Record<string, unknown> | undefined)?.lock
    if (!lock || typeof lock !== 'object') return false
    return (lock as Record<string, unknown>).remove === true
  }

  const mergeByTextKey = (base: Block, mergeWith: Block): boolean => {
    if (isRemoveLocked(mergeWith)) return false
    if (base.name !== mergeWith.name) return false
    const baseAttrs = base.attributes as Record<string, unknown>
    const mergeAttrs = mergeWith.attributes as Record<string, unknown>
    const textKey = getTextMergeKey(baseAttrs)
    if (!textKey || typeof mergeAttrs[textKey] !== 'string') return false
    updateBlockAttributes(base.clientId, {
      [textKey]: `${String(baseAttrs[textKey] ?? '')}${String(mergeAttrs[textKey] ?? '')}`,
    })
    removeBlock(mergeWith.clientId)
    return true
  }

  const onMergeBlocks = (forward: boolean) => {
    const flat = flattenBlocks(allBlocks)
    const idx = flat.findIndex((b) => b.clientId === block.clientId)
    if (idx === -1) return

    if (!forward) {
      const prev = idx > 0 ? flat[idx - 1] : null
      if (!prev) return
      const prevDef = BlockRegistry.get(prev.name)
      if (prevDef?.merge && prev.name === block.name) {
        mergeBlocks(prev.clientId, block.clientId)
        selectBlock(prev.clientId, 1)
        return
      }
      if (mergeByTextKey(prev, block)) {
        selectBlock(prev.clientId, 1)
      }
      return
    }

    const next = idx < flat.length - 1 ? flat[idx + 1] : null
    if (!next) return
    const currentDef = BlockRegistry.get(block.name)
    if (currentDef?.merge && next.name === block.name) {
      mergeBlocks(block.clientId, next.clientId)
      selectBlock(block.clientId, 1)
      return
    }
    if (mergeByTextKey(block, next)) {
      selectBlock(block.clientId, 1)
    }
  }

  const handleNavigateOut = (direction: 'up' | 'down') => {
    onNavigateOut?.(block.clientId, direction)
  }

  const EditComponent = def.edit as React.ComponentType<BlockEditProps>

  return (
    <EditComponent
      clientId={block.clientId}
      attributes={block.attributes as Record<string, unknown>}
      setAttributes={setAttributes}
      isSelected={isSelected}
      innerBlocks={block.innerBlocks}
      insertBlocksAfter={insertBlocksAfter}
      onReplace={onReplace}
      onRemove={onRemove}
      mergeBlocks={onMergeBlocks}
      onNavigateOut={handleNavigateOut}
      initialPosition={initialPosition}
    />
  )
}
