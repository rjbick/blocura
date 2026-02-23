import { Plus } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useEditorActions, useEditorStore } from '../../store'
import { createBlockFromDefinition } from '../../helpers/insertionRules'
import { findBlock } from '../../helpers/flattenBlocks'
import { SlashInserter } from './SlashInserter'
import type { BlockDefinition } from '../../types'

interface BlockAppenderProps {
  rootClientId: string | null
}

export function BlockAppender({ rootClientId }: BlockAppenderProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const blocks = useEditorStore(s => s.blocks)
  const { insertBlock } = useEditorActions()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const insertIndex = useMemo(() => {
    if (rootClientId === null) return blocks.length
    return findBlock(blocks, rootClientId)?.innerBlocks.length ?? blocks.length
  }, [blocks, rootClientId])

  const handleInsertBlock = useCallback((def: BlockDefinition) => {
    insertBlock(createBlockFromDefinition(def), rootClientId, insertIndex)
    setIsPickerOpen(false)
  }, [insertBlock, rootClientId, insertIndex])

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

      {/* Placeholder text */}
      <span
        style={{
          fontSize: 13,
          color: '#949494',
          fontFamily: 'var(--wp-font-family)',
          pointerEvents: 'none',
        }}
      >
        Type / to choose a block
      </span>

      {isPickerOpen && (
        <SlashInserter
          anchorEl={buttonRef.current}
          rootClientId={rootClientId}
          query=""
          showAllByDefault={true}
          onSelect={handleInsertBlock}
          onClose={() => setIsPickerOpen(false)}
        />
      )}
    </div>
  )
}
