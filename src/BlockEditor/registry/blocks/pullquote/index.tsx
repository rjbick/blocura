import { MessageSquareQuote } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { RichText } from '../../../components/richtext/RichText'
import { useEditorActions, useEditorStore } from '../../../store'
import { generateClientId } from '../../../helpers/generateClientId'
import { flattenBlocks } from '../../../helpers/flattenBlocks'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface PullquoteAttrs {
  value: string
  citation: string
  textAlign?: string
  className?: string
  anchor?: string
}

function PullquoteEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  insertBlocksAfter,
  mergeBlocks,
  onReplace,
  onNavigateOut,
  initialPosition,
  onRemove,
}: BlockEditProps<PullquoteAttrs>) {
  const { insertBlock } = useEditorActions()
  const blocks = useEditorStore(s => s.blocks)
  const textAlign = attributes.textAlign || 'center'

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
            placeholder="Add citation"
            style={inspectorInputStyle}
          />
        </div>

        <div>
          <div style={inspectorLabelStyle}>Text alignment</div>
          <select
            value={textAlign}
            onChange={(e) => setAttributes({ textAlign: e.target.value })}
            style={inspectorInputStyle}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
    ),
    [attributes.citation, textAlign]
  )

  return (
    <figure
      style={{
        margin: '0',
        padding: '28px 0',
        borderTop: '4px solid #1e1e1e',
        borderBottom: '4px solid #1e1e1e',
        textAlign: textAlign as React.CSSProperties['textAlign'],
      }}
    >
      <blockquote style={{ margin: 0 }}>
        <RichText
          tagName="p"
          value={attributes.value}
          onChange={value => setAttributes({ value })}
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
            const flat = flattenBlocks(blocks)
            const idx = flat.findIndex(b => b.clientId === clientId)
            insertBlock(
              nextBlock,
              null,
              idx + 1
            )
          }}
          onMerge={(forward) => mergeBlocks?.(forward)}
          onReplace={(blocks) => onReplace?.(blocks)}
          onNavigateOut={(direction) => onNavigateOut?.(direction)}
          onRemove={(forward) => onRemove?.(forward)}
          placeholder="Add quote text…"
          isSelected={isSelected}
          initialPosition={initialPosition}
          style={{
            fontSize: 28,
            fontStyle: 'italic',
            lineHeight: 1.4,
            margin: 0,
            padding: 0,
            fontWeight: 300,
          }}
        />
        <RichText
          tagName="cite"
          value={attributes.citation}
          onChange={citation => setAttributes({ citation })}
          placeholder="Add citation"
          isSelected={isSelected}
          style={{
            display: 'block',
            fontSize: 13,
            fontStyle: 'normal',
            marginTop: 16,
            color: '#757575',
          }}
        />
      </blockquote>
    </figure>
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
  fontFamily: 'var(--editor-font-family)',
}

export const pullquoteBlock: BlockDefinition = {
  name: 'core/pullquote',
  title: 'Pullquote',
  description: 'Give special visual emphasis to a quote from your post or page.',
  category: 'text',
  icon: <MessageSquareQuote size={20} />,
  keywords: ['quote', 'pullquote', 'blockquote', 'cite'],
  supports: {
    anchor: true,
    className: true,
    color: { text: true, background: true, gradients: true },
    typography: { fontSize: true, lineHeight: true, fontFamily: true },
    spacing: { padding: true, margin: true },
  },
  attributes: {
    value: { type: 'string', source: 'html', selector: 'p', default: '' },
    citation: { type: 'string', source: 'html', selector: 'cite', default: '' },
    textAlign: { type: 'string' },
    className: { type: 'string' },
    anchor: { type: 'string' },
  },
  edit: PullquoteEdit as BlockDefinition['edit'],
  save: ({ attributes }) => {
    const { value, citation, textAlign, className, anchor } = attributes as PullquoteAttrs
    const classes = ['editor-block-pullquote']
    if (textAlign) classes.push(`has-text-align-${textAlign}`)
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const citeHtml = citation ? `<cite>${citation}</cite>` : ''
    return `<figure class="${classes.join(' ')}"${anchorAttr}><blockquote><p>${value}</p>${citeHtml}</blockquote></figure>`
  },
}
