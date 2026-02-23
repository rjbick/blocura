import { useRef, useState } from 'react'
import { ImageIcon, Upload, Link } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useEditorActions } from '../../../store'
import { useEditorRuntime } from '../../../context'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface ImageAttributes {
  url: string
  alt: string
  caption: string
  width?: number
  height?: number
  align?: string
  sizeSlug: string
  linkDestination: string
  href?: string
  id?: number
  className?: string
  anchor?: string
}

function ImageEdit({ clientId, attributes, setAttributes, isSelected }: BlockEditProps<ImageAttributes>) {
  const { url, alt, caption, width, align, href, linkDestination } = attributes
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { onImageUpload } = useEditorRuntime()
  const { createSuccessNotice, createErrorNotice } = useEditorActions()

  const isEmpty = !url

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Alt text</div>
          <input
            type="text"
            value={attributes.alt || ''}
            onChange={(e) => setAttributes({ alt: e.target.value })}
            placeholder="Describe the image"
            style={inspectorInputStyle}
          />
        </div>

        <div>
          <div style={inspectorLabelStyle}>Link destination</div>
          <select
            value={attributes.linkDestination || 'none'}
            onChange={(e) => {
              const next = e.target.value
              setAttributes({
                linkDestination: next,
                href: next === 'none' ? '' : attributes.href,
              })
            }}
            style={inspectorInputStyle}
          >
            <option value="none">None</option>
            <option value="media">Media file</option>
            <option value="custom">Custom URL</option>
          </select>
          {(attributes.linkDestination === 'custom' || attributes.linkDestination === 'media') && (
            <input
              type="url"
              value={attributes.href || ''}
              onChange={(e) => setAttributes({ href: e.target.value })}
              placeholder="https://example.com"
              style={{ ...inspectorInputStyle, marginTop: 6 }}
            />
          )}
        </div>

        <div>
          <div style={inspectorLabelStyle}>Image size</div>
          <select
            value={attributes.sizeSlug || 'full'}
            onChange={(e) => setAttributes({ sizeSlug: e.target.value })}
            style={inspectorInputStyle}
          >
            <option value="thumbnail">Thumbnail</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="full">Full</option>
          </select>
        </div>

        <div>
          <div style={inspectorLabelStyle}>Dimensions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <input
              type="number"
              min={1}
              value={attributes.width ?? ''}
              onChange={(e) => setAttributes({ width: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Width"
              style={inspectorInputStyle}
            />
            <input
              type="number"
              min={1}
              value={attributes.height ?? ''}
              onChange={(e) => setAttributes({ height: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Height"
              style={inspectorInputStyle}
            />
          </div>
        </div>
      </div>
    ),
    [attributes.alt, attributes.href, attributes.linkDestination, attributes.sizeSlug, attributes.width, attributes.height]
  )

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fallbackAlt = file.name.replace(/\.[^.]+$/, '')
    if (!onImageUpload) {
      const objectUrl = URL.createObjectURL(file)
      setAttributes({ url: objectUrl, alt: fallbackAlt })
      return
    }

    setIsUploading(true)
    try {
      const uploaded = await onImageUpload(file)
      const parsedId = uploaded.id ? Number(uploaded.id) : undefined
      setAttributes({
        url: uploaded.url,
        alt: uploaded.alt ?? fallbackAlt,
        width: uploaded.width,
        height: uploaded.height,
        id: Number.isFinite(parsedId) ? parsedId : undefined,
      })
      createSuccessNotice('Image uploaded.')
    } catch {
      createErrorNotice('Image upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (urlInput.trim()) {
      setAttributes({ url: urlInput.trim() })
      setShowUrlInput(false)
    }
  }

  if (isEmpty) {
    return (
      <figure
        style={{
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            border: '2px dashed #ddd',
            borderRadius: 2,
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            backgroundColor: '#f9f9f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1e1e1e', fontWeight: 500 }}>
            <ImageIcon size={20} />
            <span>Image</span>
          </div>

          {!showUrlInput ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                style={{
                  backgroundColor: '#2271b1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 2,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontFamily: 'var(--editor-font-family)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Upload size={14} />
                {isUploading ? 'Uploading…' : 'Upload'}
              </button>
              <button
                type="button"
                onClick={() => setShowUrlInput(true)}
                disabled={isUploading}
                style={{
                  backgroundColor: 'transparent',
                  color: '#2271b1',
                  border: '1px solid #2271b1',
                  borderRadius: 2,
                  padding: '8px 16px',
                  fontSize: 13,
                  fontFamily: 'var(--editor-font-family)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Link size={14} />
                Insert from URL
              </button>
            </div>
          ) : (
            <form onSubmit={handleUrlSubmit} style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 400 }}>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste image URL"
                autoFocus
                disabled={isUploading}
                style={{
                  flex: 1,
                  border: '1px solid #ddd',
                  borderRadius: 2,
                  padding: '8px 12px',
                  fontSize: 13,
                  fontFamily: 'var(--editor-font-family)',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={isUploading}
                style={{
                  backgroundColor: '#2271b1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 2,
                  padding: '8px 12px',
                  fontSize: 13,
                  fontFamily: 'var(--editor-font-family)',
                  cursor: 'pointer',
                }}
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                disabled={isUploading}
                style={{
                  backgroundColor: 'transparent',
                  color: '#1e1e1e',
                  border: '1px solid #ddd',
                  borderRadius: 2,
                  padding: '8px 12px',
                  fontSize: 13,
                  fontFamily: 'var(--editor-font-family)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </form>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
        </div>
      </figure>
    )
  }

  const imgStyle: React.CSSProperties = {
    display: 'block',
    maxWidth: '100%',
    height: 'auto',
    width: width ? `${width}px` : undefined,
  }

  const content = href ? (
    <a href={href} target={linkDestination === 'media' ? '_blank' : undefined} rel="noopener noreferrer">
      <img src={url} alt={alt} style={imgStyle} />
    </a>
  ) : (
    <img src={url} alt={alt} style={imgStyle} />
  )

  return (
    <figure
      style={{
        margin: 0,
        textAlign: align === 'center' ? 'center' : align === 'right' ? 'right' : 'left',
        position: 'relative',
      }}
    >
      {content}

      {/* Caption */}
      <figcaption
        contentEditable={!isSelected ? undefined : true}
        suppressContentEditableWarning
        onBlur={(e) => setAttributes({ caption: e.currentTarget.innerHTML })}
        data-placeholder="Add caption"
        style={{
          fontSize: 13,
          color: '#555',
          textAlign: 'center',
          marginTop: 8,
          outline: 'none',
          minHeight: caption ? undefined : '1em',
        }}
        dangerouslySetInnerHTML={{ __html: caption }}
      />

      {/* Replace controls on hover when selected */}
      {isSelected && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 4,
            }}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#fff',
                border: 'none',
                borderRadius: 2,
                padding: '6px 10px',
                fontSize: 12,
                fontFamily: 'var(--editor-font-family)',
                cursor: 'pointer',
              }}
            >
              {isUploading ? 'Uploading…' : 'Replace'}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </>
      )}
    </figure>
  )
}

const inspectorLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#757575',
  marginBottom: 4,
  fontWeight: 500,
}

const inspectorInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #ddd',
  borderRadius: 2,
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
  backgroundColor: '#fff',
  boxSizing: 'border-box',
}

export const imageBlock: BlockDefinition = {
  name: 'core/image',
  title: 'Image',
  description: 'Insert an image to make a visual statement.',
  category: 'media',
  icon: <ImageIcon size={20} />,
  keywords: ['img', 'photo', 'picture'],
  supports: {
    anchor: true,
    align: ['left', 'center', 'right', 'wide', 'full'],
    color: { text: false, background: false },
  },
  attributes: {
    url: { type: 'string' as const, default: '' },
    alt: { type: 'string' as const, default: '' },
    caption: { type: 'string' as const, default: '' },
    width: { type: 'number' as const },
    height: { type: 'number' as const },
    align: { type: 'string' as const, default: '' },
    sizeSlug: { type: 'string' as const, default: 'full' },
    linkDestination: { type: 'string' as const, default: 'none' },
    href: { type: 'string' as const, default: '' },
    id: { type: 'number' as const },
    className: { type: 'string' as const, default: '' },
    anchor: { type: 'string' as const, default: '' },
  },
  edit: ImageEdit,
  save: ({ attributes }) => {
    const { url, alt, caption, width, href, align } = attributes as ImageAttributes
    if (!url) return ''
    const widthAttr = width ? ` width="${width}"` : ''
    const img = `<img src="${url}" alt="${alt ?? ''}"${widthAttr} class="editor-image"/>`
    const linked = href ? `<a href="${href}">${img}</a>` : img
    const captionHtml = caption ? `\n<figcaption class="editor-element-caption">${caption}</figcaption>` : ''
    const alignClass = align ? ` align${align}` : ''
    return `<figure class="editor-block-image${alignClass}">${linked}${captionHtml}\n</figure>`
  },
}
