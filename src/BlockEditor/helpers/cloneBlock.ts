import type { Block } from '../types'
import { generateClientId } from './generateClientId'

export function cloneBlock(block: Block): Block {
  return {
    ...block,
    clientId: generateClientId(),
    attributes: structuredClone(block.attributes),
    innerBlocks: block.innerBlocks.map(cloneBlock),
  }
}
