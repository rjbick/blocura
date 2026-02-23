import { Group as GroupIcon } from 'lucide-react'
import type { ElementType } from 'react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { BlockList } from '../../../components/block/BlockList'
import { BlockAppender } from '../../../components/inserter/BlockAppender'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface GroupAttributes {
  tagName: string
  className?: string
  anchor?: string
  style?: Record<string, unknown>
  backgroundColor?: string
  textColor?: string
  gradient?: string
  layout?: Record<string, unknown>
}

function GroupEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  innerBlocks = [],
}: BlockEditProps<GroupAttributes>) {
  const { tagName = 'div', backgroundColor, style } = attributes

  const Tag = (tagName || 'div') as ElementType

  const bgColor = backgroundColor
    ? `var(--editor--preset--color--${backgroundColor})`
    : (style as { color?: { background?: string } })?.color?.background

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>HTML element</div>
          <select
            value={tagName}
            onChange={(e) => setAttributes({ tagName: e.target.value })}
            style={inspectorInputStyle}
          >
            <option value="div">div</option>
            <option value="section">section</option>
            <option value="article">article</option>
            <option value="main">main</option>
            <option value="aside">aside</option>
          </select>
        </div>
      </div>
    ),
    [tagName]
  )

  return (
    <Tag
      style={{
        padding: '24px',
        backgroundColor: bgColor as string | undefined,
        minHeight: innerBlocks.length === 0 ? 64 : undefined,
        border: innerBlocks.length === 0 && isSelected ? '1px dashed #ddd' : undefined,
        borderRadius: 2,
      }}
    >
      <BlockList blocks={innerBlocks} rootClientId={clientId} />
      {innerBlocks.length === 0 && isSelected && (
        <BlockAppender rootClientId={clientId} />
      )}
    </Tag>
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

export const groupBlock: BlockDefinition = {
  name: 'core/group',
  title: 'Group',
  description: 'Gather blocks in a layout container.',
  category: 'design',
  icon: <GroupIcon size={20} />,
  keywords: ['container', 'wrapper', 'row', 'stack'],
  supports: {
    anchor: true,
    align: ['wide', 'full'],
    className: true,
    color: { text: true, background: true, gradients: true },
    spacing: { padding: true, margin: true, blockGap: true },
    border: { color: true, radius: true, style: true, width: true },
    layout: true,
  },
  attributes: {
    tagName: { type: 'string' as const, default: 'div' },
    className: { type: 'string' as const, default: '' },
    anchor: { type: 'string' as const, default: '' },
    style: { type: 'object' as const, default: {} },
    backgroundColor: { type: 'string' as const, default: '' },
    textColor: { type: 'string' as const, default: '' },
    gradient: { type: 'string' as const, default: '' },
    layout: { type: 'object' as const, default: {} },
  },
  edit: GroupEdit,
  save: ({ attributes, innerBlocks = [] }) => {
    const { tagName = 'div', className } = attributes as GroupAttributes
    const classAttr = ['editor-block-group', className].filter(Boolean).join(' ')
    // Inner blocks HTML would be serialized separately
    const innerHtml = innerBlocks.map(() => '<!-- inner block -->').join('\n')
    return `<${tagName} class="${classAttr}">\n${innerHtml}\n</${tagName}>`
  },
}
