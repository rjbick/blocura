import type { Block } from '../types'

export function flattenBlocks(blocks: Block[]): Block[] {
  const result: Block[] = []
  for (const block of blocks) {
    result.push(block)
    if (block.innerBlocks.length > 0) {
      result.push(...flattenBlocks(block.innerBlocks))
    }
  }
  return result
}

export function findBlock(blocks: Block[], clientId: string): Block | null {
  for (const block of blocks) {
    if (block.clientId === clientId) return block
    const found = findBlock(block.innerBlocks, clientId)
    if (found) return found
  }
  return null
}

export function findBlockParent(
  blocks: Block[],
  clientId: string,
  parent: Block | null = null
): Block | null {
  for (const block of blocks) {
    if (block.clientId === clientId) return parent
    const found = findBlockParent(block.innerBlocks, clientId, block)
    if (found !== null) return found
  }
  return null
}

export function getBlockIndex(blocks: Block[], clientId: string): number {
  return blocks.findIndex(b => b.clientId === clientId)
}

export function getBlockAncestors(blocks: Block[], clientId: string): Block[] {
  const ancestors: Block[] = []

  function traverse(current: Block[], target: string): boolean {
    for (const block of current) {
      if (block.clientId === target) return true
      ancestors.push(block)
      if (traverse(block.innerBlocks, target)) return true
      ancestors.pop()
    }
    return false
  }

  traverse(blocks, clientId)
  return ancestors
}
