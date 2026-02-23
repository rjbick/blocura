import { useMemo } from 'react'
import { BlockRegistry } from '../registry/BlockRegistry'
import { findBlock, getBlockAncestors } from '../helpers/flattenBlocks'
import { useEditorStore } from '../store'
import type { Block } from '../types'

function resolveProvidedContext(blocks: Block[], clientId: string) {
  const ancestors = getBlockAncestors(blocks, clientId)
  const values: Record<string, unknown> = {}

  for (const ancestor of ancestors) {
    const def = BlockRegistry.get(ancestor.name)
    if (!def?.providesContext) continue
    const attrs = ancestor.attributes as Record<string, unknown>
    for (const [contextKey, attributeKey] of Object.entries(def.providesContext)) {
      if (attrs[attributeKey] !== undefined) {
        values[contextKey] = attrs[attributeKey]
      }
    }
  }

  return { ancestors, values }
}

export function useBlockContext(clientId: string | null) {
  const blocks = useEditorStore((state) => state.blocks)

  return useMemo(() => {
    if (!clientId) {
      return {
        context: {} as Record<string, unknown>,
        usedContext: {} as Record<string, unknown>,
        ancestors: [] as ReturnType<typeof getBlockAncestors>,
      }
    }

    const block = findBlock(blocks, clientId)
    if (!block) {
      return {
        context: {} as Record<string, unknown>,
        usedContext: {} as Record<string, unknown>,
        ancestors: [] as ReturnType<typeof getBlockAncestors>,
      }
    }

    const { ancestors, values } = resolveProvidedContext(blocks, clientId)
    const usesContext = BlockRegistry.get(block.name)?.usesContext ?? []
    const usedContext = Object.fromEntries(
      usesContext
        .filter((key) => key in values)
        .map((key) => [key, values[key]])
    )

    return {
      context: values,
      usedContext,
      ancestors,
    }
  }, [blocks, clientId])
}
