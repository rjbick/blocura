import { Quote as QuoteIcon } from 'lucide-react'
import { RichText } from '../../../components/richtext/RichText'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useEditorActions } from '../../../store'
import { generateClientId } from '../../../helpers/generateClientId'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface QuoteAttributes {
  value: string
  citation: string
  className?: string
  anchor?: string
}

function QuoteEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  insertBlocksAfter,
  mergeBlocks,
  onNavigateOut,
  initialPosition,
  onRemove,
}: BlockEditProps<QuoteAttributes>) {
  const { value, citation } = attributes
  const { insertBlock } = useEditorActions()

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Citation</div>
          <input
            type="text"
            value={attributes.citation || ''}
            onChange={(e) => setAttributes({ citation: e.target.value })}
            placeholder="Source or author"
            style={inspectorInputStyle}
          />
        </div>
      </div>
    ),
    [attributes.citation]
  )

  return (
    <blockquote
      style={{
        margin: 0,
        padding: '0 0 0 20px',
        borderLeft: '4px solid #1e1e1e',
      }}
    >
      <RichText
        tagName="p"
        value={value}
        onChange={(v) => setAttributes({ value: v })}
        placeholder="Write quote…"
        isSelected={isSelected}
        onSplit={(before, after) => {
          setAttributes({ value: before })
          const nextBlock = {
            clientId: generateClientId(),
            name: 'core/paragraph',
            attributes: { content: after },
            innerBlocks: [],
          }
          if (insertBlocksAfter) {
            insertBlocksAfter([nextBlock])
            return
          }
          insertBlock(
            nextBlock,
            null,
            -1
          )
        }}
        onMerge={(forward) => mergeBlocks?.(forward)}
        onNavigateOut={(direction) => onNavigateOut?.(direction)}
        onRemove={(forward) => onRemove?.(forward)}
        initialPosition={initialPosition}
        style={{ fontStyle: 'italic', fontSize: 'inherit' }}
      />
      <RichText
        tagName="cite"
        value={citation}
        onChange={(v) => setAttributes({ citation: v })}
        placeholder="– Citation"
        disableLineBreaks
        style={{
          fontSize: 13,
          fontStyle: 'normal',
          color: '#555',
          display: 'block',
          marginTop: 8,
        }}
      />
    </blockquote>
  )
}

const inspectorLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#50575e',
  marginBottom: 4,
}

const inspectorInputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #dcdcde',
  borderRadius: 2,
  padding: '6px 8px',
  fontSize: 13,
  fontFamily: 'var(--wp-font-family)',
}

export const quoteBlock: BlockDefinition = {
  name: 'core/quote',
  title: 'Quote',
  description: 'Give quoted text visual emphasis.',
  category: 'text',
  icon: <QuoteIcon size={20} />,
  keywords: ['blockquote', 'cite'],
  supports: {
    anchor: true,
    className: true,
    color: { text: true, background: true, gradients: true },
    typography: { fontSize: true },
  },
  attributes: {
    value: { type: 'string' as const, default: '' },
    citation: { type: 'string' as const, default: '' },
    className: { type: 'string' as const, default: '' },
    anchor: { type: 'string' as const, default: '' },
  },
  edit: QuoteEdit,
  save: ({ attributes }) => {
    const { value, citation } = attributes as QuoteAttributes
    const citationHtml = citation
      ? `\n<cite>${citation}</cite>`
      : ''
    return `<blockquote class="wp-block-quote"><p>${value}</p>${citationHtml}\n</blockquote>`
  },
}
