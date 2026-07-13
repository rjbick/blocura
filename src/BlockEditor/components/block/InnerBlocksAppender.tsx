import { Plus } from 'lucide-react'
import { createDefaultBlockForRoot } from '../../helpers/insertionRules'
import { useEditorActions, useEditorStore } from '../../store'

interface InnerBlocksAppenderProps {
  rootClientId: string
}

export function InnerBlocksAppender({ rootClientId }: InnerBlocksAppenderProps) {
  const blocks = useEditorStore((state) => state.blocks)
  const target = useEditorStore((state) => state.blocks.find((block) => block.clientId === rootClientId))
  const { insertBlock } = useEditorActions()

  return (
    <button
      type="button"
      onClick={() => {
        const next = createDefaultBlockForRoot(blocks, rootClientId)
        if (!next) return
        insertBlock(next, rootClientId, target?.innerBlocks.length ?? 0)
      }}
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: '1px solid var(--editor-border)',
        backgroundColor: 'var(--editor-surface)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--editor-text)',
      }}
      title="Add block"
    >
      <Plus size={14} />
    </button>
  )
}
