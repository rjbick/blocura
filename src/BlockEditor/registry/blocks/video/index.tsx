import { useRef, useState } from 'react'
import { Video } from 'lucide-react'
import type { Block, BlockDefinition, BlockEditProps } from '../../../types'
import { useEditorRuntime } from '../../../context'
import { useEditorActions } from '../../../store'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'
import { resolveEmbedInput } from '../../../helpers/resolveEmbed'
import { generateClientId } from '../../../helpers/generateClientId'

interface VideoAttributes {
  src: string
  caption?: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  controls?: boolean
  poster?: string
  preload?: string
  align?: string
  className?: string
  anchor?: string
}

function VideoEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  onReplace,
}: BlockEditProps<VideoAttributes>) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { onImageUpload } = useEditorRuntime()
  const { createSuccessNotice, createErrorNotice, createInfoNotice } = useEditorActions()

  const maybeConvertToEmbed = (value: string): boolean => {
    const resolved = resolveEmbedInput(value)
    if (!resolved) return false
    if (resolved.providerNameSlug !== 'youtube' && resolved.providerNameSlug !== 'vimeo') {
      return false
    }
    if (!onReplace) return false

    const replacement: Block = {
      clientId: generateClientId(),
      name: 'core/embed',
      attributes: {
        url: resolved.url,
        type: resolved.type,
        providerNameSlug: resolved.providerNameSlug,
        previewHtml: resolved.previewHtml,
        caption: attributes.caption ?? '',
        className: attributes.className ?? '',
        anchor: attributes.anchor ?? '',
      },
      innerBlocks: [],
    }

    onReplace(replacement)
    createInfoNotice('Converted Video block to Embed for external video URL.')
    return true
  }

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Video URL</div>
          <input
            type="url"
            value={attributes.src || ''}
            onChange={(e) => {
              const next = e.target.value
              if (!maybeConvertToEmbed(next.trim())) {
                setAttributes({ src: next })
              }
            }}
            placeholder="https://example.com/video.mp4"
            style={inspectorInputStyle}
          />
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{ ...secondaryButtonStyle, justifySelf: 'start' }}
        >
          {attributes.src ? 'Replace video' : 'Upload video'}
        </button>

        <div>
          <div style={inspectorLabelStyle}>Poster image URL</div>
          <input
            type="url"
            value={attributes.poster || ''}
            onChange={(e) => setAttributes({ poster: e.target.value })}
            placeholder="https://example.com/poster.jpg"
            style={inspectorInputStyle}
          />
        </div>

        <label style={inspectorCheckboxStyle}>
          <input
            type="checkbox"
            checked={attributes.autoplay ?? false}
            onChange={(e) => setAttributes({ autoplay: e.target.checked })}
          />
          Autoplay
        </label>

        <label style={inspectorCheckboxStyle}>
          <input
            type="checkbox"
            checked={attributes.loop ?? false}
            onChange={(e) => setAttributes({ loop: e.target.checked })}
          />
          Loop
        </label>

        <label style={inspectorCheckboxStyle}>
          <input
            type="checkbox"
            checked={attributes.muted ?? false}
            onChange={(e) => setAttributes({ muted: e.target.checked })}
          />
          Muted
        </label>

        <label style={inspectorCheckboxStyle}>
          <input
            type="checkbox"
            checked={attributes.controls !== false}
            onChange={(e) => setAttributes({ controls: e.target.checked })}
          />
          Show controls
        </label>

        <div>
          <div style={inspectorLabelStyle}>Preload</div>
          <select
            value={attributes.preload || 'metadata'}
            onChange={(e) => setAttributes({ preload: e.target.value })}
            style={inspectorInputStyle}
          >
            <option value="none">None</option>
            <option value="metadata">Metadata</option>
            <option value="auto">Auto</option>
          </select>
        </div>
      </div>
    ),
    [
      attributes.src,
      attributes.poster,
      attributes.autoplay,
      attributes.loop,
      attributes.muted,
      attributes.controls,
      attributes.preload,
    ]
  )

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!onImageUpload) {
      setAttributes({ src: URL.createObjectURL(file) })
      return
    }

    setIsUploading(true)
    try {
      const uploaded = await onImageUpload(file)
      setAttributes({ src: uploaded.url })
      createSuccessNotice('Video uploaded.')
    } catch {
      createErrorNotice('Video upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = urlInput.trim()
    if (!value) return
    if (maybeConvertToEmbed(value)) return
    setAttributes({ src: value })
    setShowUrlInput(false)
    setUrlInput('')
  }

  if (!attributes.src) {
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
            color: '#1e1e1e',
            fontWeight: 500,
          }}
        >
          <Video size={20} />
          <span>Video</span>
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
          <form onSubmit={handleUrlSubmit} style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste video URL"
              autoFocus
              style={urlInputStyle}
            />
            <button type="submit" style={primaryButtonStyle}>Apply</button>
            <button type="button" onClick={() => setShowUrlInput(false)} style={secondaryButtonStyle}>Cancel</button>
          </form>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    )
  }

  return (
    <figure style={{ margin: 0 }}>
      <video
        src={attributes.src}
        controls={attributes.controls !== false}
        autoPlay={attributes.autoplay}
        loop={attributes.loop}
        muted={attributes.muted}
        poster={attributes.poster || undefined}
        preload={attributes.preload || 'metadata'}
        style={{ width: '100%', borderRadius: 2, display: 'block' }}
      />

      {isSelected && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{ ...secondaryButtonStyle, marginTop: 10 }}
        >
          Replace
        </button>
      )}

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

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
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
  width: 280,
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

const inspectorCheckboxStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
}

export const videoBlock: BlockDefinition = {
  name: 'core/video',
  title: 'Video',
  description: 'Embed a video from your media library or URL.',
  category: 'media',
  icon: <Video size={20} />,
  keywords: ['movie', 'media', 'mp4'],
  supports: {
    anchor: true,
    align: ['left', 'center', 'right', 'wide', 'full'],
    className: true,
  },
  attributes: {
    src: { type: 'string', default: '' },
    caption: { type: 'string', default: '' },
    autoplay: { type: 'boolean', default: false },
    loop: { type: 'boolean', default: false },
    muted: { type: 'boolean', default: false },
    controls: { type: 'boolean', default: true },
    poster: { type: 'string', default: '' },
    preload: { type: 'string', default: 'metadata' },
    align: { type: 'string', default: '' },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: VideoEdit,
  save: ({ attributes }) => {
    const {
      src,
      caption,
      autoplay,
      loop,
      muted,
      controls = true,
      poster,
      preload = 'metadata',
      align,
      className,
      anchor,
    } = attributes as VideoAttributes
    if (!src) return ''
    const classes = ['editor-block-video']
    if (align) classes.push(`align${align}`)
    if (className) classes.push(className)
    const captionHtml = caption ? `\n<figcaption class="editor-element-caption">${caption}</figcaption>` : ''
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const attrs = [
      `src="${src}"`,
      controls ? 'controls' : '',
      autoplay ? 'autoplay' : '',
      loop ? 'loop' : '',
      muted ? 'muted' : '',
      poster ? `poster="${poster}"` : '',
      preload ? `preload="${preload}"` : '',
    ].filter(Boolean).join(' ')
    return `<figure class="${classes.join(' ')}"${anchorAttr}><video ${attrs}></video>${captionHtml}\n</figure>`
  },
}
