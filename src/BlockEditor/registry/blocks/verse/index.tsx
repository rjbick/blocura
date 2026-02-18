import { PenLine } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { RichText } from '../../../components/richtext/RichText'
import { useEditorActions, useEditorStore } from '../../../store'
import { generateClientId } from '../../../helpers/generateClientId'
import { flattenBlocks } from '../../../helpers/flattenBlocks'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface VerseAttrs {
  content: string
  textAlign?: string
  className?: string
  anchor?: string
}

function VerseEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  insertBlocksAfter,
  mergeBlocks,
  onNavigateOut,
  initialPosition,
  onRemove,
}: BlockEditProps<VerseAttrs>) {
  const { insertBlock } = useEditorActions()
  const blocks = useEditorStore(s => s.blocks)
  const textAlign = attributes.textAlign || 'left'

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
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
    [textAlign]
  )

  return (
    <pre
      style={{
        fontFamily: 'var(--wp-font-family)',
        fontSize: 16,
        lineHeight: 1.8,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        margin: 0,
        padding: 0,
        background: 'transparent',
        border: 'none',
        textAlign: textAlign as React.CSSProperties['textAlign'],
      }}
    >
      <RichText
        tagName="span"
        value={attributes.content}
        onChange={content => setAttributes({ content })}
        onSplit={(before, after) => {
          setAttributes({ content: before })
          const nextBlock = {
            clientId: generateClientId(),
            name: 'core/verse',
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
        onNavigateOut={(direction) => onNavigateOut?.(direction)}
        onRemove={(forward) => onRemove?.(forward)}
        placeholder="Write verse…"
        isSelected={isSelected}
        initialPosition={initialPosition}
        preserveWhiteSpace
        style={{
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit',
          whiteSpace: 'pre-wrap',
          display: 'block',
        }}
      />
    </pre>
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

export const verseBlock: BlockDefinition = {
  name: 'core/verse',
  title: 'Verse',
  description: 'Insert poetry. Use special spacing formats. Or quote song lyrics.',
  category: 'text',
  icon: <PenLine size={20} />,
  keywords: ['poetry', 'poem', 'verse', 'lyrics', 'text'],
  supports: {
    anchor: true,
    className: true,
    color: { text: true, background: true },
    typography: { fontSize: true, lineHeight: true, fontFamily: true },
    spacing: { padding: true, margin: true },
  },
  attributes: {
    content: { type: 'string', source: 'html', selector: 'pre', default: '' },
    textAlign: { type: 'string' },
    className: { type: 'string' },
    anchor: { type: 'string' },
  },
  edit: VerseEdit as BlockDefinition['edit'],
  save: ({ attributes }) => {
    const { content, textAlign, className, anchor } = attributes as VerseAttrs
    const classes = ['wp-block-verse']
    if (textAlign) classes.push(`has-text-align-${textAlign}`)
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    return `<pre class="${classes.join(' ')}"${anchorAttr}>${content}</pre>`
  },
}
