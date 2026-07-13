import { useRef, useState } from 'react'
import { Image as ImageIcon, Video } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useEditorRuntime } from '../../../context'
import { useEditorActions } from '../../../store'
import { BlockList } from '../../../components/block/BlockList'
import { BlockAppender } from '../../../components/inserter/BlockAppender'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface FocalPoint {
  x: number
  y: number
}

interface MediaTextAttributes {
  mediaUrl: string
  mediaId?: number
  mediaType?: 'image' | 'video'
  mediaAlt?: string
  mediaPosition?: 'left' | 'right'
  mediaWidth?: number
  isStackedOnMobile?: boolean
  imageFill?: boolean
  focalPoint?: FocalPoint
  verticalAlignment?: 'top' | 'center' | 'bottom'
  className?: string
  anchor?: string
}

function detectMediaTypeFromUrl(url: string): 'image' | 'video' {
  const lower = url.toLowerCase()
  return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/.test(lower) ? 'video' : 'image'
}

function MediaTextEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  innerBlocks = [],
}: BlockEditProps<MediaTextAttributes>) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const { onImageUpload } = useEditorRuntime()
  const { createSuccessNotice, createErrorNotice } = useEditorActions()

  const mediaType = attributes.mediaType ?? 'image'
  const mediaPosition = attributes.mediaPosition ?? 'left'
  const mediaWidth = attributes.mediaWidth ?? 50
  const verticalAlignment = attributes.verticalAlignment ?? 'center'
  const focal = attributes.focalPoint ?? { x: 0.5, y: 0.5 }
  const focalPos = `${Math.round(focal.x * 100)}% ${Math.round(focal.y * 100)}%`

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Media URL</div>
          <input
            type="url"
            value={attributes.mediaUrl || ''}
            onChange={(e) =>
              setAttributes({
                mediaUrl: e.target.value,
                mediaType: e.target.value ? detectMediaTypeFromUrl(e.target.value) : mediaType,
              })
            }
            placeholder="https://example.com/media.jpg"
            style={inspectorInputStyle}
          />
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{ ...secondaryButtonStyle, justifySelf: 'start' }}
        >
          {attributes.mediaUrl ? 'Replace media' : 'Upload media'}
        </button>

        <div>
          <div style={inspectorLabelStyle}>Media type</div>
          <select
            value={mediaType}
            onChange={(e) => setAttributes({ mediaType: e.target.value as 'image' | 'video' })}
            style={inspectorInputStyle}
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>

        <div>
          <div style={inspectorLabelStyle}>Media position</div>
          <select
            value={mediaPosition}
            onChange={(e) => setAttributes({ mediaPosition: e.target.value as 'left' | 'right' })}
            style={inspectorInputStyle}
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>

        <div>
          <div style={inspectorLabelStyle}>Media width (%)</div>
          <input
            type="number"
            min={25}
            max={75}
            value={mediaWidth}
            onChange={(e) =>
              setAttributes({
                mediaWidth: Math.max(25, Math.min(Number(e.target.value) || 50, 75)),
              })
            }
            style={inspectorInputStyle}
          />
        </div>

        <div>
          <div style={inspectorLabelStyle}>Vertical alignment</div>
          <select
            value={verticalAlignment}
            onChange={(e) =>
              setAttributes({ verticalAlignment: e.target.value as 'top' | 'center' | 'bottom' })
            }
            style={inspectorInputStyle}
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>

        <label style={inspectorCheckboxStyle}>
          <input
            type="checkbox"
            checked={attributes.isStackedOnMobile ?? true}
            onChange={(e) => setAttributes({ isStackedOnMobile: e.target.checked })}
          />
          Stack on mobile
        </label>

        <label style={inspectorCheckboxStyle}>
          <input
            type="checkbox"
            checked={attributes.imageFill ?? false}
            onChange={(e) => setAttributes({ imageFill: e.target.checked })}
            disabled={mediaType !== 'image'}
          />
          Fill image to container
        </label>

        {mediaType === 'image' && (
          <>
            <div>
              <div style={inspectorLabelStyle}>Alt text</div>
              <input
                type="text"
                value={attributes.mediaAlt || ''}
                onChange={(e) => setAttributes({ mediaAlt: e.target.value })}
                placeholder="Describe the image"
                style={inspectorInputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={inspectorLabelStyle}>Focal X (%)</div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={Math.round(focal.x * 100)}
                  onChange={(e) => {
                    const next = Math.max(0, Math.min(Number(e.target.value) || 0, 100))
                    setAttributes({ focalPoint: { ...focal, x: next / 100 } })
                  }}
                  style={inspectorInputStyle}
                />
              </div>
              <div>
                <div style={inspectorLabelStyle}>Focal Y (%)</div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={Math.round(focal.y * 100)}
                  onChange={(e) => {
                    const next = Math.max(0, Math.min(Number(e.target.value) || 0, 100))
                    setAttributes({ focalPoint: { ...focal, y: next / 100 } })
                  }}
                  style={inspectorInputStyle}
                />
              </div>
            </div>
          </>
        )}
      </div>
    ),
    [
      attributes.mediaUrl,
      mediaType,
      mediaPosition,
      mediaWidth,
      verticalAlignment,
      attributes.isStackedOnMobile,
      attributes.imageFill,
      attributes.mediaAlt,
      focal.x,
      focal.y,
    ]
  )

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fallbackAlt = file.name.replace(/\.[^.]+$/, '')
    const nextType: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image'

    if (!onImageUpload) {
      setAttributes({
        mediaUrl: URL.createObjectURL(file),
        mediaAlt: fallbackAlt,
        mediaType: nextType,
      })
      return
    }

    setIsUploading(true)
    try {
      const uploaded = await onImageUpload(file)
      const parsedId = uploaded.id ? Number(uploaded.id) : undefined
      setAttributes({
        mediaUrl: uploaded.url,
        mediaAlt: uploaded.alt ?? fallbackAlt,
        mediaType: nextType,
        mediaId: Number.isFinite(parsedId) ? parsedId : undefined,
      })
      createSuccessNotice('Media uploaded.')
    } catch {
      createErrorNotice('Media upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  function applyUrl(e: React.FormEvent) {
    e.preventDefault()
    const mediaUrl = urlInput.trim()
    if (!mediaUrl) return
    setAttributes({
      mediaUrl,
      mediaType: detectMediaTypeFromUrl(mediaUrl),
    })
    setUrlInput('')
    setShowUrlInput(false)
  }

  const mediaCell = !attributes.mediaUrl ? (
    <div
      style={{
        border: '1px dashed #ddd',
        borderRadius: 2,
        minHeight: 220,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 10,
        padding: 16,
        backgroundColor: '#f9f9f9',
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#555' }}>
        {mediaType === 'video' ? <Video size={18} /> : <ImageIcon size={18} />}
        <span>{mediaType === 'video' ? 'Video' : 'Image'} area</span>
      </div>
      {!showUrlInput ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            style={primaryButtonStyle}
          >
            {isUploading ? 'Uploading…' : 'Upload'}
          </button>
          <button type="button" onClick={() => setShowUrlInput(true)} style={secondaryButtonStyle}>
            Insert from URL
          </button>
        </div>
      ) : (
        <form onSubmit={applyUrl} style={{ display: 'flex', gap: 8 }}>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste media URL"
            style={urlInputStyle}
            autoFocus
          />
          <button type="submit" style={primaryButtonStyle}>Apply</button>
          <button type="button" onClick={() => setShowUrlInput(false)} style={secondaryButtonStyle}>Cancel</button>
        </form>
      )}
    </div>
  ) : mediaType === 'video' ? (
    <video
      src={attributes.mediaUrl}
      controls
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  ) : (
    <img
      src={attributes.mediaUrl}
      alt={attributes.mediaAlt || ''}
      style={{
        width: '100%',
        height: attributes.imageFill ? '100%' : 'auto',
        minHeight: attributes.imageFill ? 220 : undefined,
        objectFit: attributes.imageFill ? 'cover' : 'contain',
        objectPosition: focalPos,
        display: 'block',
      }}
    />
  )

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${mediaWidth}% ${100 - mediaWidth}%`,
          alignItems:
            verticalAlignment === 'top'
              ? 'start'
              : verticalAlignment === 'bottom'
              ? 'end'
              : 'center',
          gap: 24,
        }}
      >
        <div style={{ order: mediaPosition === 'right' ? 2 : 1 }}>{mediaCell}</div>
        <div style={{ order: mediaPosition === 'right' ? 1 : 2, minHeight: 120 }}>
          <BlockList blocks={innerBlocks} rootClientId={clientId} />
          {isSelected && innerBlocks.length === 0 && <BlockAppender rootClientId={clientId} />}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
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
  color: 'var(--editor-text)',
  border: '1px solid #ddd',
  borderRadius: 2,
  padding: '8px 12px',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
  cursor: 'pointer',
}

const urlInputStyle: React.CSSProperties = {
  width: 280,
  border: '1px solid #ddd',
  borderRadius: 2,
  padding: '8px 10px',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
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

export const mediaTextBlock: BlockDefinition = {
  name: 'core/media-text',
  title: 'Media & Text',
  description: 'Set media and text side-by-side.',
  category: 'media',
  icon: <ImageIcon size={20} />,
  keywords: ['image', 'video', 'split', 'columns'],
  supports: {
    anchor: true,
    align: ['wide', 'full'],
    className: true,
    spacing: { margin: true, padding: true },
    color: { background: true, text: true },
  },
  attributes: {
    mediaUrl: { type: 'string', default: '' },
    mediaId: { type: 'number' },
    mediaType: { type: 'string', default: 'image' },
    mediaAlt: { type: 'string', default: '' },
    mediaPosition: { type: 'string', default: 'left' },
    mediaWidth: { type: 'number', default: 50 },
    isStackedOnMobile: { type: 'boolean', default: true },
    imageFill: { type: 'boolean', default: false },
    focalPoint: { type: 'object', default: { x: 0.5, y: 0.5 } },
    verticalAlignment: { type: 'string', default: 'center' },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: MediaTextEdit,
  save: ({ attributes }) => {
    const {
      mediaUrl,
      mediaType = 'image',
      mediaAlt = '',
      mediaPosition = 'left',
      mediaWidth = 50,
      imageFill = false,
      focalPoint = { x: 0.5, y: 0.5 },
      verticalAlignment = 'center',
      className,
      anchor,
    } = attributes as MediaTextAttributes
    if (!mediaUrl) return ''
    const classes = ['editor-block-media-text']
    if (mediaPosition === 'right') classes.push('has-media-on-the-right')
    if (imageFill) classes.push('is-image-fill')
    if (verticalAlignment !== 'center') classes.push(`is-vertically-aligned-${verticalAlignment}`)
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const mediaMarkup =
      mediaType === 'video'
        ? `<video src="${mediaUrl}" controls></video>`
        : `<img src="${mediaUrl}" alt="${mediaAlt}" style="object-position:${Math.round(focalPoint.x * 100)}% ${Math.round(focalPoint.y * 100)}%" />`
    return `<div class="${classes.join(' ')}"${anchorAttr} style="grid-template-columns:${mediaWidth}% auto"><figure class="editor-block-media-text__media">${mediaMarkup}</figure><div class="editor-block-media-text__content"><!--inner--></div></div>`
  },
}
