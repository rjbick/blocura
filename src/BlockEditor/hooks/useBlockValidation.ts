import { useMemo } from 'react'
import { BlockRegistry } from '../registry/BlockRegistry'
import { flattenBlocks } from '../helpers/flattenBlocks'
import { validateBlock } from '../helpers/validateBlock'
import { useEditorStore } from '../store'

export function useBlockValidation() {
  const blocks = useEditorStore((state) => state.blocks)

  return useMemo(() => {
    const result: Record<string, boolean> = {}
    for (const block of flattenBlocks(blocks)) {
      const def = BlockRegistry.get(block.name)
      result[block.clientId] = def ? validateBlock(block, def) : true
    }
    return result
  }, [blocks])
}
