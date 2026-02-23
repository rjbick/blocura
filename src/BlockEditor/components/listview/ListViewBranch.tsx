import type { DragEvent } from 'react'
import { ListViewItem } from './ListViewItem'
import type { Block } from '../../types'

type ListViewMode = 'list' | 'outline'
type DropPosition = 'before' | 'after'

interface DropHint {
  targetClientId: string
  position: DropPosition
}

interface ListViewBranchProps {
  blocks: Block[]
  mode: ListViewMode
  depth: number
  selectedClientIds: string[]
  collapsed: Set<string>
  onSelect: (clientId: string) => void
  onToggleCollapsed: (clientId: string) => void
  draggingClientId: string | null
  dropHint: DropHint | null
  onDragStart: (clientId: string, event: DragEvent<HTMLElement>) => void
  onDragOver: (clientId: string, event: DragEvent<HTMLElement>) => void
  onDrop: (clientId: string, event: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
}

export function ListViewBranch({
  blocks,
  mode,
  depth,
  selectedClientIds,
  collapsed,
  onSelect,
  onToggleCollapsed,
  draggingClientId,
  dropHint,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: ListViewBranchProps) {
  return (
    <>
      {blocks.map((block) => {
        const hasChildren = block.innerBlocks.length > 0
        const isCollapsed = collapsed.has(block.clientId)

        return (
          <div key={block.clientId}>
            <ListViewItem
              block={block}
              mode={mode}
              depth={depth}
              isSelected={selectedClientIds.includes(block.clientId)}
              isDragging={draggingClientId === block.clientId}
              hasChildren={hasChildren}
              isCollapsed={isCollapsed}
              dropPosition={dropHint?.targetClientId === block.clientId ? dropHint.position : null}
              onSelect={onSelect}
              onToggle={onToggleCollapsed}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
            />

            {hasChildren && !isCollapsed && (
              <ListViewBranch
                blocks={block.innerBlocks}
                mode={mode}
                depth={depth + 1}
                selectedClientIds={selectedClientIds}
                collapsed={collapsed}
                onSelect={onSelect}
                onToggleCollapsed={onToggleCollapsed}
                draggingClientId={draggingClientId}
                dropHint={dropHint}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
              />
            )}
          </div>
        )
      })}
    </>
  )
}
