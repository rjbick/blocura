import type { DragEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
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
  activeClientId: string | null
  getItemMeta: (
    clientId: string
  ) => { setSize: number; posInSet: number } | null
  onItemKeyDown: (clientId: string, event: ReactKeyboardEvent<HTMLElement>) => void
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
  activeClientId,
  getItemMeta,
  onItemKeyDown,
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
        const itemMeta = getItemMeta(block.clientId)

        return (
          <div key={block.clientId}>
            <ListViewItem
              block={block}
              mode={mode}
              depth={depth}
              isSelected={selectedClientIds.includes(block.clientId)}
              isActive={activeClientId === block.clientId}
              isDragging={draggingClientId === block.clientId}
              hasChildren={hasChildren}
              isCollapsed={isCollapsed}
              ariaSetSize={itemMeta?.setSize}
              ariaPosInSet={itemMeta?.posInSet}
              dropPosition={dropHint?.targetClientId === block.clientId ? dropHint.position : null}
              onSelect={onSelect}
              onToggle={onToggleCollapsed}
              onKeyDown={onItemKeyDown}
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
                activeClientId={activeClientId}
                getItemMeta={getItemMeta}
                onItemKeyDown={onItemKeyDown}
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
