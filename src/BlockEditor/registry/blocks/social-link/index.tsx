import { Share2 } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface SocialLinkAttributes {
  service: string
  url: string
  label?: string
  opensInNewTab?: boolean
  rel?: string
  className?: string
  anchor?: string
}

function getServiceLetter(service: string): string {
  return (service || 'link').trim().charAt(0).toUpperCase() || 'L'
}

function SocialLinkEdit({ clientId, attributes, setAttributes, isSelected: _isSelected }: BlockEditProps<SocialLinkAttributes>) {
  const service = attributes.service || 'link'
  const label = attributes.label || service

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Service</div>
          <select
            value={service}
            onChange={(e) => setAttributes({ service: e.target.value })}
            style={inspectorInputStyle}
          >
            <option value="link">Link</option>
            <option value="facebook">Facebook</option>
            <option value="x">X</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="linkedin">LinkedIn</option>
            <option value="github">GitHub</option>
            <option value="tiktok">TikTok</option>
          </select>
        </div>
        <div>
          <div style={inspectorLabelStyle}>Label</div>
          <input
            type="text"
            value={attributes.label || ''}
            onChange={(e) => setAttributes({ label: e.target.value })}
            placeholder="Label"
            style={inspectorInputStyle}
          />
        </div>
        <div>
          <div style={inspectorLabelStyle}>URL</div>
          <input
            type="url"
            value={attributes.url || ''}
            onChange={(e) => setAttributes({ url: e.target.value })}
            placeholder="https://example.com/profile"
            style={inspectorInputStyle}
          />
        </div>
        <label style={inspectorCheckboxStyle}>
          <input
            type="checkbox"
            checked={attributes.opensInNewTab ?? true}
            onChange={(e) =>
              setAttributes({
                opensInNewTab: e.target.checked,
                rel: e.target.checked ? (attributes.rel || 'noopener noreferrer') : '',
              })
            }
          />
          Open in new tab
        </label>
      </div>
    ),
    [service, attributes.label, attributes.url, attributes.opensInNewTab]
  )

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 8, minWidth: 120 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: '#1e1e1e',
          fontFamily: 'var(--wp-font-family)',
        }}
      >
        <span
          style={{
            width: 'var(--social-link-size, 28px)',
            height: 'var(--social-link-size, 28px)',
            borderRadius: '999px',
            backgroundColor: 'var(--social-link-bg, #1e1e1e)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'calc(var(--social-link-size, 28px) * 0.48)',
            fontWeight: 600,
          }}
        >
          {getServiceLetter(service)}
        </span>
        {label}
      </span>
    </div>
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

const inspectorCheckboxStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
}

export const socialLinkBlock: BlockDefinition = {
  name: 'core/social-link',
  title: 'Social Icon',
  description: 'A single social profile link.',
  category: 'widgets',
  icon: <Share2 size={20} />,
  keywords: ['social', 'icon', 'profile'],
  supports: {
    className: true,
    anchor: true,
  },
  attributes: {
    service: { type: 'string', default: 'link' },
    url: { type: 'string', default: '' },
    label: { type: 'string', default: '' },
    opensInNewTab: { type: 'boolean', default: true },
    rel: { type: 'string', default: 'noopener noreferrer' },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: SocialLinkEdit,
  save: ({ attributes }) => {
    const {
      service = 'link',
      url = '',
      label = '',
      opensInNewTab = true,
      rel = 'noopener noreferrer',
      className,
      anchor,
    } = attributes as SocialLinkAttributes
    const classes = ['wp-social-link', `wp-social-link-${service}`]
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const targetAttr = opensInNewTab ? ' target="_blank"' : ''
    const relAttr = opensInNewTab
      ? ` rel="${rel || 'noopener noreferrer'}"`
      : rel
      ? ` rel="${rel}"`
      : ''
    const text = label || service
    return `<li class="${classes.join(' ')}"${anchorAttr}><a href="${url}"${targetAttr}${relAttr}>${text}</a></li>`
  },
}
