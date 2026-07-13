import { Share2 } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { BlockList } from '../../../components/block/BlockList'
import { useEditorActions } from '../../../store'
import { generateClientId } from '../../../helpers/generateClientId'
import { BlockAppender } from '../../../components/inserter/BlockAppender'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface SocialLinksAttributes {
  openInNewTab?: boolean
  iconColor?: string
  iconColorValue?: string
  size?: 'has-small-icon-size' | 'has-normal-icon-size' | 'has-large-icon-size' | 'has-huge-icon-size'
  className?: string
  anchor?: string
}

function SocialLinksEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  innerBlocks = [],
}: BlockEditProps<SocialLinksAttributes>) {
  const { insertBlock, updateBlockAttributesBatch } = useEditorActions()

  function addSocialLink() {
    insertBlock(
      {
        clientId: generateClientId(),
        name: 'core/social-link',
        attributes: {
          service: 'link',
          url: '',
          label: '',
          opensInNewTab: attributes.openInNewTab ?? true,
          rel: 'noopener noreferrer',
        },
        innerBlocks: [],
      },
      clientId,
      innerBlocks.length
    )
  }

  function setOpenInNewTabForAll(openInNewTab: boolean) {
    updateBlockAttributesBatch(
      innerBlocks.map((block) => ({
        clientId: block.clientId,
        attrs: {
          opensInNewTab: openInNewTab,
          rel: openInNewTab ? 'noopener noreferrer' : '',
        },
      }))
    )
  }

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <button type="button" onClick={addSocialLink} style={{ ...buttonStyle, justifySelf: 'start' }}>
          Add social icon
        </button>

        <label style={inspectorCheckboxStyle}>
          <input
            type="checkbox"
            checked={attributes.openInNewTab ?? true}
            onChange={(e) => {
              const openInNewTab = e.target.checked
              setAttributes({ openInNewTab })
              setOpenInNewTabForAll(openInNewTab)
            }}
          />
          Open all links in new tab
        </label>

        <div>
          <div style={inspectorLabelStyle}>Icon size</div>
          <select
            value={attributes.size || 'has-normal-icon-size'}
            onChange={(e) =>
              setAttributes({
                size: e.target.value as SocialLinksAttributes['size'],
              })
            }
            style={inspectorInputStyle}
          >
            <option value="has-small-icon-size">Small</option>
            <option value="has-normal-icon-size">Normal</option>
            <option value="has-large-icon-size">Large</option>
            <option value="has-huge-icon-size">Huge</option>
          </select>
        </div>

        <div>
          <div style={inspectorLabelStyle}>Icon color</div>
          <input
            type="color"
            value={attributes.iconColorValue || '#1e1e1e'}
            onChange={(e) => setAttributes({ iconColorValue: e.target.value })}
            style={colorInputStyle}
          />
        </div>
      </div>
    ),
    [attributes.openInNewTab, attributes.size, attributes.iconColorValue, innerBlocks.length]
  )

  const iconSizePx =
    attributes.size === 'has-small-icon-size'
      ? 22
      : attributes.size === 'has-large-icon-size'
      ? 34
      : attributes.size === 'has-huge-icon-size'
      ? 42
      : 28

  const listStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    minHeight: innerBlocks.length === 0 ? 40 : undefined,
    border: isSelected && innerBlocks.length === 0 ? '1px dashed #ddd' : undefined,
    borderRadius: 2,
    padding: innerBlocks.length === 0 ? '8px 10px' : 0,
  }
  ;(listStyle as Record<string, string>)['--social-link-size'] = `${iconSizePx}px`
  ;(listStyle as Record<string, string>)['--social-link-bg'] = attributes.iconColorValue || '#1e1e1e'

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div
        style={listStyle}
      >
        <BlockList blocks={innerBlocks} rootClientId={clientId} direction="horizontal" />
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

const inspectorCheckboxStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
}

const colorInputStyle: React.CSSProperties = {
  width: 44,
  height: 28,
  border: '1px solid var(--editor-border)',
  borderRadius: 2,
  background: '#fff',
  padding: 2,
}

export const socialLinksBlock: BlockDefinition = {
  name: 'core/social-links',
  title: 'Social Icons',
  description: 'Display social media profile links.',
  category: 'widgets',
  icon: <Share2 size={20} />,
  keywords: ['social', 'icons', 'profiles'],
  supports: {
    anchor: true,
    className: true,
    align: ['wide', 'full'],
    spacing: { margin: true, padding: true, blockGap: true },
    layout: true,
  },
  attributes: {
    openInNewTab: { type: 'boolean', default: true },
    iconColor: { type: 'string', default: '' },
    iconColorValue: { type: 'string', default: '' },
    size: { type: 'string', default: 'has-normal-icon-size' },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: SocialLinksEdit,
  save: ({ attributes }) => {
    const {
      iconColor,
      iconColorValue,
      size = 'has-normal-icon-size',
      className,
      anchor,
    } = attributes as SocialLinksAttributes
    const classes = ['editor-block-social-links', size]
    if (iconColor) classes.push(`has-${iconColor}-color`)
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const inlineStyle = iconColorValue ? ` style="color:${iconColorValue}"` : ''
    return `<ul class="${classes.join(' ')}"${anchorAttr}${inlineStyle}><!--inner--></ul>`
  },
}
