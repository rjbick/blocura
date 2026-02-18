import { AlertTriangle } from 'lucide-react'
import type { Block, BlockDefinition } from '../../types'
import { useEditorActions } from '../../store'
import { generateClientId } from '../../helpers/generateClientId'

interface BlockValidationErrorProps {
  block: Block
  def: BlockDefinition | null
}

export function BlockValidationError({ block, def }: BlockValidationErrorProps) {
  const { updateBlockAttributes, replaceBlock, removeBlock } = useEditorActions()

  const handleRecover = () => {
    // Re-run save() and update the block with what it produces
    if (!def) return
    try {
      const regenerated = def.save({
        attributes: block.attributes,
        innerBlocks: block.innerBlocks,
      })
      updateBlockAttributes(block.clientId, {})
      // Mark as valid by updating originalContent
      replaceBlock(block.clientId, {
        ...block,
        clientId: generateClientId(),
        isValid: true,
        originalContent: regenerated,
      })
    } catch {
      // Cannot recover — leave as-is
    }
  }

  const handleConvertToHtml = () => {
    // Convert to a core/html block preserving the original content
    replaceBlock(block.clientId, {
      clientId: generateClientId(),
      name: 'core/html',
      attributes: { content: block.originalContent ?? '' },
      innerBlocks: [],
      isValid: true,
    })
  }

  const handleKeepAsHtml = () => {
    // Keep block shape but bypass validation state
    replaceBlock(block.clientId, {
      ...block,
      clientId: generateClientId(),
      isValid: true,
    })
  }

  const handleDelete = () => {
    removeBlock(block.clientId)
  }

  return (
    <div
      style={{
        border: '1px solid #f0b849',
        borderRadius: 2,
        padding: '16px 20px',
        backgroundColor: '#fef8ee',
        fontFamily: 'var(--wp-font-family)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <AlertTriangle
          size={18}
          style={{ color: '#cc8f00', flexShrink: 0, marginTop: 1 }}
        />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e1e1e', marginBottom: 4 }}>
            This block contains unexpected or invalid content.
          </div>
          <div style={{ fontSize: 12, color: '#757575', lineHeight: 1.5 }}>
            WordPress attempted to recover, but some content may have been lost. You can
            try recovering the block, convert it to HTML, or delete it.
          </div>
        </div>
      </div>

      {/* Original content preview */}
      {block.originalContent && (
        <details style={{ marginBottom: 12 }}>
          <summary
            style={{
              fontSize: 11,
              color: '#757575',
              cursor: 'pointer',
              marginBottom: 4,
            }}
          >
            Show original content
          </summary>
          <pre
            style={{
              fontSize: 11,
              fontFamily: '"Courier New", monospace',
              backgroundColor: '#f6f7f7',
              border: '1px solid #ddd',
              borderRadius: 2,
              padding: '8px 10px',
              margin: '4px 0 0',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              color: '#1e1e1e',
            }}
          >
            {block.originalContent}
          </pre>
        </details>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <ActionButton variant="primary" onClick={handleRecover}>
          Attempt Block Recovery
        </ActionButton>
        <ActionButton variant="secondary" onClick={handleConvertToHtml}>
          Convert to Custom HTML
        </ActionButton>
        <ActionButton variant="secondary" onClick={handleKeepAsHtml}>
          Keep as HTML
        </ActionButton>
        <ActionButton variant="danger" onClick={handleDelete}>
          Delete Block
        </ActionButton>
      </div>
    </div>
  )
}

function ActionButton({
  children,
  onClick,
  variant,
}: {
  children: React.ReactNode
  onClick: () => void
  variant: 'primary' | 'secondary' | 'danger'
}) {
  const styles: React.CSSProperties = {
    height: 32,
    paddingInline: 12,
    borderRadius: 2,
    border: '1px solid',
    fontSize: 12,
    fontFamily: 'var(--wp-font-family)',
    cursor: 'pointer',
    fontWeight: 500,
    ...(variant === 'primary'
      ? {
          backgroundColor: '#2271b1',
          color: '#fff',
          borderColor: '#2271b1',
        }
      : variant === 'danger'
      ? {
          backgroundColor: 'transparent',
          color: '#cc1818',
          borderColor: '#cc1818',
        }
      : {
          backgroundColor: 'transparent',
          color: '#1e1e1e',
          borderColor: '#949494',
        }),
  }

  return (
    <button type="button" onClick={onClick} style={styles}>
      {children}
    </button>
  )
}
