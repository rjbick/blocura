import { useCallback } from 'react'
import { findBlock } from '../helpers/flattenBlocks'
import { useEditorActions, useEditorStore } from '../store'

export function useBlockAttributes<A extends Record<string, unknown> = Record<string, unknown>>(
  clientId: string | null
) {
  const blocks = useEditorStore((state) => state.blocks)
  const { updateBlockAttributes } = useEditorActions()
  const block = clientId ? findBlock(blocks, clientId) : null
  const attributes = (block?.attributes ?? {}) as A

  const setAttributes = useCallback((nextAttrs: Partial<A>) => {
    if (!clientId) return
    updateBlockAttributes(clientId, nextAttrs as Record<string, unknown>)
  }, [clientId, updateBlockAttributes])

  return {
    block,
    attributes,
    setAttributes,
  }
}
