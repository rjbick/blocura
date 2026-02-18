import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { BlockRegistry } from '../../registry/BlockRegistry'
import { useEditorActions, useEditorStore } from '../../store'
import type { Block, BlockDefinition } from '../../types'
import type { Pattern } from '../../types'
import { useEditorRuntime } from '../../context'
import { parseBlockMarkup } from '../../helpers/parseBlockMarkup'
import { cloneBlock } from '../../helpers/cloneBlock'
import { findBlock } from '../../helpers/flattenBlocks'
import {
  areBlocksAllowedAtRoot,
  createBlockFromDefinition,
  getInsertTargetFromSelection,
  isBlockNameAllowedAtRoot,
} from '../../helpers/insertionRules'

const CATEGORIES = [
  { slug: 'text', label: 'Text' },
  { slug: 'media', label: 'Media' },
  { slug: 'design', label: 'Design' },
  { slug: 'widgets', label: 'Widgets' },
  { slug: 'theme', label: 'Theme' },
  { slug: 'embed', label: 'Embeds' },
]

export function Inserter() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'blocks' | 'patterns'>('blocks')
  const { insertBlock, insertBlocks, closeInserter, createWarningNotice } = useEditorActions()
  const selectedClientIds = useEditorStore(s => s.selectedClientIds)
  const blocks = useEditorStore(s => s.blocks)
  const { patterns } = useEditorRuntime()

  const getInsertTarget = () => getInsertTargetFromSelection(blocks, selectedClientIds[0] ?? null)
  const { rootClientId: targetRootClientId } = getInsertTarget()
  const targetRootBlock = targetRootClientId ? findBlock(blocks, targetRootClientId) : null
  const allBlocks = BlockRegistry.getInsertable()
  const isAllowedBlock = (def: BlockDefinition) =>
    isBlockNameAllowedAtRoot(def.name, blocks, targetRootClientId)

  const filtered = allBlocks.filter((def) => {
    const matchesQuery =
      !query ||
      def.title.toLowerCase().includes(query.toLowerCase()) ||
      def.keywords?.some((k) => k.toLowerCase().includes(query.toLowerCase()))
    const matchesCategory = !activeCategory || def.category === activeCategory
    return matchesQuery && matchesCategory
  })

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    blocks: filtered.filter((d) => d.category === cat.slug),
  })).filter((g) => g.blocks.length > 0)

  const patternEntries = patterns.filter((pattern) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      pattern.title.toLowerCase().includes(q) ||
      pattern.description?.toLowerCase().includes(q) ||
      pattern.keywords?.some((k) => k.toLowerCase().includes(q))
    )
  }).map((pattern) => {
    let sourceBlocks: Block[] = []
    let parseError = false

    try {
      sourceBlocks = typeof pattern.content === 'string'
        ? parseBlockMarkup(pattern.content)
        : pattern.content
    } catch {
      parseError = true
    }

    const isAllowed = !parseError && areBlocksAllowedAtRoot(sourceBlocks, blocks, targetRootClientId)
    return { pattern, sourceBlocks, isAllowed, parseError }
  })

  const handleInsert = (def: BlockDefinition) => {
    if (!isAllowedBlock(def)) {
      createWarningNotice('This block can’t be inserted here.')
      return
    }
    const { rootClientId, index } = getInsertTarget()
    insertBlock(createBlockFromDefinition(def), rootClientId, index)
    closeInserter()
  }

  const handleInsertPattern = (entry: {
    pattern: Pattern
    sourceBlocks: Block[]
    isAllowed: boolean
    parseError: boolean
  }) => {
    if (entry.parseError) {
      createWarningNotice('This pattern could not be parsed.')
      return
    }
    if (!entry.isAllowed) {
      createWarningNotice('This pattern can’t be inserted here.')
      return
    }
    const blocksToInsert = entry.sourceBlocks.map(cloneBlock)
    if (blocksToInsert.length === 0) return
    const { rootClientId, index } = getInsertTarget()
    if (!areBlocksAllowedAtRoot(blocksToInsert, blocks, rootClientId)) {
      createWarningNotice('Those blocks can’t be inserted here.')
      return
    }
    insertBlocks(blocksToInsert, rootClientId, index)
    closeInserter()
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'var(--wp-font-family)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px 0',
          borderBottom: '1px solid var(--wp-sidebar-border)',
        }}
      >
        {/* Tabs */}
        <div style={{ display: 'flex', marginBottom: 12 }}>
          {(['blocks', 'patterns'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '8px 0',
                fontSize: 13,
                fontFamily: 'inherit',
                fontWeight: activeTab === tab ? 600 : 400,
                color: activeTab === tab ? 'var(--wp-components-color-accent)' : '#1e1e1e',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab
                  ? '2px solid var(--wp-components-color-accent)'
                  : '2px solid transparent',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.1s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#f0f0f0',
            borderRadius: 4,
            padding: '6px 10px',
            marginBottom: 12,
          }}
        >
          <Search size={14} color="#757575" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: 13,
              fontFamily: 'inherit',
              color: '#1e1e1e',
              outline: 'none',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
            >
              <X size={14} color="#757575" />
            </button>
          )}
        </div>

        {activeTab === 'blocks' && targetRootBlock?.name === 'core/columns' && (
          <div
            style={{
              fontSize: 12,
              color: '#757575',
              marginBottom: 10,
            }}
          >
            Only Column blocks can be inserted in this container.
          </div>
        )}
        {activeTab === 'blocks' && targetRootBlock?.name === 'core/buttons' && (
          <div
            style={{
              fontSize: 12,
              color: '#757575',
              marginBottom: 10,
            }}
          >
            Only Button blocks can be inserted in this container.
          </div>
        )}
        {activeTab === 'blocks' && targetRootBlock?.name === 'core/list' && (
          <div
            style={{
              fontSize: 12,
              color: '#757575',
              marginBottom: 10,
            }}
          >
            Only List Item blocks can be inserted in this container.
          </div>
        )}
        {activeTab === 'blocks' && targetRootBlock?.name === 'core/list-item' && (
          <div
            style={{
              fontSize: 12,
              color: '#757575',
              marginBottom: 10,
            }}
          >
            Only List blocks can be inserted in this container.
          </div>
        )}
        {activeTab === 'blocks' && targetRootBlock?.name === 'core/navigation' && (
          <div
            style={{
              fontSize: 12,
              color: '#757575',
              marginBottom: 10,
            }}
          >
            Only Navigation Link blocks can be inserted in this container.
          </div>
        )}
        {activeTab === 'blocks' && targetRootBlock?.name === 'core/social-links' && (
          <div
            style={{
              fontSize: 12,
              color: '#757575',
              marginBottom: 10,
            }}
          >
            Only Social Icon blocks can be inserted in this container.
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {activeTab === 'blocks' && (
          <>
            {query ? (
              // Flat list when searching
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 4,
                  padding: '0 8px',
                }}
              >
                {filtered.map((def) => (
                  <BlockIcon
                    key={def.name}
                    def={def}
                    onClick={() => handleInsert(def)}
                    disabled={!isAllowedBlock(def)}
                    onDisabledClick={() => createWarningNotice('This block can’t be inserted here.')}
                  />
                ))}
              </div>
            ) : (
              // Grouped by category
              grouped.map((group) => (
                <div key={group.slug}>
                  <div
                    style={{
                      padding: '8px 16px 4px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#757575',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {group.label}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 4,
                      padding: '0 8px',
                      marginBottom: 8,
                    }}
                  >
                    {group.blocks.map((def) => (
                      <BlockIcon
                        key={def.name}
                        def={def}
                        onClick={() => handleInsert(def)}
                        disabled={!isAllowedBlock(def)}
                        onDisabledClick={() => createWarningNotice('This block can’t be inserted here.')}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}

            {filtered.length === 0 && (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: '#757575',
                  fontSize: 13,
                }}
              >
                {query ? `No blocks found for "${query}"` : 'No blocks available here'}
              </div>
            )}
          </>
        )}

        {activeTab === 'patterns' && (
          <div style={{ padding: '8px 8px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {patternEntries.length === 0 ? (
              <div
                style={{
                  padding: '24px 12px',
                  textAlign: 'center',
                  color: '#757575',
                  fontSize: 13,
                }}
              >
                No patterns found{query ? ` for "${query}"` : ''}
              </div>
            ) : (
              patternEntries.map((entry) => (
                <button
                  key={entry.pattern.name}
                  type="button"
                  onClick={() => handleInsertPattern(entry)}
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 4,
                    backgroundColor: entry.isAllowed ? '#fff' : '#f7f7f7',
                    textAlign: 'left',
                    padding: '10px 12px',
                    cursor: entry.isAllowed ? 'pointer' : 'not-allowed',
                    opacity: entry.isAllowed ? 1 : 0.65,
                    transition: 'border-color 0.1s ease, background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!entry.isAllowed) return
                    e.currentTarget.style.borderColor = 'var(--wp-components-color-accent)'
                    e.currentTarget.style.backgroundColor = 'rgba(56,88,233,0.03)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0'
                    e.currentTarget.style.backgroundColor = entry.isAllowed ? '#fff' : '#f7f7f7'
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e1e1e' }}>{entry.pattern.title}</div>
                  {entry.pattern.description && (
                    <div style={{ fontSize: 12, color: '#757575', marginTop: 4 }}>
                      {entry.pattern.description}
                    </div>
                  )}
                  {!entry.isAllowed && (
                    <div style={{ fontSize: 11, color: '#757575', marginTop: 6 }}>
                      Not available in this container
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface BlockIconProps {
  def: BlockDefinition
  onClick: () => void
  disabled?: boolean
  onDisabledClick?: () => void
}

function BlockIcon({ def, onClick, disabled = false, onDisabledClick }: BlockIconProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      type="button"
      onClick={() => {
        if (disabled) {
          onDisabledClick?.()
          return
        }
        onClick()
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`Insert ${def.title}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '12px 8px',
        borderRadius: 4,
        border: 'none',
        backgroundColor: disabled
          ? '#f7f7f7'
          : isHovered
          ? 'rgba(var(--wp-components-color-accent-rgb), 0.08)'
          : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.65 : 1,
        transition: 'background-color 0.05s ease',
        fontFamily: 'var(--wp-font-family)',
      }}
    >
      <span
        style={{
          fontSize: 24,
          lineHeight: 1,
          color: disabled
            ? '#757575'
            : isHovered
            ? 'var(--wp-components-color-accent)'
            : '#1e1e1e',
        }}
      >
        {typeof def.icon === 'string' ? def.icon : def.icon}
      </span>
      <span
        style={{
          fontSize: 11,
          color: disabled
            ? '#757575'
            : isHovered
            ? 'var(--wp-components-color-accent)'
            : '#1e1e1e',
          textAlign: 'center',
          lineHeight: 1.3,
          wordBreak: 'break-word',
        }}
      >
        {def.title}
      </span>
    </button>
  )
}
