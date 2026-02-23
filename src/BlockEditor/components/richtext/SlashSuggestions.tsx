import { useMemo } from 'react'
import type { BlockDefinition } from '../../types'
import { useInserter } from '../../hooks/useInserter'

interface SlashSuggestionsProps {
  open: boolean
  query: string
  rootClientId?: string | null
  position?: { x: number; y: number }
  maxItems?: number
  onSelect?: (definition: BlockDefinition) => void
  onClose?: () => void
}

export function SlashSuggestions({
  open,
  query,
  rootClientId = null,
  position,
  maxItems = 8,
  onSelect,
  onClose,
}: SlashSuggestionsProps) {
  const { availableBlocks, insertBlockDefinition } = useInserter(rootClientId)

  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return availableBlocks.slice(0, maxItems)

    return availableBlocks
      .filter((def) => {
        const haystack = [
          def.title,
          def.name,
          ...(def.keywords ?? []),
        ].join(' ').toLowerCase()
        return haystack.includes(normalized)
      })
      .slice(0, maxItems)
  }, [availableBlocks, maxItems, query])

  if (!open || items.length === 0) return null

  return (
    <div
      role="listbox"
      aria-label="Block suggestions"
      style={{
        position: 'fixed',
        left: position?.x ?? 0,
        top: position?.y ?? 0,
        minWidth: 220,
        maxWidth: 280,
        maxHeight: 280,
        overflowY: 'auto',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: 4,
        boxShadow: 'var(--editor-popover-shadow)',
        padding: 4,
        zIndex: 1000,
      }}
    >
      {items.map((def) => (
        <button
          key={def.name}
          type="button"
          onClick={() => {
            if (onSelect) onSelect(def)
            else insertBlockDefinition(def)
            onClose?.()
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 8px',
            border: 'none',
            background: 'transparent',
            borderRadius: 2,
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: 'var(--editor-font-family)',
            fontSize: 13,
            color: '#1e1e1e',
          }}
        >
          <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {typeof def.icon === 'string' ? null : def.icon}
          </span>
          <span>{def.title}</span>
        </button>
      ))}
    </div>
  )
}
