import { useRef, useState } from 'react'
import { Music } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useEditorRuntime } from '../../../context'
import { useEditorActions } from '../../../store'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface AudioAttributes {
  src: string
  caption?: string
  autoplay?: boolean
  loop?: boolean
  controls?: boolean
  preload?: string
  className?: string
  anchor?: string
}

function AudioEdit({ clientId, attributes, setAttributes, isSelected }: BlockEditProps<AudioAttributes>) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { onImageUpload } = useEditorRuntime()
  const { createSuccessNotice, createErrorNotice } = useEditorActions()

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Audio URL</div>
          <input
            type="url"
            value={attributes.src || ''}
            onChange={(e) => setAttributes({ src: e.target.value })}
            placeholder="https://example.com/audio.mp3"
            style={inspectorInputStyle}
          />
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{ ...secondaryButtonStyle, justifySelf: 'start' }}
        >
          {attributes.src ? 'Replace audio' : 'Upload audio'}
        </button>

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
    [attributes.src, attributes.autoplay, attributes.loop, attributes.controls, attributes.preload]
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
      createSuccessNotice('Audio uploaded.')
    } catch {
      createErrorNotice('Audio upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = urlInput.trim()
    if (!value) return
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
          <Music size={20} />
          <span>Audio</span>
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
              placeholder="Paste audio URL"
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
          accept="audio/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    )
  }

  return (
    <figure style={{ margin: 0 }}>
      <audio
        src={attributes.src}
        controls={attributes.controls !== false}
        autoPlay={attributes.autoplay}
        loop={attributes.loop}
        preload={attributes.preload || 'metadata'}
        style={{ width: '100%', display: 'block' }}
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
        accept="audio/*"
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

export const audioBlock: BlockDefinition = {
  name: 'core/audio',
  title: 'Audio',
  description: 'Embed an audio player.',
  category: 'media',
  icon: <Music size={20} />,
  keywords: ['sound', 'music', 'podcast'],
  supports: {
    anchor: true,
    className: true,
  },
  attributes: {
    src: { type: 'string', default: '' },
    caption: { type: 'string', default: '' },
    autoplay: { type: 'boolean', default: false },
    loop: { type: 'boolean', default: false },
    controls: { type: 'boolean', default: true },
    preload: { type: 'string', default: 'metadata' },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: AudioEdit,
  save: ({ attributes }) => {
    const { src, caption, autoplay, loop, controls = true, preload = 'metadata', className, anchor } =
      attributes as AudioAttributes
    if (!src) return ''
    const classes = ['editor-block-audio']
    if (className) classes.push(className)
    const captionHtml = caption ? `\n<figcaption class="editor-element-caption">${caption}</figcaption>` : ''
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const attrs = [
      `src="${src}"`,
      controls ? 'controls' : '',
      autoplay ? 'autoplay' : '',
      loop ? 'loop' : '',
      preload ? `preload="${preload}"` : '',
    ].filter(Boolean).join(' ')
    return `<figure class="${classes.join(' ')}"${anchorAttr}><audio ${attrs}></audio>${captionHtml}\n</figure>`
  },
}
