import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { BlockRegistry } from '../../registry/BlockRegistry'
import { useEditorActions, useEditorStore } from '../../store'
import type { Block, BlockDefinition } from '../../types'
import type { Pattern } from '../../types'
import { useEditorRuntime } from '../../context'
import { parseHtmlToBlocks } from '../../helpers/parseHtmlToBlocks'
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
  const {
    insertBlock,
    insertBlocks,
    closeInserter,
    createWarningNotice,
    createSyncedPattern,
    insertSyncedPattern,
  } = useEditorActions()
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
      if (typeof pattern.content === 'string') {
        sourceBlocks = parseHtmlToBlocks(pattern.content)
      } else {
        sourceBlocks = pattern.content
      }
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

  const handleInsertSyncedPattern = (entry: {
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

    const sourceBlocks = entry.sourceBlocks.map(cloneBlock)
    if (sourceBlocks.length === 0) return

    const patternId = createSyncedPattern(entry.pattern.title, sourceBlocks)
    const { rootClientId, index } = getInsertTarget()
    insertSyncedPattern(patternId, rootClientId, index)
    closeInserter()
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'var(--editor-font-family)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px 0',
          borderBottom: '1px solid var(--editor-sidebar-border)',
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
                color: activeTab === tab ? 'var(--editor-components-color-accent)' : 'var(--editor-text)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab
                  ? '2px solid var(--editor-components-color-accent)'
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
            backgroundColor: 'var(--editor-surface-alt)',
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
              color: 'var(--editor-text)',
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

        {activeTab === 'blocks' && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              paddingBottom: 10,
              marginBottom: 2,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`inserter-category-chip${activeCategory === null ? ' inserter-category-chip--active' : ''}`}
              style={{
                padding: '4px 8px',
                borderRadius: 999,
                border: '1px solid var(--editor-border)',
                backgroundColor: activeCategory === null ? 'rgba(var(--editor-components-color-accent-rgb), 0.1)' : 'var(--editor-surface)',
                color: activeCategory === null ? 'var(--editor-components-color-accent)' : 'var(--editor-text)',
                fontSize: 11,
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              All
            </button>
            {CATEGORIES.map((category) => {
              const count = allBlocks.filter((block) => block.category === category.slug).length
              if (count === 0) return null
              const isActive = activeCategory === category.slug
              return (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => setActiveCategory(isActive ? null : category.slug)}
                  className={`inserter-category-chip${isActive ? ' inserter-category-chip--active' : ''}`}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 999,
                    border: '1px solid var(--editor-border)',
                    backgroundColor: isActive ? 'rgba(var(--editor-components-color-accent-rgb), 0.1)' : 'var(--editor-surface)',
                    color: isActive ? 'var(--editor-components-color-accent)' : 'var(--editor-text)',
                    fontSize: 11,
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {category.label}
                </button>
              )
            })}
          </div>
        )}

        {activeTab === 'blocks' && targetRootBlock?.name === 'core/columns' && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--editor-text-muted)',
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
              color: 'var(--editor-text-muted)',
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
              color: 'var(--editor-text-muted)',
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
              color: 'var(--editor-text-muted)',
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
              color: 'var(--editor-text-muted)',
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
              color: 'var(--editor-text-muted)',
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
                      color: 'var(--editor-text-muted)',
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
                  color: 'var(--editor-text-muted)',
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
                  color: 'var(--editor-text-muted)',
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
                  className="inserter-pattern-card"
                  data-disabled={entry.isAllowed ? 'false' : 'true'}
                  style={{
                    border: '1px solid var(--editor-border)',
                    borderRadius: 4,
                    backgroundColor: entry.isAllowed ? 'var(--editor-surface)' : 'var(--editor-surface-alt)',
                    textAlign: 'left',
                    padding: '10px 12px',
                    cursor: entry.isAllowed ? 'pointer' : 'not-allowed',
                    opacity: entry.isAllowed ? 1 : 0.65,
                    transition: 'border-color 0.1s ease, background-color 0.1s ease',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--editor-text)' }}>{entry.pattern.title}</div>
                  {entry.pattern.description && (
                    <div style={{ fontSize: 12, color: 'var(--editor-text-muted)', marginTop: 4 }}>
                      {entry.pattern.description}
                    </div>
                  )}
                  {!entry.isAllowed && (
                    <div style={{ fontSize: 11, color: 'var(--editor-text-muted)', marginTop: 6 }}>
                      Not available in this container
                    </div>
                  )}
                  {entry.isAllowed && (
                    <div
                      style={{
                        marginTop: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 11, color: 'var(--editor-text-muted)' }}>Insert pattern</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          handleInsertSyncedPattern(entry)
                        }}
                        style={{
                          border: '1px solid var(--editor-border)',
                          borderRadius: 2,
                          backgroundColor: 'var(--editor-surface)',
                          color: 'var(--editor-text)',
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          cursor: 'pointer',
                        }}
                        title="Insert as synced pattern"
                      >
                        Synced
                      </button>
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
  return (
    <button
      className="inserter-block-icon"
      type="button"
      onClick={() => {
        if (disabled) {
          onDisabledClick?.()
          return
        }
        onClick()
      }}
      data-disabled={disabled ? 'true' : 'false'}
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
        backgroundColor: disabled ? 'var(--editor-surface-alt)' : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.65 : 1,
        transition: 'background-color 0.05s ease',
        fontFamily: 'var(--editor-font-family)',
      }}
    >
      <span
        className="inserter-block-icon-icon"
        style={{
          fontSize: 24,
          lineHeight: 1,
          color: disabled ? 'var(--editor-text-muted)' : 'var(--editor-text)',
        }}
      >
        {typeof def.icon === 'string' ? def.icon : def.icon}
      </span>
      <span
        className="inserter-block-icon-label"
        style={{
          fontSize: 11,
          color: disabled ? 'var(--editor-text-muted)' : 'var(--editor-text)',
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
