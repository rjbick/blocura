import { useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useEditorRuntime } from '../../../context'
import { useEditorActions } from '../../../store'
import { BlockList } from '../../../components/block/BlockList'
import { BlockAppender } from '../../../components/inserter/BlockAppender'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'
import { FocalPointPicker } from '../../../components/ui/FocalPointPicker'

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
  /** Full CSS gradient; when set it replaces the flat overlay color. */
  overlayGradient?: string
  minHeight?: number
  maxHeight?: number
  isDark?: boolean
  focalPoint?: FocalPoint
  verticalAlign?: 'top' | 'center' | 'bottom'
  align?: string
  className?: string
  anchor?: string
}

const VERTICAL_ALIGN_FLEX: Record<string, string> = {
  top: 'flex-start',
  center: 'center',
  bottom: 'flex-end',
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
  const maxHeightRaw = attributes.maxHeight
  const maxHeight =
    typeof maxHeightRaw === 'number' && Number.isFinite(maxHeightRaw)
      ? Math.max(maxHeightRaw, minHeight)
      : undefined
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
          <div style={{ fontSize: 11, color: 'var(--editor-text-muted)', marginTop: 4 }}>{dimRatio}%</div>
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
          <div style={inspectorLabelStyle}>Overlay gradient (CSS)</div>
          <input
            type="text"
            value={attributes.overlayGradient || ''}
            onChange={(e) => setAttributes({ overlayGradient: e.target.value || undefined })}
            placeholder="linear-gradient(to bottom, rgba(0,0,0,.5), transparent)"
            style={inspectorInputStyle}
          />
          <div style={{ fontSize: 11, color: 'var(--editor-text-muted)', marginTop: 4 }}>
            Replaces the flat overlay color when set.
          </div>
        </div>

        <div>
          <div style={inspectorLabelStyle}>Content vertical alignment</div>
          <select
            value={attributes.verticalAlign || 'center'}
            onChange={(e) =>
              setAttributes({
                verticalAlign: e.target.value === 'center'
                  ? undefined
                  : (e.target.value as 'top' | 'bottom'),
              })
            }
            style={inspectorInputStyle}
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>

        <div>
          <div style={inspectorLabelStyle}>Minimum height (px)</div>
          <input
            type="number"
            min={100}
            value={minHeight}
            onChange={(e) => {
              const nextMinHeight = Math.max(Number(e.target.value) || 320, 100)
              setAttributes({
                minHeight: nextMinHeight,
                ...(typeof maxHeightRaw === 'number' && maxHeightRaw < nextMinHeight
                  ? { maxHeight: nextMinHeight }
                  : {}),
              })
            }}
            style={inspectorInputStyle}
          />
        </div>

        <div>
          <div style={inspectorLabelStyle}>Maximum height (px)</div>
          <input
            type="number"
            min={minHeight}
            value={maxHeight ?? ''}
            placeholder="No limit"
            onChange={(e) => {
              const rawValue = e.target.value.trim()
              if (!rawValue) {
                setAttributes({ maxHeight: undefined })
                return
              }
              const parsed = Number(rawValue)
              if (!Number.isFinite(parsed)) return
              setAttributes({ maxHeight: Math.max(parsed, minHeight, 100) })
            }}
            style={inspectorInputStyle}
          />
        </div>

        <div>
          <div style={inspectorLabelStyle}>Focal point</div>
          <FocalPointPicker
            value={focal}
            imageUrl={attributes.url || undefined}
            onChange={(next) => setAttributes({ focalPoint: next })}
          />
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
      attributes.overlayGradient,
      attributes.verticalAlign,
      minHeight,
      maxHeight,
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
          fontFamily: 'var(--editor-font-family)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
            color: 'var(--editor-text)',
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
          maxHeight,
          display: 'flex',
          alignItems: VERTICAL_ALIGN_FLEX[attributes.verticalAlign ?? 'center'],
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
            background: attributes.overlayGradient || overlayColor,
            opacity: attributes.overlayGradient ? 1 : dimRatio / 100,
            zIndex: 1,
          }}
        />
        <div
          className="editor-block-cover__inner-container"
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
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

const colorInputStyle: React.CSSProperties = {
  width: 44,
  height: 28,
  border: '1px solid var(--editor-border)',
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
    overlayGradient: { type: 'string' },
    minHeight: { type: 'number', default: 320 },
    maxHeight: { type: 'number' },
    isDark: { type: 'boolean', default: true },
    focalPoint: { type: 'object', default: { x: 0.5, y: 0.5 } },
    verticalAlign: { type: 'string' },
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
      overlayGradient,
      minHeight = 320,
      maxHeight,
      isDark = true,
      focalPoint = { x: 0.5, y: 0.5 },
      verticalAlign,
      align,
      className,
      anchor,
    } = attributes as CoverAttributes
    if (!url) return ''
    const classes = ['editor-block-cover']
    if (align) classes.push(`align${align}`)
    if (isDark) classes.push('is-dark')
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const focalPos = `${Math.round(focalPoint.x * 100)}% ${Math.round(focalPoint.y * 100)}%`
    const normalizedMaxHeight =
      typeof maxHeight === 'number' && Number.isFinite(maxHeight)
        ? Math.max(maxHeight, minHeight)
        : undefined
    const containerStyles = [`min-height:${minHeight}px`]
    if (normalizedMaxHeight !== undefined) {
      containerStyles.push(`max-height:${normalizedMaxHeight}px`)
    }
    if (verticalAlign && VERTICAL_ALIGN_FLEX[verticalAlign]) {
      containerStyles.push(`align-items:${VERTICAL_ALIGN_FLEX[verticalAlign]}`)
    }
    const overlayStyle = overlayGradient
      ? `background:${overlayGradient};opacity:1`
      : `background-color:${overlayColor};opacity:${dimRatio / 100}`
    return `<div class="${classes.join(' ')}"${anchorAttr} style="${containerStyles.join(';')}"><span aria-hidden="true" class="editor-block-cover__background" style="${overlayStyle}"></span><img class="editor-block-cover__image-background" alt="${alt ?? ''}" src="${url}" style="object-position:${focalPos}" /><div class="editor-block-cover__inner-container"><!--inner--></div></div>`
  },
}
