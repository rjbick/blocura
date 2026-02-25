import { ListTree } from 'lucide-react'
import { RichText } from '../../../components/richtext/RichText'
import { BlockList } from '../../../components/block/BlockList'
import { BlockAppender } from '../../../components/inserter/BlockAppender'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useEditorStore } from '../../../store'
import { findBlockParent } from '../../../helpers/flattenBlocks'
import { generateClientId } from '../../../helpers/generateClientId'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface ListItemAttributes {
  content: string
  className?: string
  anchor?: string
}

interface ParentListAttributes {
  ordered?: boolean
  start?: number
}

function ListItemEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  innerBlocks = [],
  insertBlocksAfter,
  mergeBlocks,
  onReplace,
  onNavigateOut,
  initialPosition,
  onRemove,
}: BlockEditProps<ListItemAttributes>) {
  const blocks = useEditorStore((s) => s.blocks)
  const parent = findBlockParent(blocks, clientId)
  const siblings = parent?.innerBlocks.filter((block) => block.name === 'core/list-item') ?? []
  const siblingIndex = siblings.findIndex((block) => block.clientId === clientId)
  const parentAttrs = (parent?.attributes ?? {}) as ParentListAttributes

  const marker = parent?.name === 'core/list' && parentAttrs.ordered
    ? `${(parentAttrs.start ?? 1) + Math.max(0, siblingIndex)}.`
    : '•'

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ fontSize: 12, color: '#757575' }}>
          Marker: {marker}
        </div>
        <div>
          <div style={inspectorLabelStyle}>Item text</div>
          <textarea
            value={attributes.content || ''}
            onChange={(e) => setAttributes({ content: e.target.value })}
            rows={3}
            style={inspectorTextareaStyle}
          />
        </div>
      </div>
    ),
    [attributes.content, marker]
  )

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <span
        aria-hidden
        style={{
          minWidth: 22,
          color: '#555',
          fontSize: 14,
          lineHeight: 1.8,
          textAlign: 'right',
          userSelect: 'none',
          fontFamily: 'var(--editor-font-family)',
        }}
      >
        {marker}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <RichText
          tagName="span"
          value={attributes.content}
          onChange={(content) => setAttributes({ content })}
          placeholder="List item"
          isSelected={isSelected}
          onSplit={(before, after) => {
            setAttributes({ content: before })
            insertBlocksAfter?.([{
              clientId: generateClientId(),
              name: 'core/list-item',
              attributes: { content: after },
              innerBlocks: [],
            }])
          }}
          onMerge={(forward) => mergeBlocks?.(forward)}
          onReplace={(blocks) => onReplace?.(blocks)}
          onNavigateOut={(direction) => onNavigateOut?.(direction)}
          onRemove={(forward) => onRemove?.(forward)}
          initialPosition={initialPosition}
          style={{
            display: 'inline',
            lineHeight: 1.8,
            fontSize: 16,
          }}
        />

        {(innerBlocks.length > 0 || isSelected) && (
          <div style={{ marginTop: 6, paddingLeft: 12 }}>
            <BlockList blocks={innerBlocks} rootClientId={clientId} />
            {isSelected && <BlockAppender rootClientId={clientId} />}
          </div>
        )}
      </div>
    </div>
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
  fontFamily: 'var(--editor-font-family)',
  resize: 'vertical',
}

export const listItemBlock: BlockDefinition = {
  name: 'core/list-item',
  title: 'List Item',
  description: 'An individual item inside a list.',
  category: 'text',
  icon: <ListTree size={20} />,
  keywords: ['li', 'item'],
  supports: {
    inserter: false,
    className: true,
    anchor: true,
    splitting: true,
  },
  attributes: {
    content: { type: 'string', default: '' },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: ListItemEdit,
  save: ({ attributes, innerBlocks = [] }) => {
    const { content = '', className, anchor } = attributes as ListItemAttributes
    const classes = className ? ` class="${className}"` : ''
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const nested = innerBlocks.length > 0 ? '<!--inner-->' : ''
    return `<li${classes}${anchorAttr}>${content}${nested}</li>`
  },
  merge: (baseAttrs, mergeAttrs) => ({
    ...baseAttrs,
    content: `${String(baseAttrs.content ?? '')}${String(mergeAttrs.content ?? '')}`,
  }),
}
