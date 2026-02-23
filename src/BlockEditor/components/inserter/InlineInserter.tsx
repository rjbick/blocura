import { useState, useCallback, useRef } from 'react'
import { Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditorActions } from '../../store'
import { createBlockFromDefinition } from '../../helpers/insertionRules'
import { SlashInserter } from './SlashInserter'
import type { BlockDefinition } from '../../types'

interface InlineInserterProps {
  rootClientId: string | null
  index: number
}

export function InlineInserter({ rootClientId, index }: InlineInserterProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const { insertBlock } = useEditorActions()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleInsertBlock = useCallback((def: BlockDefinition) => {
    insertBlock(createBlockFromDefinition(def), rootClientId, index)
    setIsPickerOpen(false)
    setIsHovered(false)
  }, [insertBlock, rootClientId, index])

  const isVisible = isHovered || isPickerOpen

  return (
    <div
      className="inline-inserter"
      style={{
        height: 16,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBlock: 0,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Blue line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: 'var(--wp-inserter-line-color)',
                transformOrigin: 'left center',
                borderRadius: 1,
              }}
            />

            {/* + button */}
            <motion.button
              ref={buttonRef}
              className="inline-inserter-button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsPickerOpen(v => !v)
              }}
              aria-expanded={isPickerOpen}
              aria-label="Insert block"
              style={{
                width: 24,
                height: 24,
                borderRadius: 2,
                backgroundColor: '#fff',
                color: 'var(--wp-components-color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--wp-inserter-line-color)',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                flexShrink: 0,
              }}
            >
              <Plus size={14} />
            </motion.button>
          </>
        )}
      </AnimatePresence>

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
