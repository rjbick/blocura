import type { DragEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { GripVertical } from 'lucide-react'
import type { Block } from '../../types'
import { BlockRegistry } from '../../registry/BlockRegistry'
import { ListViewDropZone } from './ListViewDropZone'

type ListViewMode = 'list' | 'outline'
type DropPosition = 'before' | 'after'

interface ListViewItemProps {
  block: Block
  mode: ListViewMode
  depth: number
  isSelected: boolean
  isActive: boolean
  isDragging: boolean
  hasChildren: boolean
  isCollapsed: boolean
  ariaSetSize?: number
  ariaPosInSet?: number
  dropPosition: DropPosition | null
  onSelect: (clientId: string) => void
  onToggle: (clientId: string) => void
  onKeyDown: (clientId: string, event: ReactKeyboardEvent<HTMLElement>) => void
  onDragStart: (clientId: string, event: DragEvent<HTMLElement>) => void
  onDragOver: (clientId: string, event: DragEvent<HTMLElement>) => void
  onDrop: (clientId: string, event: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
}

export function ListViewItem({
  block,
  mode,
  depth,
  isSelected,
  isActive,
  isDragging,
  hasChildren,
  isCollapsed,
  ariaSetSize,
  ariaPosInSet,
  dropPosition,
  onSelect,
  onToggle,
  onKeyDown,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: ListViewItemProps) {
  const def = BlockRegistry.get(block.name)
  const summary = getBlockSummary(block)

  return (
    <>
      <ListViewDropZone active={dropPosition === 'before'} />

      <div
        data-listview-item-id={block.clientId}
        className={`list-view-row${isSelected ? ' list-view-row--selected' : ''}`}
        role="treeitem"
        aria-selected={isSelected}
        aria-level={depth + 1}
        aria-setsize={ariaSetSize}
        aria-posinset={ariaPosInSet}
        aria-expanded={hasChildren ? !isCollapsed : undefined}
        tabIndex={isActive ? 0 : -1}
        onDragOver={(event) => onDragOver(block.clientId, event)}
        onDrop={(event) => onDrop(block.clientId, event)}
        onKeyDown={(event) => onKeyDown(block.clientId, event)}
        onClick={() => onSelect(block.clientId)}
        style={{
          paddingLeft: depth * 14 + 8,
          paddingRight: 8,
          minHeight: mode === 'outline' ? 36 : 30,
          display: 'flex',
          alignItems: mode === 'outline' ? 'flex-start' : 'center',
          gap: 6,
          cursor: 'pointer',
          backgroundColor: isSelected
            ? 'rgba(var(--editor-components-color-accent-rgb), 0.1)'
            : 'transparent',
          color: isSelected ? 'var(--editor-components-color-accent)' : 'var(--editor-text)',
          fontSize: 13,
          opacity: isDragging ? 0.45 : 1,
          transition: 'opacity 0.1s ease',
          borderRadius: 2,
        }}
        >
        <button
          type="button"
          aria-label="Drag block"
          draggable
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
          onDragStart={(event) => onDragStart(block.clientId, event)}
          onDragEnd={onDragEnd}
          style={{
            width: 16,
            height: 16,
            border: 'none',
            background: 'transparent',
            padding: 0,
            marginTop: mode === 'outline' ? 1 : 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--editor-text-muted)',
            cursor: 'grab',
            flexShrink: 0,
          }}
        >
          <GripVertical size={14} />
        </button>

        {hasChildren ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={(event) => {
              event.stopPropagation()
              onToggle(block.clientId)
            }}
            style={{
              width: 16,
              height: 16,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              marginTop: mode === 'outline' ? 1 : 0,
            }}
          >
            {isCollapsed ? '▸' : '▾'}
          </button>
        ) : (
          <span style={{ width: 16 }} aria-hidden />
        )}

        <span style={{ width: 16, display: 'inline-flex', justifyContent: 'center', marginTop: mode === 'outline' ? 1 : 0 }}>
          {typeof def?.icon === 'string' ? null : def?.icon}
        </span>

        {mode === 'outline' ? (
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 3 }}>
            <div
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: isSelected ? 600 : 500,
                lineHeight: 1.2,
              }}
            >
              {def?.title ?? block.name}
            </div>
            {summary && (
              <div
                style={{
                  marginTop: 2,
                  fontSize: 11,
                  color: 'var(--editor-text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.3,
                }}
              >
                {summary}
              </div>
            )}
          </div>
        ) : (
          <span
            style={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: isSelected ? 600 : 400,
            }}
          >
            {def?.title ?? block.name}
          </span>
        )}
      </div>

      <ListViewDropZone active={dropPosition === 'after'} />
    </>
  )
}

function getBlockSummary(block: Block): string {
  const attrs = block.attributes as Record<string, unknown>
  const candidateKeys = ['content', 'value', 'values', 'caption', 'text', 'title', 'html', 'code', 'citation']
  for (const key of candidateKeys) {
    const value = attrs[key]
    if (typeof value !== 'string') continue
    const normalized = stripHtml(value).replace(/\s+/g, ' ').trim()
    if (!normalized) continue
    return normalized.length > 80 ? `${normalized.slice(0, 80)}…` : normalized
  }
  return ''
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, ' ')
}
