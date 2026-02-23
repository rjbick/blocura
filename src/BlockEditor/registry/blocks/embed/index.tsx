import { useMemo, useState } from 'react'
import { Globe } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'
import { resolveEmbedInput } from '../../../helpers/resolveEmbed'

interface EmbedAttributes {
  url: string
  type?: string
  providerNameSlug?: string
  previewHtml?: string
  caption?: string
  className?: string
  anchor?: string
}

function EmbedEdit({ clientId, attributes, setAttributes, isSelected }: BlockEditProps<EmbedAttributes>) {
  const [urlInput, setUrlInput] = useState(attributes.url || '')
  const [urlError, setUrlError] = useState<string | null>(null)
  const previewHtml = useMemo(() => {
    return attributes.previewHtml || (attributes.url ? resolveEmbedInput(attributes.url)?.previewHtml : '')
  }, [attributes.previewHtml, attributes.url])

  function applyUrlValue(nextUrl: string) {
    if (!nextUrl) {
      setUrlError('Enter a URL to embed.')
      return
    }
    const resolved = resolveEmbedInput(nextUrl)
    if (!resolved) {
      setUrlError('That URL could not be parsed. Use a full URL like https://youtube.com/watch?v=...')
      return
    }
    setUrlError(null)
    setAttributes({
      url: resolved.url,
      type: resolved.type,
      providerNameSlug: resolved.providerNameSlug,
      previewHtml: resolved.previewHtml,
    })
  }

  function applyUrl(e: React.FormEvent) {
    e.preventDefault()
    applyUrlValue(urlInput.trim())
  }

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Embed URL</div>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com"
            style={inspectorInputStyle}
          />
          {urlError && (
            <div style={errorTextStyle}>{urlError}</div>
          )}
          <button
            type="button"
            onClick={() => applyUrlValue(urlInput.trim())}
            style={{ ...secondaryButtonStyle, marginTop: 8 }}
          >
            Update embed
          </button>
        </div>

        <div>
          <div style={inspectorLabelStyle}>Caption</div>
          <input
            type="text"
            value={attributes.caption || ''}
            onChange={(e) => setAttributes({ caption: e.target.value })}
            placeholder="Write caption…"
            style={inspectorInputStyle}
          />
        </div>
      </div>
    ),
    [urlInput, attributes.caption]
  )

  if (!attributes.url) {
    return (
      <div
        style={{
          border: '2px dashed #ddd',
          borderRadius: 2,
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#f9f9f9',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Globe size={18} />
          <span>Embed</span>
        </div>
        <form onSubmit={applyUrl} style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste URL to embed"
            style={urlInputStyle}
            autoFocus
          />
          <button type="submit" style={primaryButtonStyle}>Embed</button>
        </form>
        {urlError && (
          <div style={{ ...errorTextStyle, marginTop: 8 }}>{urlError}</div>
        )}
      </div>
    )
  }

  return (
    <figure style={{ margin: 0 }}>
      <div
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          padding: 8,
          backgroundColor: '#fff',
        }}
        dangerouslySetInnerHTML={{ __html: previewHtml || '' }}
      />
      <figcaption
        contentEditable={isSelected}
        suppressContentEditableWarning
        onBlur={(e) => setAttributes({ caption: e.currentTarget.innerHTML })}
        style={{
          marginTop: 8,
          fontSize: 13,
          color: '#555',
          textAlign: 'center',
          outline: 'none',
          minHeight: 18,
        }}
        dangerouslySetInnerHTML={{ __html: attributes.caption ?? '' }}
      />
    </figure>
  )
}

const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#2271b1',
  color: '#fff',
  border: 'none',
  borderRadius: 2,
  padding: '8px 12px',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
  cursor: 'pointer',
}

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#1e1e1e',
  border: '1px solid #ddd',
  borderRadius: 2,
  padding: '8px 12px',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
  cursor: 'pointer',
}

const urlInputStyle: React.CSSProperties = {
  width: 320,
  border: '1px solid #ddd',
  borderRadius: 2,
  padding: '8px 10px',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
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

const errorTextStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  color: '#b32d2e',
}

export const embedBlock: BlockDefinition = {
  name: 'core/embed',
  title: 'Embed',
  description: 'Embed content from another site.',
  category: 'embed',
  icon: <Globe size={20} />,
  keywords: ['url', 'youtube', 'vimeo', 'oembed'],
  supports: {
    anchor: true,
    className: true,
  },
  attributes: {
    url: { type: 'string', default: '' },
    type: { type: 'string', default: 'rich' },
    providerNameSlug: { type: 'string', default: '' },
    previewHtml: { type: 'string', default: '' },
    caption: { type: 'string', default: '' },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: EmbedEdit,
  save: ({ attributes }) => {
    const {
      url,
      type = 'rich',
      providerNameSlug,
      previewHtml,
      caption,
      className,
      anchor,
    } = attributes as EmbedAttributes
    if (!url) return ''
    const classes = ['editor-block-embed', `is-type-${type}`]
    if (providerNameSlug) {
      classes.push(`is-provider-${providerNameSlug}`, `editor-block-embed-${providerNameSlug}`)
    }
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const preview = previewHtml || `<p><a href="${url}">${url}</a></p>`
    const captionHtml = caption ? `\n<figcaption class="editor-element-caption">${caption}</figcaption>` : ''
    return `<figure class="${classes.join(' ')}"${anchorAttr}><div class="editor-block-embed__wrapper">${preview}</div>${captionHtml}\n</figure>`
  },
}
