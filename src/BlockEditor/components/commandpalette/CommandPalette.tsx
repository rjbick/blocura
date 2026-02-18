import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { useEditorStore, useEditorActions } from '../../store'
import { BlockRegistry } from '../../registry/BlockRegistry'
import { findBlock, findBlockParent } from '../../helpers/flattenBlocks'
import { blocksToBlockMarkup } from '../../helpers/blocksToBlockMarkup'
import {
  createBlockFromDefinition,
  createDefaultBlockForRoot,
  filterBlockDefinitionsForRoot,
  getInsertTargetFromSelection,
} from '../../helpers/insertionRules'

interface Command {
  id: string
  label: string
  category: string
  icon?: React.ReactNode
  action: () => void
}

function useCommands(query: string, closeAndRun: (fn: () => void) => void): Command[] {
  const {
    insertBlock,
    duplicateBlock,
    removeBlock,
    toggleListView,
    toggleFullscreen,
    toggleDistractionFree,
    toggleZoomOut,
    toggleSpotlightMode,
    openPreferences,
    openKeyboardShortcuts,
  } = useEditorActions()
  const selectedClientId = useEditorStore(s => s.selectedClientIds[0] ?? null)
  const blocks = useEditorStore(s => s.blocks)
  const insertTarget = getInsertTargetFromSelection(blocks, selectedClientId)

  const blockCommands: Command[] = filterBlockDefinitionsForRoot(
    BlockRegistry.getInsertable(),
    blocks,
    insertTarget.rootClientId
  ).map((def) => ({
    id: `insert-${def.name}`,
    label: `${def.title}`,
    category: 'Blocks',
    icon: typeof def.icon === 'string' ? null : def.icon,
    action: () => closeAndRun(() => {
      insertBlock(createBlockFromDefinition(def), insertTarget.rootClientId, insertTarget.index)
    }),
  }))

  const selectionCommands: Command[] = selectedClientId ? [
    {
      id: 'duplicate-block',
      label: 'Duplicate block',
      category: 'Selection',
      action: () => closeAndRun(() => duplicateBlock(selectedClientId)),
    },
    {
      id: 'delete-block',
      label: 'Delete block',
      category: 'Selection',
      action: () => closeAndRun(() => removeBlock(selectedClientId)),
    },
    {
      id: 'copy-block',
      label: 'Copy block',
      category: 'Selection',
      action: () => closeAndRun(() => {
        const block = findBlock(blocks, selectedClientId)
        if (!block) return
        navigator.clipboard?.writeText(blocksToBlockMarkup([block])).catch(() => {})
      }),
    },
    {
      id: 'insert-before',
      label: 'Insert block before',
      category: 'Selection',
      action: () => closeAndRun(() => {
        const parent = findBlockParent(blocks, selectedClientId)
        const siblings = parent ? parent.innerBlocks : blocks
        const idx = siblings.findIndex((b) => b.clientId === selectedClientId)
        if (idx === -1) return
        const block = createDefaultBlockForRoot(blocks, parent?.clientId ?? null)
        if (!block) return
        insertBlock(block, parent?.clientId ?? null, idx)
      }),
    },
    {
      id: 'insert-after',
      label: 'Insert block after',
      category: 'Selection',
      action: () => closeAndRun(() => {
        const parent = findBlockParent(blocks, selectedClientId)
        const siblings = parent ? parent.innerBlocks : blocks
        const idx = siblings.findIndex((b) => b.clientId === selectedClientId)
        if (idx === -1) return
        const block = createDefaultBlockForRoot(blocks, parent?.clientId ?? null)
        if (!block) return
        insertBlock(block, parent?.clientId ?? null, idx + 1)
      }),
    },
  ] : []

  const viewCommands: Command[] = [
    {
      id: 'toggle-list-view',
      label: 'Toggle List View',
      category: 'View',
      action: () => closeAndRun(() => toggleListView()),
    },
    {
      id: 'toggle-fullscreen',
      label: 'Toggle Fullscreen',
      category: 'View',
      action: () => closeAndRun(() => toggleFullscreen()),
    },
    {
      id: 'toggle-distraction-free',
      label: 'Toggle Distraction Free',
      category: 'View',
      action: () => closeAndRun(() => toggleDistractionFree()),
    },
    {
      id: 'toggle-spotlight',
      label: 'Toggle Spotlight Mode',
      category: 'View',
      action: () => closeAndRun(() => toggleSpotlightMode()),
    },
    {
      id: 'toggle-zoom-out',
      label: 'Toggle Zoom Out',
      category: 'View',
      action: () => closeAndRun(() => toggleZoomOut()),
    },
  ]

  const editorCommands: Command[] = [
    {
      id: 'open-preferences',
      label: 'Preferences',
      category: 'Editor',
      action: () => closeAndRun(() => openPreferences()),
    },
    {
      id: 'open-keyboard-shortcuts',
      label: 'Keyboard shortcuts',
      category: 'Editor',
      action: () => closeAndRun(() => openKeyboardShortcuts()),
    },
  ]

  const allCommands = [...selectionCommands, ...viewCommands, ...editorCommands, ...blockCommands]

  if (!query.trim()) return allCommands

  const q = query.toLowerCase()
  return allCommands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
  )
}

export function CommandPalette() {
  const isOpen = useEditorStore(s => s.commandPaletteOpen)
  const { closeCommandPalette } = useEditorActions()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const closeAndRun = useCallback((fn: () => void) => {
    closeCommandPalette()
    setQuery('')
    setActiveIndex(0)
    fn()
  }, [closeCommandPalette])

  const commands = useCommands(query, closeAndRun)

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const active = list.querySelector('[data-active="true"]') as HTMLElement
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, commands.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      commands[activeIndex]?.action()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeCommandPalette()
      setQuery('')
    }
  }

  if (!isOpen) return null

  // Group by category
  const grouped: { category: string; items: Command[] }[] = []
  for (const cmd of commands) {
    const existing = grouped.find(g => g.category === cmd.category)
    if (existing) {
      existing.items.push(cmd)
    } else {
      grouped.push({ category: cmd.category, items: [cmd] })
    }
  }

  let globalIndex = 0

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={() => { closeCommandPalette(); setQuery('') }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 10001,
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-label="Command palette"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 560,
          maxHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fff',
          borderRadius: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.1)',
          zIndex: 10002,
          overflow: 'hidden',
        }}
      >
        {/* Search bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            borderBottom: '1px solid #e0e0e0',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <Search size={16} style={{ color: '#757575', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              padding: '14px 0',
              fontSize: 14,
              fontFamily: 'var(--wp-font-family)',
              color: '#1e1e1e',
              background: 'transparent',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#757575',
                padding: 4,
                display: 'flex',
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          role="listbox"
          style={{
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {commands.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: '#757575',
                fontSize: 13,
                fontFamily: 'var(--wp-font-family)',
              }}
            >
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            grouped.map(group => (
              <div key={group.category}>
                <div
                  style={{
                    padding: '8px 16px 4px',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#757575',
                    fontFamily: 'var(--wp-font-family)',
                  }}
                >
                  {group.category}
                </div>
                {group.items.map(cmd => {
                  const itemIndex = globalIndex++
                  const isActive = itemIndex === activeIndex
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      data-active={isActive}
                      onClick={cmd.action}
                      onMouseEnter={() => setActiveIndex(itemIndex)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '8px 16px',
                        border: 'none',
                        background: isActive ? 'rgba(56,88,233,0.08)' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'var(--wp-font-family)',
                        fontSize: 13,
                        color: isActive ? '#3858e9' : '#1e1e1e',
                        transition: 'background-color 0.05s ease',
                      }}
                    >
                      {cmd.icon && (
                        <span style={{ width: 20, height: 20, flexShrink: 0, color: isActive ? '#3858e9' : '#757575', display: 'flex', alignItems: 'center' }}>
                          {cmd.icon}
                        </span>
                      )}
                      <span>{cmd.label}</span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
