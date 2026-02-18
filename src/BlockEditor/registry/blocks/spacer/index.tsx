import { GripHorizontal } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface SpacerAttrs {
  height?: string
  width?: string
}

function SpacerEdit({ clientId, attributes, setAttributes, isSelected }: BlockEditProps<SpacerAttrs>) {
  const height = attributes.height ?? '50px'
  const width = attributes.width ?? ''

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Height</div>
          <input
            type="text"
            value={height}
            onChange={(e) => setAttributes({ height: e.target.value })}
            placeholder="50px"
            style={inspectorInputStyle}
          />
        </div>
        <div>
          <div style={inspectorLabelStyle}>Width (optional)</div>
          <input
            type="text"
            value={width}
            onChange={(e) => setAttributes({ width: e.target.value })}
            placeholder="e.g. 100% or 500px"
            style={inspectorInputStyle}
          />
        </div>
      </div>
    ),
    [height, width]
  )

  return (
    <div
      style={{
        height,
        width: width || undefined,
        marginLeft: width ? 'auto' : undefined,
        marginRight: width ? 'auto' : undefined,
        backgroundColor: isSelected ? 'rgba(var(--wp-components-color-accent-rgb), 0.05)' : 'transparent',
        border: isSelected ? '1px dashed var(--wp-components-color-accent)' : '1px dashed rgba(0,0,0,0.1)',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.1s ease',
        cursor: 'default',
        position: 'relative',
      }}
    >
      {isSelected && (
        <div style={{ color: '#949494', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <GripHorizontal size={16} />
          <span style={{ fontSize: 11, fontFamily: 'var(--wp-font-family)' }}>
            {height}
          </span>
        </div>
      )}
    </div>
  )
}

export const spacerBlock: BlockDefinition = {
  name: 'core/spacer',
  title: 'Spacer',
  description: 'Add white space between blocks and customize its height.',
  category: 'design',
  icon: <GripHorizontal size={20} />,
  keywords: ['whitespace', 'space', 'blank'],
  supports: {
    anchor: true,
    spacing: { margin: ['top', 'bottom'] },
  },
  attributes: {
    height: { type: 'string', default: '50px' },
    width: { type: 'string' },
    style: { type: 'object' },
    className: { type: 'string' },
  },
  edit: SpacerEdit as BlockDefinition['edit'],
  save: ({ attributes }) => {
    const { height = '50px', width, className } = attributes as SpacerAttrs & { className?: string }
    const classes = ['wp-block-spacer', className].filter(Boolean).join(' ')
    const widthStyle = width ? `;width:${width};margin-left:auto;margin-right:auto` : ''
    return `<div class="${classes}" style="height:${height}${widthStyle}" aria-hidden="true"></div>`
  },
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
