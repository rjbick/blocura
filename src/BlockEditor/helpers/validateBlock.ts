import type { Block, BlockDefinition } from '../types'

export function normalizeHTML(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim()
}

export function validateBlock(block: Block, def: BlockDefinition): boolean {
  if (!block.originalContent) return true
  if (block.innerBlocks.length > 0) return true
  if ((block.attributes as Record<string, unknown>)['__forcedValid']) return true
  try {
    const regenerated = def.save({
      attributes: block.attributes as Record<string, unknown>,
      innerBlocks: block.innerBlocks,
    })
    return normalizeHTML(regenerated) === normalizeHTML(block.originalContent)
  } catch {
    return false
  }
}
