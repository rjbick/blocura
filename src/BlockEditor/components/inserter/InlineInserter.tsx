import { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEditorActions, useEditorStore } from '../../store'
import { createDefaultBlockForRoot } from '../../helpers/insertionRules'

interface InlineInserterProps {
  rootClientId: string | null
  index: number
}

export function InlineInserter({ rootClientId, index }: InlineInserterProps) {
  const [isHovered, setIsHovered] = useState(false)
  const blocks = useEditorStore(s => s.blocks)
  const { insertBlock } = useEditorActions()

  const handleInsertParagraph = useCallback(() => {
    const block = createDefaultBlockForRoot(blocks, rootClientId)
    if (!block) return
    insertBlock(block, rootClientId, index)
  }, [blocks, insertBlock, rootClientId, index])

  return (
    <div
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
        {isHovered && (
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
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.1, ease: 'easeOut' }}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleInsertParagraph()
              }}
              aria-label="Insert block"
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: 'var(--wp-components-color-accent)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                flexShrink: 0,
              }}
            >
              <Plus size={14} />
            </motion.button>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
