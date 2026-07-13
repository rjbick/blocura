import { Menu } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { BlockList } from '../../../components/block/BlockList'
import { BlockAppender } from '../../../components/inserter/BlockAppender'
import { useEditorActions } from '../../../store'
import { generateClientId } from '../../../helpers/generateClientId'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface NavigationAttributes {
  orientation?: 'horizontal' | 'vertical'
  justifyContent?: 'left' | 'center' | 'right' | 'space-between'
  className?: string
  anchor?: string
}

function NavigationEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  innerBlocks = [],
}: BlockEditProps<NavigationAttributes>) {
  const { insertBlock } = useEditorActions()
  const orientation = attributes.orientation ?? 'horizontal'
  const justify =
    attributes.justifyContent === 'center'
      ? 'center'
      : attributes.justifyContent === 'right'
      ? 'flex-end'
      : attributes.justifyContent === 'space-between'
      ? 'space-between'
      : 'flex-start'

  function addNavigationLink() {
    insertBlock(
      {
        clientId: generateClientId(),
        name: 'core/navigation-link',
        attributes: {
          label: '',
          url: '',
          opensInNewTab: false,
        },
        innerBlocks: [],
      },
      clientId,
      innerBlocks.length
    )
  }

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <button type="button" onClick={addNavigationLink} style={{ ...buttonStyle, justifySelf: 'start' }}>
          Add link
        </button>

        <div>
          <div style={inspectorLabelStyle}>Orientation</div>
          <select
            value={orientation}
            onChange={(e) => setAttributes({ orientation: e.target.value as 'horizontal' | 'vertical' })}
            style={inspectorInputStyle}
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </div>

        <div>
          <div style={inspectorLabelStyle}>Justification</div>
          <select
            value={attributes.justifyContent ?? 'left'}
            onChange={(e) =>
              setAttributes({
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
      </div>
    ),
    [orientation, attributes.justifyContent, innerBlocks.length]
  )

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div
        style={{
          display: 'flex',
          flexDirection: orientation === 'vertical' ? 'column' : 'row',
          flexWrap: orientation === 'vertical' ? 'nowrap' : 'wrap',
          gap: 14,
          justifyContent: justify,
          alignItems: orientation === 'vertical' ? 'stretch' : 'center',
          minHeight: innerBlocks.length === 0 ? 44 : undefined,
          border: isSelected && innerBlocks.length === 0 ? '1px dashed #ddd' : undefined,
          borderRadius: 2,
          padding: innerBlocks.length === 0 ? '8px 12px' : 0,
        }}
      >
        <BlockList
          blocks={innerBlocks}
          rootClientId={clientId}
          direction={orientation === 'vertical' ? 'vertical' : 'horizontal'}
        />
      </div>

      {isSelected && <BlockAppender rootClientId={clientId} />}
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: 'var(--editor-text)',
  border: '1px solid #ddd',
  borderRadius: 2,
  padding: '8px 12px',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
  cursor: 'pointer',
}

const inspectorLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--editor-text-muted)',
  marginBottom: 4,
}

const inspectorInputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--editor-border)',
  borderRadius: 2,
  padding: '6px 8px',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
}

export const navigationBlock: BlockDefinition = {
  name: 'core/navigation',
  title: 'Navigation',
  description: 'Display a menu of links.',
  category: 'theme',
  icon: <Menu size={20} />,
  keywords: ['menu', 'links', 'header'],
  supports: {
    anchor: true,
    align: ['wide', 'full'],
    className: true,
    spacing: { padding: true, margin: true, blockGap: true },
    layout: true,
  },
  attributes: {
    orientation: { type: 'string', default: 'horizontal' },
    justifyContent: { type: 'string', default: 'left' },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: NavigationEdit,
  save: ({ attributes }) => {
    const { orientation = 'horizontal', justifyContent = 'left', className, anchor } =
      attributes as NavigationAttributes
    const classes = ['editor-block-navigation']
    if (orientation === 'vertical') classes.push('is-vertical')
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const justify =
      justifyContent === 'center'
        ? 'center'
        : justifyContent === 'right'
        ? 'flex-end'
        : justifyContent === 'space-between'
        ? 'space-between'
        : 'flex-start'
    const listClass = ['editor-block-navigation__container']
    if (orientation === 'vertical') listClass.push('is-vertical')
    return `<nav class="${classes.join(' ')}"${anchorAttr}><ul class="${listClass.join(' ')}" style="justify-content:${justify}"><!--inner--></ul></nav>`
  },
}
