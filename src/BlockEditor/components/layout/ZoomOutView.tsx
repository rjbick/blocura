import type { Block } from '../../types'
import { BlockRegistry } from '../../registry/BlockRegistry'

interface ZoomOutViewProps {
  blocks: Block[]
  selectedClientIds: string[]
  onSelectBlock?: (clientId: string) => void
}

function flattenNames(blocks: Block[]): Block[] {
  return blocks.flatMap((block) => [block, ...flattenNames(block.innerBlocks)])
}

export function ZoomOutView({ blocks, selectedClientIds, onSelectBlock }: ZoomOutViewProps) {
  const flat = flattenNames(blocks)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 12,
        padding: 16,
      }}
    >
      {flat.map((block) => {
        const isSelected = selectedClientIds.includes(block.clientId)
        const title = BlockRegistry.get(block.name)?.title ?? block.name

        return (
          <button
            key={block.clientId}
            type="button"
            onClick={() => onSelectBlock?.(block.clientId)}
            style={{
              minHeight: 64,
              padding: 10,
              borderRadius: 2,
              border: isSelected
                ? '2px solid var(--editor-components-color-accent)'
                : '1px solid var(--editor-border)',
              backgroundColor: 'var(--editor-surface)',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: 'var(--editor-font-family)',
              fontSize: 12,
              color: 'var(--editor-text)',
            }}
          >
            <strong style={{ display: 'block', marginBottom: 4 }}>{title}</strong>
            <span style={{ color: 'var(--editor-text-muted)' }}>{block.clientId.slice(0, 8)}</span>
          </button>
        )
      })}
    </div>
  )
}
