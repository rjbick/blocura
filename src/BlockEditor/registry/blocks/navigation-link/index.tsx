import { Link2 } from 'lucide-react'
import { RichText } from '../../../components/richtext/RichText'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { generateClientId } from '../../../helpers/generateClientId'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface NavigationLinkAttributes {
  label: string
  url: string
  title?: string
  rel?: string
  opensInNewTab?: boolean
  className?: string
  anchor?: string
}

function NavigationLinkEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  insertBlocksAfter,
  mergeBlocks,
  onNavigateOut,
  initialPosition,
  onRemove,
}: BlockEditProps<NavigationLinkAttributes>) {
  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>URL</div>
          <input
            type="url"
            value={attributes.url || ''}
            onChange={(e) => setAttributes({ url: e.target.value })}
            placeholder="https://example.com"
            style={inspectorInputStyle}
          />
        </div>

        <div>
          <div style={inspectorLabelStyle}>Title attribute</div>
          <input
            type="text"
            value={attributes.title || ''}
            onChange={(e) => setAttributes({ title: e.target.value })}
            placeholder="Optional title"
            style={inspectorInputStyle}
          />
        </div>

        <div>
          <div style={inspectorLabelStyle}>Rel attribute</div>
          <input
            type="text"
            value={attributes.rel || ''}
            onChange={(e) => setAttributes({ rel: e.target.value })}
            placeholder="noopener noreferrer"
            style={inspectorInputStyle}
          />
        </div>

        <label style={inspectorCheckboxStyle}>
          <input
            type="checkbox"
            checked={attributes.opensInNewTab ?? false}
            onChange={(e) =>
              setAttributes({
                opensInNewTab: e.target.checked,
                rel: e.target.checked
                  ? attributes.rel || 'noopener noreferrer'
                  : attributes.rel,
              })
            }
          />
          Open in new tab
        </label>
      </div>
    ),
    [attributes.url, attributes.title, attributes.rel, attributes.opensInNewTab]
  )

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 120,
      }}
    >
      <RichText
        tagName="span"
        value={attributes.label}
        onChange={(value) => setAttributes({ label: value })}
        placeholder="Add link…"
        isSelected={isSelected}
        disableLineBreaks
        onSplit={(before, after) => {
          setAttributes({ label: before })
          insertBlocksAfter?.([{
            clientId: generateClientId(),
            name: 'core/navigation-link',
            attributes: {
              label: after,
              url: '',
              opensInNewTab: false,
            },
            innerBlocks: [],
          }])
        }}
        onMerge={(forward) => mergeBlocks?.(forward)}
        onNavigateOut={(direction) => onNavigateOut?.(direction)}
        onRemove={(forward) => onRemove?.(forward)}
        initialPosition={initialPosition}
        style={{
          fontSize: 14,
          fontFamily: 'var(--editor-font-family)',
          lineHeight: 1.4,
        }}
      />
      {isSelected && attributes.url && (
        <span style={{ fontSize: 12, color: 'var(--editor-text-muted)' }}>{attributes.url}</span>
      )}
    </div>
  )
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

export const navigationLinkBlock: BlockDefinition = {
  name: 'core/navigation-link',
  title: 'Navigation Link',
  description: 'A link item for Navigation blocks.',
  category: 'theme',
  icon: <Link2 size={20} />,
  keywords: ['menu', 'link', 'nav'],
  supports: {
    className: true,
    anchor: true,
  },
  attributes: {
    label: { type: 'string', default: '' },
    url: { type: 'string', default: '' },
    title: { type: 'string', default: '' },
    rel: { type: 'string', default: '' },
    opensInNewTab: { type: 'boolean', default: false },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: NavigationLinkEdit,
  save: ({ attributes }) => {
    const {
      label,
      url,
      title,
      rel,
      opensInNewTab = false,
      className,
      anchor,
    } = attributes as NavigationLinkAttributes
    const classes = ['editor-block-navigation-item']
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const targetAttr = opensInNewTab ? ' target="_blank"' : ''
    const relAttr = opensInNewTab
      ? ` rel="${rel || 'noreferrer noopener'}"`
      : rel
      ? ` rel="${rel}"`
      : ''
    const titleAttr = title ? ` title="${title}"` : ''
    return `<li class="${classes.join(' ')}"${anchorAttr}><a class="editor-block-navigation-item__content" href="${url || ''}"${targetAttr}${relAttr}${titleAttr}>${label || url || 'Menu item'}</a></li>`
  },
}
