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
      <div style={{ padding: '8px 0' }}>
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
              onClick={() => onSelect(block.clientId)}
              style={{
                paddingLeft: depth * 16 + (hasChildren ? 4 : 28),
                paddingRight: 8,
                paddingTop: 6,
                paddingBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                backgroundColor: isSelected
                  ? `rgba(var(--wp-components-color-accent-rgb), 0.1)`
                  : 'transparent',
                color: isSelected ? 'var(--wp-components-color-accent)' : '#1e1e1e',
                fontSize: 13,
                borderLeft: isSelected
                  ? `2px solid var(--wp-components-color-accent)`
                  : '2px solid transparent',
                transition: 'background-color 0.05s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.04)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }
              }}
            >
              {/* Expand/collapse chevron */}
              {hasChildren && (
                <button
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

              {/* Block icon */}
              <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0, opacity: 0.7 }}>
                {def ? def.icon : '□'}
              </span>

              {/* Block title */}
              <span style={{ fontWeight: isSelected ? 600 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {def?.title ?? block.name}
              </span>

              {/* Content preview */}
              <span style={{ fontSize: 11, color: '#949494', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>
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
