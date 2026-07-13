import { useRef, useState } from 'react'
import { FileText } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useEditorRuntime } from '../../../context'
import { useEditorActions } from '../../../store'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface FileAttributes {
  href: string
  filename: string
  showDownloadButton?: boolean
  downloadButtonText?: string
  className?: string
  anchor?: string
}

function FileEdit({ clientId, attributes, setAttributes, isSelected }: BlockEditProps<FileAttributes>) {
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
          <div style={inspectorLabelStyle}>File name</div>
          <input
            type="text"
            value={attributes.filename || ''}
            onChange={(e) => setAttributes({ filename: e.target.value })}
            placeholder="Download file"
            style={inspectorInputStyle}
          />
        </div>

        <div>
          <div style={inspectorLabelStyle}>File URL</div>
          <input
            type="url"
            value={attributes.href || ''}
            onChange={(e) => setAttributes({ href: e.target.value })}
            placeholder="https://example.com/file.pdf"
            style={inspectorInputStyle}
          />
        </div>

        <label style={inspectorCheckboxStyle}>
          <input
            type="checkbox"
            checked={attributes.showDownloadButton ?? true}
            onChange={(e) => setAttributes({ showDownloadButton: e.target.checked })}
          />
          Show download button
        </label>

        {(attributes.showDownloadButton ?? true) && (
          <div>
            <div style={inspectorLabelStyle}>Button text</div>
            <input
              type="text"
              value={attributes.downloadButtonText || ''}
              onChange={(e) => setAttributes({ downloadButtonText: e.target.value })}
              placeholder="Download"
              style={inspectorInputStyle}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{ ...secondaryButtonStyle, justifySelf: 'start' }}
        >
          {attributes.href ? 'Replace file' : 'Upload file'}
        </button>
      </div>
    ),
    [attributes.filename, attributes.href, attributes.showDownloadButton, attributes.downloadButtonText]
  )

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fallbackName = file.name

    if (!onImageUpload) {
      setAttributes({ href: URL.createObjectURL(file), filename: fallbackName })
      return
    }

    setIsUploading(true)
    try {
      const uploaded = await onImageUpload(file)
      setAttributes({ href: uploaded.url, filename: fallbackName })
      createSuccessNotice('File uploaded.')
    } catch {
      createErrorNotice('File upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = urlInput.trim()
    if (!value) return
    const fallbackName = value.split('/').pop() || 'Download file'
    setAttributes({ href: value, filename: attributes.filename || fallbackName })
    setShowUrlInput(false)
    setUrlInput('')
  }

  if (!attributes.href) {
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
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 14, fontWeight: 500 }}>
          <FileText size={20} />
          <span>File</span>
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
              placeholder="Paste file URL"
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
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <a href={attributes.href} style={{ color: '#2271b1', textDecoration: 'none' }}>
          {attributes.filename || 'Download file'}
        </a>
        {(attributes.showDownloadButton ?? true) && (
          <a
            href={attributes.href}
            style={{
              padding: '6px 12px',
              borderRadius: 2,
              border: '1px solid #2271b1',
              color: '#2271b1',
              fontSize: 12,
              textDecoration: 'none',
            }}
          >
            {attributes.downloadButtonText || 'Download'}
          </a>
        )}
      </div>

      {isSelected && attributes.href && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{ ...secondaryButtonStyle, alignSelf: 'flex-start' }}
        >
          Replace file
        </button>
      )}

      <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: 'none' }} />
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

export const fileBlock: BlockDefinition = {
  name: 'core/file',
  title: 'File',
  description: 'Add a link to a downloadable file.',
  category: 'media',
  icon: <FileText size={20} />,
  keywords: ['download', 'document', 'pdf'],
  supports: {
    anchor: true,
    className: true,
  },
  attributes: {
    href: { type: 'string', default: '' },
    filename: { type: 'string', default: '' },
    showDownloadButton: { type: 'boolean', default: true },
    downloadButtonText: { type: 'string', default: 'Download' },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: FileEdit,
  save: ({ attributes }) => {
    const {
      href,
      filename,
      showDownloadButton = true,
      downloadButtonText = 'Download',
      className,
      anchor,
    } = attributes as FileAttributes
    if (!href) return ''
    const classes = ['editor-block-file']
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const linkText = filename || href.split('/').pop() || 'Download file'
    const downloadButton = showDownloadButton
      ? `\n<a class="editor-block-file__button" href="${href}">${downloadButtonText}</a>`
      : ''
    return `<div class="${classes.join(' ')}"${anchorAttr}><a href="${href}">${linkText}</a>${downloadButton}\n</div>`
  },
}
