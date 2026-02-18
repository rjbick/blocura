import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useEditorActions, useEditorStore } from '../../store'
import { createDefaultBlockForRoot } from '../../helpers/insertionRules'

interface BlockAppenderProps {
  rootClientId: string | null
}

export function BlockAppender({ rootClientId }: BlockAppenderProps) {
  const [isHovered, setIsHovered] = useState(false)
  const blocks = useEditorStore(s => s.blocks)
  const { insertBlock } = useEditorActions()

  const handleClick = () => {
    const block = createDefaultBlockForRoot(blocks, rootClientId)
    if (!block) return
    insertBlock(block, rootClientId, 9999) // append at end
  }

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
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Add block"
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: isHovered
            ? 'var(--wp-components-color-accent)'
            : 'rgba(0,0,0,0.1)',
          color: isHovered ? '#fff' : '#1e1e1e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.1s ease, color 0.1s ease',
          flexShrink: 0,
        }}
      >
        <Plus size={20} />
      </button>

      {/* Placeholder text */}
      {!isHovered && (
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
      )}
    </div>
  )
}
