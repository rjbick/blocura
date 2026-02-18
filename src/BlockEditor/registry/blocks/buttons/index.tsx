import { LayoutTemplate } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { BlockList } from '../../../components/block/BlockList'
import { generateClientId } from '../../../helpers/generateClientId'
import { useEditorActions } from '../../../store'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface ButtonsAttributes {
  layout?: Record<string, unknown>
  className?: string
  anchor?: string
}

interface ButtonsLayout {
  orientation?: 'horizontal' | 'vertical'
  justifyContent?: 'left' | 'center' | 'right' | 'space-between'
  wrap?: boolean
}

function ButtonsEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  innerBlocks = [],
}: BlockEditProps<ButtonsAttributes>) {
  const { insertBlock } = useEditorActions()
  const layout = (attributes.layout ?? {}) as ButtonsLayout
  const orientation = layout.orientation ?? 'horizontal'
  const justifyRaw = layout.justifyContent ?? 'left'
  const justify =
    justifyRaw === 'center'
      ? 'center'
      : justifyRaw === 'right'
      ? 'flex-end'
      : justifyRaw === 'space-between'
      ? 'space-between'
      : 'flex-start'
  const wrap = orientation === 'vertical' ? false : layout.wrap ?? true

  function addButton() {
    insertBlock(
      {
        clientId: generateClientId(),
        name: 'core/button',
        attributes: { text: '' },
        innerBlocks: [],
      },
      clientId,
      innerBlocks.length
    )
  }

  function updateLayout(patch: Partial<ButtonsLayout>) {
    setAttributes({
      layout: {
        ...layout,
        ...patch,
      },
    })
  }

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <button type="button" onClick={addButton} style={{ ...buttonStyle, justifySelf: 'start' }}>
          Add button
        </button>

        <div>
          <div style={inspectorLabelStyle}>Orientation</div>
          <select
            value={orientation}
            onChange={(e) => updateLayout({ orientation: e.target.value as 'horizontal' | 'vertical' })}
            style={inspectorInputStyle}
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </div>

        <div>
          <div style={inspectorLabelStyle}>Justification</div>
          <select
            value={justifyRaw}
            onChange={(e) =>
              updateLayout({
                justifyContent: e.target.value as 'left' | 'center' | 'right' | 'space-between',
              })
            }
            style={inspectorInputStyle}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="space-between">Space between</option>
          </select>
        </div>

        {orientation === 'horizontal' && (
          <label style={inspectorCheckboxStyle}>
            <input
              type="checkbox"
              checked={wrap}
              onChange={(e) => updateLayout({ wrap: e.target.checked })}
            />
            Wrap buttons
          </label>
        )}

        <div style={{ fontSize: 12, color: '#757575' }}>
          {innerBlocks.length} button{innerBlocks.length === 1 ? '' : 's'}
        </div>
      </div>
    ),
    [orientation, justifyRaw, wrap, innerBlocks.length]
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        flexWrap: wrap ? 'wrap' : 'nowrap',
        gap: 8,
        alignItems: orientation === 'vertical' ? 'stretch' : 'center',
        justifyContent: justify,
      }}
    >
      <BlockList
        blocks={innerBlocks}
        rootClientId={clientId}
        direction={orientation === 'vertical' ? 'vertical' : 'horizontal'}
      />
      {isSelected && innerBlocks.length === 0 && (
        <button
          type="button"
          onClick={addButton}
          style={primaryButtonStyle}
        >
          Add button
        </button>
      )}
    </div>
  )
}

const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#3858e9',
  color: '#fff',
  border: 'none',
  borderRadius: 2,
  padding: '10px 20px',
  fontSize: 13,
  fontFamily: 'var(--wp-font-family)',
  cursor: 'pointer',
  fontWeight: 500,
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#1e1e1e',
  border: '1px solid #ddd',
  borderRadius: 2,
  padding: '8px 12px',
  fontSize: 13,
  fontFamily: 'var(--wp-font-family)',
  cursor: 'pointer',
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

const inspectorCheckboxStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
}

export const buttonsBlock: BlockDefinition = {
  name: 'core/buttons',
  title: 'Buttons',
  description: 'Prompt visitors to take action with a group of button-style links.',
  category: 'design',
  icon: <LayoutTemplate size={20} />,
  keywords: ['cta', 'call to action', 'link'],
  supports: {
    anchor: true,
    align: ['wide', 'full'],
    className: true,
    spacing: { blockGap: true, margin: true, padding: true },
    layout: true,
  },
  attributes: {
    layout: { type: 'object' as const, default: {} },
    className: { type: 'string' as const, default: '' },
    anchor: { type: 'string' as const, default: '' },
  },
  edit: ButtonsEdit,
  save: ({ attributes, innerBlocks = [] }) => {
    const { className } = attributes as ButtonsAttributes
    const classAttr = className ? ` ${className}` : ''
    const inner = innerBlocks
      .map((b) => {
        const { text, url, linkTarget, rel } = b.attributes as Record<string, string>
        const targetAttr = linkTarget ? ` target="${linkTarget}"` : ''
        const relAttr = rel ? ` rel="${rel}"` : ''
        return `<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${url ?? ''}"${targetAttr}${relAttr}>${text ?? ''}</a></div>`
      })
      .join('\n')
    return `<div class="wp-block-buttons${classAttr}">\n${inner}\n</div>`
  },
}
