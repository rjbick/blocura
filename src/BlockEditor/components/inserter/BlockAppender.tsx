import { Plus } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useEditorActions, useEditorStore } from '../../store'
import { createBlockFromDefinition, createDefaultBlockForRoot } from '../../helpers/insertionRules'
import { findBlock } from '../../helpers/flattenBlocks'
import { SlashInserter } from './SlashInserter'
import type { BlockDefinition } from '../../types'

interface BlockAppenderProps {
  rootClientId: string | null
}

export function BlockAppender({ rootClientId }: BlockAppenderProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [quickInput, setQuickInput] = useState('')
  const blocks = useEditorStore(s => s.blocks)
  const { insertBlock, createWarningNotice } = useEditorActions()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const insertIndex = useMemo(() => {
    if (rootClientId === null) return blocks.length
    return findBlock(blocks, rootClientId)?.innerBlocks.length ?? blocks.length
  }, [blocks, rootClientId])

  const escapeHtml = (value: string): string =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const withTextSeed = useCallback((defBlock: ReturnType<typeof createBlockFromDefinition>, text: string) => {
    const escaped = escapeHtml(text)
    const attrs = { ...(defBlock.attributes as Record<string, unknown>) }
    if ('content' in attrs) {
      attrs.content = escaped
      return { ...defBlock, attributes: attrs }
    }
    if ('value' in attrs) {
      attrs.value = escaped
      return { ...defBlock, attributes: attrs }
    }
    if ('text' in attrs) {
      attrs.text = escaped
      return { ...defBlock, attributes: attrs }
    }
    if ('values' in attrs) {
      attrs.values = `<li>${escaped}</li>`
      return { ...defBlock, attributes: attrs }
    }
    return defBlock
  }, [])

  const insertQuickText = useCallback((rawText: string) => {
    const text = rawText.trim()
    if (!text || text.startsWith('/')) return

    const nextBlock = createDefaultBlockForRoot(blocks, rootClientId)
    if (!nextBlock) {
      createWarningNotice('No default block is available in this area.')
      return
    }

    const seededBlock = withTextSeed(nextBlock, text)
    insertBlock(seededBlock, rootClientId, insertIndex)
    setQuickInput('')
  }, [blocks, createWarningNotice, insertBlock, insertIndex, rootClientId, withTextSeed])

  const handleInsertBlock = useCallback((def: BlockDefinition) => {
    const seed = quickInput.trim()
    const block = createBlockFromDefinition(def)
    const seededBlock = seed && !seed.startsWith('/') ? withTextSeed(block, seed) : block
    insertBlock(seededBlock, rootClientId, insertIndex)
    setIsPickerOpen(false)
    setQuickInput('')
  }, [insertBlock, rootClientId, insertIndex, quickInput, withTextSeed])

  const showQuickInput = rootClientId === null
  const quickIsSlash = quickInput.trimStart().startsWith('/')
  const pickerAnchor = inputRef.current ?? buttonRef.current

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
        paddingBlock: 8,
      }}
    >
      <button
        ref={buttonRef}
        className="block-appender-button"
        type="button"
        onClick={() => setIsPickerOpen(v => !v)}
        aria-expanded={isPickerOpen}
        aria-label="Add block"
        style={{
          width: 36,
          height: 36,
          borderRadius: 2,
          backgroundColor: '#fff',
          color: '#1e1e1e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #ddd',
          cursor: 'pointer',
          transition: 'background-color 0.1s ease, color 0.1s ease, border-color 0.1s ease',
          flexShrink: 0,
        }}
      >
        <Plus size={20} />
      </button>

      {showQuickInput && (
        <input
          ref={inputRef}
          type="text"
          value={quickInput}
          onChange={(e) => {
            const nextValue = e.target.value
            const wasSlash = quickInput.trimStart().startsWith('/')
            const isSlash = nextValue.trimStart().startsWith('/')
            setQuickInput(nextValue)
            if (isSlash) {
              setIsPickerOpen(true)
            } else if (wasSlash) {
              setIsPickerOpen(false)
            }
          }}
          onFocus={() => {
            if (quickInput.trimStart().startsWith('/')) {
              setIsPickerOpen(true)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (!quickInput.trim()) {
                setIsPickerOpen(true)
                return
              }
              if (quickInput.trimStart().startsWith('/')) {
                setIsPickerOpen(true)
                return
              }
              insertQuickText(quickInput)
            }
            if (e.key === 'Escape') {
              setIsPickerOpen(false)
            }
          }}
          placeholder="Type text or / to choose a block"
          style={{
            flex: 1,
            minWidth: 180,
            border: 'none',
            borderBottom: '1px solid #dcdcde',
            padding: '6px 4px',
            fontSize: 13,
            color: '#1e1e1e',
            fontFamily: 'var(--editor-font-family)',
            background: 'transparent',
            outline: 'none',
          }}
        />
      )}

      {isPickerOpen && (
        <SlashInserter
          anchorEl={pickerAnchor}
          rootClientId={rootClientId}
          query={quickIsSlash ? quickInput.trimStart().slice(1) : ''}
          showAllByDefault={true}
          searchable={true}
          searchPlaceholder="Search blocks"
          onSelect={handleInsertBlock}
          onClose={() => setIsPickerOpen(false)}
        />
      )}
    </div>
  )
}
