import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
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

interface CoverAttributes {
  url: string
  id?: number
  alt?: string
  dimRatio?: number
  overlayColor?: string
  minHeight?: number
  isDark?: boolean
  focalPoint?: FocalPoint
  align?: string
  className?: string
  anchor?: string
}

function CoverEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  innerBlocks = [],
}: BlockEditProps<CoverAttributes>) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const { onImageUpload } = useEditorRuntime()
  const { createSuccessNotice, createErrorNotice } = useEditorActions()

  const dimRatio = attributes.dimRatio ?? 50
  const overlayColor = attributes.overlayColor || '#000000'
  const minHeight = attributes.minHeight ?? 320
  const focal = attributes.focalPoint ?? { x: 0.5, y: 0.5 }
  const focalPos = `${Math.round(focal.x * 100)}% ${Math.round(focal.y * 100)}%`

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Image URL</div>
          <input
            type="url"
            value={attributes.url || ''}
            onChange={(e) => setAttributes({ url: e.target.value })}
            placeholder="https://example.com/cover.jpg"
            style={inspectorInputStyle}
          />
        </div>

        <div>
          <div style={inspectorLabelStyle}>Alt text</div>
          <input
            type="text"
            value={attributes.alt || ''}
            onChange={(e) => setAttributes({ alt: e.target.value })}
            placeholder="Describe the background image"
            style={inspectorInputStyle}
          />
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{ ...secondaryButtonStyle, justifySelf: 'start' }}
        >
          {attributes.url ? 'Replace image' : 'Upload image'}
        </button>

        <div>
          <div style={inspectorLabelStyle}>Overlay opacity</div>
          <input
            type="range"
            min={0}
            max={100}
            value={dimRatio}
            onChange={(e) => setAttributes({ dimRatio: Number(e.target.value) })}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: 11, color: '#757575', marginTop: 4 }}>{dimRatio}%</div>
        </div>

        <div>
          <div style={inspectorLabelStyle}>Overlay color</div>
          <input
            type="color"
            value={overlayColor}
            onChange={(e) => setAttributes({ overlayColor: e.target.value })}
            style={colorInputStyle}
          />
        </div>

        <div>
          <div style={inspectorLabelStyle}>Minimum height (px)</div>
          <input
            type="number"
            min={100}
            value={minHeight}
            onChange={(e) => setAttributes({ minHeight: Math.max(Number(e.target.value) || 320, 100) })}
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

        <label style={inspectorCheckboxStyle}>
          <input
            type="checkbox"
            checked={attributes.isDark ?? true}
            onChange={(e) => setAttributes({ isDark: e.target.checked })}
          />
          Use dark overlay style
        </label>
      </div>
    ),
    [
      attributes.url,
      attributes.alt,
      dimRatio,
      overlayColor,
      minHeight,
      focal.x,
      focal.y,
      attributes.isDark,
    ]
  )

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fallbackAlt = file.name.replace(/\.[^.]+$/, '')

    if (!onImageUpload) {
      setAttributes({ url: URL.createObjectURL(file), alt: fallbackAlt })
      return
    }

    setIsUploading(true)
    try {
      const uploaded = await onImageUpload(file)
      const parsedId = uploaded.id ? Number(uploaded.id) : undefined
      setAttributes({
        url: uploaded.url,
        alt: uploaded.alt ?? fallbackAlt,
        id: Number.isFinite(parsedId) ? parsedId : undefined,
      })
      createSuccessNotice('Cover image uploaded.')
    } catch {
      createErrorNotice('Cover image upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  function applyUrl(e: React.FormEvent) {
    e.preventDefault()
    const url = urlInput.trim()
    if (!url) return
    setAttributes({ url })
    setUrlInput('')
    setShowUrlInput(false)
  }

  if (!attributes.url) {
    return (
      <div
        style={{
          border: '2px dashed #ddd',
          borderRadius: 2,
          padding: '28px 20px',
          textAlign: 'center',
          backgroundColor: '#f9f9f9',
          fontFamily: 'var(--wp-font-family)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
            color: '#1e1e1e',
            fontWeight: 500,
          }}
        >
          <ImagePlus size={20} />
          <span>Cover</span>
        </div>
        {!showUrlInput ? (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              style={primaryButtonStyle}
            >
              {isUploading ? 'Uploading…' : 'Upload'}
            </button>
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              disabled={isUploading}
              style={secondaryButtonStyle}
            >
              Insert from URL
            </button>
          </div>
        ) : (
          <form onSubmit={applyUrl} style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste image URL"
              style={urlInputStyle}
              autoFocus
            />
            <button type="submit" style={primaryButtonStyle}>Apply</button>
            <button type="button" onClick={() => setShowUrlInput(false)} style={secondaryButtonStyle}>
              Cancel
            </button>
          </form>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div
        style={{
          position: 'relative',
          minHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: 2,
        }}
      >
        <img
          src={attributes.url}
          alt={attributes.alt || ''}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: focalPos,
            zIndex: 0,
          }}
        />
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: overlayColor,
            opacity: dimRatio / 100,
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            maxWidth: 960,
            padding: '24px',
            color: '#fff',
          }}
        >
          <BlockList blocks={innerBlocks} rootClientId={clientId} />
          {isSelected && innerBlocks.length === 0 && <BlockAppender rootClientId={clientId} />}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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
  fontFamily: 'var(--wp-font-family)',
  cursor: 'pointer',
}

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#1e1e1e',
  border: '1px solid #ddd',
  borderRadius: 2,
  padding: '8px 12px',
  fontSize: 13,
  fontFamily: 'var(--wp-font-family)',
  cursor: 'pointer',
}

const urlInputStyle: React.CSSProperties = {
  width: 280,
  border: '1px solid #ddd',
  borderRadius: 2,
  padding: '8px 10px',
  fontSize: 13,
  fontFamily: 'var(--wp-font-family)',
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

const colorInputStyle: React.CSSProperties = {
  width: 44,
  height: 28,
  border: '1px solid #dcdcde',
  borderRadius: 2,
  background: '#fff',
  padding: 2,
}

const inspectorCheckboxStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
}

export const coverBlock: BlockDefinition = {
  name: 'core/cover',
  title: 'Cover',
  description: 'Add an image with a text overlay.',
  category: 'media',
  icon: <ImagePlus size={20} />,
  keywords: ['hero', 'banner', 'background'],
  supports: {
    anchor: true,
    align: ['wide', 'full'],
    className: true,
    color: { background: true, gradients: true, text: true },
    dimensions: { minHeight: true },
    spacing: { margin: true, padding: true },
  },
  attributes: {
    url: { type: 'string', default: '' },
    id: { type: 'number' },
    alt: { type: 'string', default: '' },
    dimRatio: { type: 'number', default: 50 },
    overlayColor: { type: 'string', default: '#000000' },
    minHeight: { type: 'number', default: 320 },
    isDark: { type: 'boolean', default: true },
    focalPoint: { type: 'object', default: { x: 0.5, y: 0.5 } },
    align: { type: 'string', default: '' },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: CoverEdit,
  save: ({ attributes }) => {
    const {
      url,
      alt,
      dimRatio = 50,
      overlayColor = '#000000',
      minHeight = 320,
      isDark = true,
      focalPoint = { x: 0.5, y: 0.5 },
      align,
      className,
      anchor,
    } = attributes as CoverAttributes
    if (!url) return ''
    const classes = ['wp-block-cover']
    if (align) classes.push(`align${align}`)
    if (isDark) classes.push('is-dark')
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const focalPos = `${Math.round(focalPoint.x * 100)}% ${Math.round(focalPoint.y * 100)}%`
    return `<div class="${classes.join(' ')}"${anchorAttr} style="min-height:${minHeight}px"><span aria-hidden="true" class="wp-block-cover__background" style="background-color:${overlayColor};opacity:${dimRatio / 100}"></span><img class="wp-block-cover__image-background" alt="${alt ?? ''}" src="${url}" style="object-position:${focalPos}" /><div class="wp-block-cover__inner-container"><!--inner--></div></div>`
  },
}
