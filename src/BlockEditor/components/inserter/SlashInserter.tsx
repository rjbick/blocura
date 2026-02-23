import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { BlockRegistry } from '../../registry/BlockRegistry'
import type { BlockDefinition } from '../../types'
import { useEditorStore } from '../../store'
import { filterBlockDefinitionsForRoot } from '../../helpers/insertionRules'

interface SlashInserterProps {
  /** Container element that the inserter is anchored to (the PM editor div) */
  anchorEl: Element | null
  rootClientId: string | null
  query: string
  onSelect: (def: BlockDefinition) => void
  onClose: () => void
  showAllByDefault?: boolean
}

export function SlashInserter({
  anchorEl,
  rootClientId,
  query,
  onSelect,
  onClose,
  showAllByDefault = false,
}: SlashInserterProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const blocks = useEditorStore(s => s.blocks)

  const allBlocks = filterBlockDefinitionsForRoot(BlockRegistry.getInsertable(), blocks, rootClientId)
  const filtered = query
    ? allBlocks.filter(
        def =>
          def.title.toLowerCase().includes(query.toLowerCase()) ||
          def.keywords?.some(k => k.toLowerCase().includes(query.toLowerCase()))
      )
    : showAllByDefault
    ? allBlocks
    : allBlocks.slice(0, 8) // Show first 8 by default

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0)
  }, [query, rootClientId, allBlocks.length])

  // Scroll active into view
  useEffect(() => {
    const el = containerRef.current?.querySelector('[data-active="true"]') as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (filtered.length === 0) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(i => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[activeIndex]) onSelect(filtered[activeIndex])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    },
    [filtered, activeIndex, onSelect, onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [handleKeyDown])

  // Close when clicking outside of anchor and popup.
  useEffect(() => {
    if (!anchorEl) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (containerRef.current?.contains(target)) return
      if (anchorEl.contains(target)) return
      onClose()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [anchorEl, onClose])

  if (filtered.length === 0 || !anchorEl) return null

  // Position below the anchor element
  const rect = anchorEl.getBoundingClientRect()
  const top = rect.bottom + window.scrollY + 4
  const left = rect.left + window.scrollX

  return createPortal(
    <div
      role="listbox"
      aria-label="Block inserter"
      ref={containerRef}
      style={{
        position: 'absolute',
        top,
        left,
        backgroundColor: '#fff',
        borderRadius: 4,
        boxShadow: 'var(--wp-popover-shadow)',
        width: 256,
        maxHeight: 320,
        overflowY: 'auto',
        zIndex: 9999,
        padding: '4px 0',
      }}
      onMouseDown={e => e.preventDefault()}
    >
      {filtered.map((def, idx) => (
        <button
          key={def.name}
          type="button"
          role="option"
          aria-selected={idx === activeIndex}
          data-active={idx === activeIndex}
          onClick={() => onSelect(def)}
          onMouseEnter={() => setActiveIndex(idx)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '8px 12px',
            border: 'none',
            background: idx === activeIndex ? 'rgba(56,88,233,0.08)' : 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'var(--wp-font-family)',
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              flexShrink: 0,
              color: idx === activeIndex ? '#3858e9' : '#757575',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {typeof def.icon !== 'string' ? def.icon : null}
          </span>
          <div>
            <div style={{ fontSize: 13, color: '#1e1e1e', fontWeight: 500 }}>{def.title}</div>
            {def.description && (
              <div style={{ fontSize: 11, color: '#757575', marginTop: 1 }}>
                {def.description.slice(0, 60)}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>,
    document.body
  )
}
