import { Text } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { RichText } from '../../../components/richtext/RichText'
import { useEditorActions } from '../../../store'
import { generateClientId } from '../../../helpers/generateClientId'
import { flattenBlocks } from '../../../helpers/flattenBlocks'
import { useEditorStore } from '../../../store'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface PreformattedAttrs {
  content: string
  className?: string
  anchor?: string
}

function PreformattedEdit({
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
}: BlockEditProps<PreformattedAttrs>) {
  const { insertBlock } = useEditorActions()
  const blocks = useEditorStore(s => s.blocks)

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Preformatted text</div>
          <textarea
            value={attributes.content || ''}
            onChange={(e) => setAttributes({ content: e.target.value })}
            placeholder="Write preformatted text…"
            rows={8}
            style={inspectorTextareaStyle}
          />
        </div>
      </div>
    ),
    [attributes.content]
  )

  return (
    <pre
      style={{
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: 15,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        background: '#f6f7f7',
        borderRadius: 2,
        padding: '16px 20px',
        margin: 0,
        overflowX: 'auto',
        border: isSelected ? '1px solid transparent' : '1px solid transparent',
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
            name: 'core/preformatted',
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
        placeholder="Write preformatted text…"
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

const inspectorTextareaStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #dcdcde',
  borderRadius: 2,
  padding: '6px 8px',
  fontSize: 13,
  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
  resize: 'vertical',
}

export const preformattedBlock: BlockDefinition = {
  name: 'core/preformatted',
  title: 'Preformatted',
  description: 'Add text that respects your spacing and tabs, and also allows styling.',
  category: 'text',
  icon: <Text size={20} />,
  keywords: ['pre', 'code', 'text', 'monospace'],
  supports: {
    anchor: true,
    className: true,
    color: { text: true, background: true },
    typography: { fontSize: true, lineHeight: true },
    spacing: { padding: true, margin: true },
  },
  attributes: {
    content: { type: 'string', source: 'html', selector: 'pre', default: '' },
    className: { type: 'string' },
    anchor: { type: 'string' },
  },
  edit: PreformattedEdit as BlockDefinition['edit'],
  save: ({ attributes }) => {
    const { content, className, anchor } = attributes as PreformattedAttrs
    const classes = ['editor-block-preformatted']
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    return `<pre class="${classes.join(' ')}"${anchorAttr}>${content}</pre>`
  },
}
