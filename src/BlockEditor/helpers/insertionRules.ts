import type { Block, BlockDefinition } from '../types'
import { BlockRegistry } from '../registry/BlockRegistry'
import { findBlock, findBlockParent } from './flattenBlocks'
import { generateClientId } from './generateClientId'

export interface InsertTarget {
  rootClientId: string | null
  index: number
}

function getRootContainerName(blocks: Block[], rootClientId: string | null): string | null {
  if (rootClientId === null) return null
  return findBlock(blocks, rootClientId)?.name ?? null
}

export function isBlockNameAllowedAtRoot(
  blockName: string,
  blocks: Block[],
  rootClientId: string | null
): boolean {
  const rootName = getRootContainerName(blocks, rootClientId)
  if (rootName === 'core/columns') {
    return blockName === 'core/column'
  }
  if (rootName === 'core/buttons') {
    return blockName === 'core/button'
  }
  if (rootName === 'core/list') {
    return blockName === 'core/list-item'
  }
  if (rootName === 'core/list-item') {
    return blockName === 'core/list'
  }
  if (rootName === 'core/navigation') {
    return blockName === 'core/navigation-link'
  }
  if (rootName === 'core/social-links') {
    return blockName === 'core/social-link'
  }
  return blockName !== 'core/column'
    && blockName !== 'core/list-item'
    && blockName !== 'core/navigation-link'
    && blockName !== 'core/social-link'
}

export function areBlocksAllowedAtRoot(
  nextBlocks: Block[],
  blocks: Block[],
  rootClientId: string | null
): boolean {
  return nextBlocks.every((block) => isBlockNameAllowedAtRoot(block.name, blocks, rootClientId))
}

export function filterBlockDefinitionsForRoot(
  defs: BlockDefinition[],
  blocks: Block[],
  rootClientId: string | null
): BlockDefinition[] {
  return defs.filter((def) => isBlockNameAllowedAtRoot(def.name, blocks, rootClientId))
}

export function buildDefaultAttributes(def: BlockDefinition): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(def.attributes).map(([key, schema]) => [
      key,
      schema.default !== undefined ? schema.default : '',
    ])
  )
}

export function createBlockFromDefinition(def: BlockDefinition): Block {
  const block: Block = {
    clientId: generateClientId(),
    name: def.name,
    attributes: buildDefaultAttributes(def),
    innerBlocks: [],
  }

  const childDefaults: Record<string, string | null> = {
    'core/list': 'core/list-item',
    'core/buttons': 'core/button',
    'core/navigation': 'core/navigation-link',
    'core/social-links': 'core/social-link',
  }

  const defaultChildName = childDefaults[def.name]
  if (defaultChildName) {
    const childDef = BlockRegistry.get(defaultChildName)
    if (childDef) {
      block.innerBlocks = [{
        clientId: generateClientId(),
        name: childDef.name,
        attributes: buildDefaultAttributes(childDef),
        innerBlocks: [],
      }]
    }
  }

  return block
}

export function getDefaultInsertBlockNameForRoot(
  blocks: Block[],
  rootClientId: string | null
): 'core/paragraph' | 'core/column' | 'core/button' | 'core/list' | 'core/list-item' | 'core/navigation-link' | 'core/social-link' {
  const rootName = getRootContainerName(blocks, rootClientId)
  if (rootName === 'core/buttons') return 'core/button'
  if (rootName === 'core/list') return 'core/list-item'
  if (rootName === 'core/list-item') return 'core/list'
  if (rootName === 'core/navigation') return 'core/navigation-link'
  if (rootName === 'core/social-links') return 'core/social-link'
  return rootName === 'core/columns' ? 'core/column' : 'core/paragraph'
}

export function createDefaultBlockForRoot(blocks: Block[], rootClientId: string | null): Block | null {
  const name = getDefaultInsertBlockNameForRoot(blocks, rootClientId)
  const def = BlockRegistry.get(name)
  if (!def) return null
  return createBlockFromDefinition(def)
}

export function getInsertTargetFromSelection(
  blocks: Block[],
  selectedClientId: string | null
): InsertTarget {
  if (!selectedClientId) {
    return { rootClientId: null, index: blocks.length }
  }

  const parent = findBlockParent(blocks, selectedClientId)
  const siblings = parent ? parent.innerBlocks : blocks
  const index = siblings.findIndex((block) => block.clientId === selectedClientId)
  if (index === -1) {
    return { rootClientId: null, index: blocks.length }
  }

  return {
    rootClientId: parent?.clientId ?? null,
    index: index + 1,
  }
}
