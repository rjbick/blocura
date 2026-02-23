import type { Block, BlockDefinition } from '../../types'
import { BlockFloatingToolbar } from './BlockFloatingToolbar'

interface BlockToolbarFixedProps {
  block: Block
  def: BlockDefinition
  topOffset?: number
}

export function BlockToolbarFixed({ block, def, topOffset = 64 }: BlockToolbarFixedProps) {
  return (
    <BlockFloatingToolbar
      block={block}
      def={def}
      variant="fixed"
      topOffset={topOffset}
    />
  )
}
