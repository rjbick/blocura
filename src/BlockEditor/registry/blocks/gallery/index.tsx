import { useRef, useState } from 'react'
import { Images } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useEditorRuntime } from '../../../context'
import { useEditorActions } from '../../../store'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface GalleryImage {
  id?: number
  url: string
  alt?: string
  caption?: string
}

interface GalleryAttributes {
  images: GalleryImage[]
  columns?: number
  imageCrop?: boolean
  className?: string
  anchor?: string
}

function GalleryEdit({ clientId, attributes, setAttributes, isSelected }: BlockEditProps<GalleryAttributes>) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const images = attributes.images || []
  const columns = attributes.columns || 3
  const { onImageUpload } = useEditorRuntime()
  const { createSuccessNotice, createErrorNotice } = useEditorActions()

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{ ...secondaryButtonStyle, justifySelf: 'start' }}
        >
          {isUploading ? 'Uploading…' : images.length > 0 ? 'Add images' : 'Upload images'}
        </button>

        <div>
          <div style={inspectorLabelStyle}>Columns</div>
          <select
            value={columns}
            onChange={(e) => setAttributes({ columns: Number(e.target.value) })}
            style={inspectorInputStyle}
          >
            {[2, 3, 4, 5, 6].map((count) => (
              <option key={count} value={count}>{count}</option>
            ))}
          </select>
        </div>

        <label style={inspectorCheckboxStyle}>
          <input
            type="checkbox"
            checked={attributes.imageCrop ?? true}
            onChange={(e) => setAttributes({ imageCrop: e.target.checked })}
          />
          Crop images
        </label>

        <div style={{ fontSize: 12, color: '#757575' }}>
          {images.length} image{images.length === 1 ? '' : 's'} in gallery
        </div>
      </div>
    ),
    [isUploading, images.length, columns, attributes.imageCrop]
  )

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)

    if (!onImageUpload) {
      const next = fileArray.map((file) => ({
        url: URL.createObjectURL(file),
        alt: file.name.replace(/\.[^.]+$/, ''),
      }))
      setAttributes({ images: [...images, ...next] })
      return
    }

    setIsUploading(true)
    try {
      const uploadedImages: GalleryImage[] = []
      for (const file of fileArray) {
        const uploaded = await onImageUpload(file)
        const parsedId = uploaded.id ? Number(uploaded.id) : undefined
        uploadedImages.push({
          url: uploaded.url,
          alt: uploaded.alt ?? file.name.replace(/\.[^.]+$/, ''),
          id: Number.isFinite(parsedId) ? parsedId : undefined,
        })
      }
      setAttributes({ images: [...images, ...uploadedImages] })
      createSuccessNotice(`${uploadedImages.length} image${uploadedImages.length === 1 ? '' : 's'} uploaded.`)
    } catch {
      createErrorNotice('Gallery upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  function updateImage(index: number, patch: Partial<GalleryImage>) {
    setAttributes({
      images: images.map((image, i) => (i === index ? { ...image, ...patch } : image)),
    })
  }

  function removeImage(index: number) {
    setAttributes({
      images: images.filter((_, i) => i !== index),
    })
  }

  if (images.length === 0) {
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
          <Images size={20} />
          <span>Gallery</span>
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            style={primaryButtonStyle}
          >
            {isUploading ? 'Uploading…' : 'Upload images'}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => void handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>
    )
  }

  return (
    <figure style={{ margin: 0 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: 10,
        }}
      >
        {images.map((image, index) => (
          <figure key={image.url + index} style={{ margin: 0, position: 'relative' }}>
            <img
              src={image.url}
              alt={image.alt || ''}
              style={{
                width: '100%',
                height: attributes.imageCrop === false ? 'auto' : 160,
                objectFit: attributes.imageCrop === false ? 'contain' : 'cover',
                borderRadius: 2,
                display: 'block',
              }}
            />
            {isSelected && (
              <button
                type="button"
                onClick={() => removeImage(index)}
                style={removeButtonStyle}
                title="Remove image"
              >
                ×
              </button>
            )}
            <figcaption
              contentEditable={isSelected}
              suppressContentEditableWarning
              onBlur={(e) => updateImage(index, { caption: e.currentTarget.innerHTML })}
              style={{
                marginTop: 6,
                fontSize: 12,
                color: '#555',
                textAlign: 'center',
                outline: 'none',
                minHeight: 16,
              }}
              dangerouslySetInnerHTML={{ __html: image.caption || '' }}
            />
          </figure>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => void handleFiles(e.target.files)}
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

const removeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 6,
  right: 6,
  width: 22,
  height: 22,
  border: 'none',
  borderRadius: 11,
  backgroundColor: 'rgba(0,0,0,0.65)',
  color: '#fff',
  cursor: 'pointer',
  lineHeight: 1,
  fontSize: 14,
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

export const galleryBlock: BlockDefinition = {
  name: 'core/gallery',
  title: 'Gallery',
  description: 'Display multiple images in a rich gallery.',
  category: 'media',
  icon: <Images size={20} />,
  keywords: ['photos', 'images', 'album'],
  supports: {
    anchor: true,
    align: ['wide', 'full'],
    className: true,
  },
  attributes: {
    images: { type: 'array', default: [] },
    columns: { type: 'number', default: 3 },
    imageCrop: { type: 'boolean', default: true },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: GalleryEdit,
  save: ({ attributes }) => {
    const { images = [], columns = 3, imageCrop = true, className, anchor } = attributes as GalleryAttributes
    if (images.length === 0) return ''
    const classes = ['editor-block-gallery', 'has-nested-images', `columns-${columns}`]
    if (imageCrop) classes.push('is-cropped')
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const inner = images.map((image) => {
      const captionHtml = image.caption
        ? `\n<figcaption class="blocks-gallery-item__caption">${image.caption}</figcaption>`
        : ''
      return `<figure class="editor-block-image"><img src="${image.url}" alt="${image.alt ?? ''}" />${captionHtml}\n</figure>`
    }).join('\n')
    return `<figure class="${classes.join(' ')}"${anchorAttr}>\n${inner}\n</figure>`
  },
}
