import { useState, useCallback } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useBlocks, useEditorActions, useEditorStore } from '../../store'
import { BlockRegistry } from '../../registry/BlockRegistry'
import type { Block } from '../../types'

export function ListView() {
  const blocks = useBlocks()
  const { selectBlock } = useEditorActions()
  const selectedClientIds = useEditorStore(s => s.selectedClientIds)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const totalBlocks = countBlocks(blocks)

  const toggleCollapsed = useCallback((clientId: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(clientId)) next.delete(clientId)
      else next.add(clientId)
      return next
    })
  }, [])

  if (blocks.length === 0) {
    return (
      <div
        className="list-view-empty"
        style={{
          padding: 24,
          textAlign: 'center',
          color: '#757575',
          fontSize: 13,
          fontFamily: 'var(--wp-font-family)',
        }}
      >
        No blocks in this document.
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'var(--wp-font-family)' }}>
      <div
        className="list-view-header"
        style={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          borderBottom: '1px solid var(--wp-sidebar-border)',
          fontSize: 11,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontWeight: 600,
          color: '#757575',
        }}
      >
        <span>List View</span>
        <span>{totalBlocks}</span>
      </div>

      <div style={{ padding: '6px 0' }} role="tree" aria-label="Block list">
        <ListViewBranch
          blocks={blocks}
          depth={0}
          selectedClientIds={selectedClientIds}
          onSelect={selectBlock}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
        />
      </div>
    </div>
  )
}

interface ListViewBranchProps {
  blocks: Block[]
  depth: number
  selectedClientIds: string[]
  onSelect: (clientId: string) => void
  collapsed: Set<string>
  onToggleCollapsed: (clientId: string) => void
}

function ListViewBranch({ blocks, depth, selectedClientIds, onSelect, collapsed, onToggleCollapsed }: ListViewBranchProps) {
  return (
    <>
      {blocks.map((block) => {
        const def = BlockRegistry.get(block.name)
        const isSelected = selectedClientIds.includes(block.clientId)
        const hasChildren = block.innerBlocks.length > 0
        const isCollapsed = collapsed.has(block.clientId)

        return (
          <div key={block.clientId}>
            <div
              className={`list-view-row${isSelected ? ' list-view-row--selected' : ''}`}
              role="treeitem"
              aria-selected={isSelected}
              aria-level={depth + 1}
              aria-expanded={hasChildren ? !isCollapsed : undefined}
              onClick={() => onSelect(block.clientId)}
              style={{
                paddingLeft: depth * 14 + 8,
                paddingRight: 8,
                minHeight: 30,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                backgroundColor: isSelected
                  ? `rgba(var(--wp-components-color-accent-rgb), 0.1)`
                  : 'transparent',
                color: isSelected ? 'var(--wp-components-color-accent)' : '#1e1e1e',
                fontSize: 13,
                boxShadow: isSelected ? 'inset 2px 0 0 var(--wp-components-color-accent)' : 'none',
                transition: 'background-color 0.05s ease',
              }}
            >
              {/* Expand/collapse chevron */}
              {hasChildren && (
                <button
                  className="list-view-toggle"
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggleCollapsed(block.clientId) }}
                  style={{
                    width: 16,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    padding: 0,
                    color: 'inherit',
                    opacity: 0.6,
                  }}
                  aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                >
                  {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
              {!hasChildren && <span style={{ width: 16, height: 16, flexShrink: 0 }} aria-hidden />}

              {/* Block icon */}
              <span
                style={{
                  fontSize: 14,
                  lineHeight: 1,
                  flexShrink: 0,
                  opacity: 0.72,
                  width: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {def ? def.icon : '□'}
              </span>

              {/* Block title */}
              <span
                style={{
                  fontWeight: isSelected ? 600 : 400,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {def?.title ?? block.name}
              </span>

              {/* Content preview */}
              <span
                style={{
                  fontSize: 11,
                  color: '#757575',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 96,
                }}
              >
                {getContentPreview(block)}
              </span>
            </div>

            {/* Nested blocks (collapsible) */}
            {hasChildren && !isCollapsed && (
              <ListViewBranch
                blocks={block.innerBlocks}
                depth={depth + 1}
                selectedClientIds={selectedClientIds}
                onSelect={onSelect}
                collapsed={collapsed}
                onToggleCollapsed={onToggleCollapsed}
              />
            )}
          </div>
        )
      })}
    </>
  )
}

function getContentPreview(block: Block): string {
  const attrs = block.attributes as Record<string, unknown>

  switch (block.name) {
    case 'core/paragraph':
    case 'core/heading':
      return stripHtml(String(attrs['content'] ?? '')).slice(0, 40)
    case 'core/image':
      return String(attrs['alt'] || attrs['url'] || '')
    case 'core/button':
      return stripHtml(String(attrs['text'] ?? ''))
    case 'core/list':
      return ''
    case 'core/group':
    case 'core/columns':
      return `${block.innerBlocks.length} blocks`
    default:
      return ''
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

function countBlocks(blocks: Block[]): number {
  let total = 0
  for (const block of blocks) {
    total += 1
    total += countBlocks(block.innerBlocks)
  }
  return total
}
