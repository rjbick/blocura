import { Heading } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { RichText } from '../../../components/richtext/RichText'
import { useEditorActions, useEditorStore } from '../../../store'
import { generateClientId } from '../../../helpers/generateClientId'
import { flattenBlocks } from '../../../helpers/flattenBlocks'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface HeadingAttrs {
  content: string
  level?: number
  placeholder?: string
  align?: string
  fontSize?: string
  style?: Record<string, unknown>
  textColor?: string
  backgroundColor?: string
  className?: string
  anchor?: string
}

function HeadingEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  insertBlocksAfter,
  mergeBlocks,
  onNavigateOut,
  initialPosition,
  onRemove,
}: BlockEditProps<HeadingAttrs>) {
  const { insertBlock } = useEditorActions()
  const blocks = useEditorStore(s => s.blocks)
  const level = attributes.level ?? 2
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  const fontSizes: Record<number, number> = {
    1: 36, 2: 28, 3: 24, 4: 20, 5: 18, 6: 16,
  }

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Heading level</div>
          <select
            value={level}
            onChange={(e) => setAttributes({ level: Number(e.target.value) || 2 })}
            style={inspectorInputStyle}
          >
            <option value={1}>H1</option>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
            <option value={4}>H4</option>
            <option value={5}>H5</option>
            <option value={6}>H6</option>
          </select>
        </div>

        <div>
          <div style={inspectorLabelStyle}>Placeholder</div>
          <input
            type="text"
            value={attributes.placeholder || ''}
            onChange={(e) => setAttributes({ placeholder: e.target.value })}
            placeholder={`Heading ${level}`}
            style={inspectorInputStyle}
          />
        </div>
      </div>
    ),
    [level, attributes.placeholder]
  )

  const handleSplit = (before: string, after: string) => {
    setAttributes({ content: before })

    const nextBlock = {
      clientId: generateClientId(),
      name: 'core/paragraph',
      attributes: { content: after, dropCap: false },
      innerBlocks: [],
    }
    if (insertBlocksAfter) {
      insertBlocksAfter([nextBlock])
      return
    }

    const flat = flattenBlocks(blocks)
    const idx = flat.findIndex((b) => b.clientId === clientId)

    insertBlock(
      nextBlock,
      null,
      idx + 1
    )
  }

  const handleRemove = (forward = false) => {
    onRemove?.(forward)
  }

  return (
    <Tag
      style={{
        margin: 0,
        padding: '3px 0',
        fontSize: fontSizes[level] || 28,
        fontWeight: 700,
        lineHeight: 1.4,
        textAlign: (attributes.align as React.CSSProperties['textAlign']) || 'left',
      }}
    >
      <RichText
        tagName={Tag}
        value={attributes.content}
        onChange={(content) => setAttributes({ content })}
        onSplit={handleSplit}
        onMerge={(forward) => mergeBlocks?.(forward)}
        onNavigateOut={(direction) => onNavigateOut?.(direction)}
        onRemove={handleRemove}
        placeholder={attributes.placeholder || `Heading ${level}`}
        isSelected={isSelected}
        initialPosition={initialPosition}
        style={{ fontWeight: 700, fontSize: fontSizes[level] || 28 }}
        disableLineBreaks
      />
    </Tag>
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

export const headingBlock: BlockDefinition = {
  name: 'core/heading',
  title: 'Heading',
  description: 'Introduce new sections and organize content to help visitors navigate the page.',
  category: 'text',
  icon: <Heading size={20} />,
  keywords: ['title', 'subtitle', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  supports: {
    anchor: true,
    className: true,
    color: { text: true, background: true, link: true, gradients: true },
    typography: {
      fontSize: true,
      lineHeight: true,
      fontFamily: true,
      fontWeight: true,
      fontStyle: true,
      textDecoration: true,
      textTransform: true,
      letterSpacing: true,
    },
    spacing: { margin: true, padding: true },
    __experimentalBorder: true,
  },
  attributes: {
    content: { type: 'string', source: 'html', selector: 'h1,h2,h3,h4,h5,h6', default: '' },
    level: { type: 'number', default: 2 },
    placeholder: { type: 'string' },
    align: { type: 'string' },
    fontSize: { type: 'string' },
    style: { type: 'object' },
    textColor: { type: 'string' },
    backgroundColor: { type: 'string' },
    className: { type: 'string' },
    anchor: { type: 'string' },
  },
  variations: [
    { name: 'h1', title: 'Heading 1', isDefault: false, attributes: { level: 1 } },
    { name: 'h2', title: 'Heading 2', isDefault: true, attributes: { level: 2 } },
    { name: 'h3', title: 'Heading 3', isDefault: false, attributes: { level: 3 } },
    { name: 'h4', title: 'Heading 4', isDefault: false, attributes: { level: 4 } },
    { name: 'h5', title: 'Heading 5', isDefault: false, attributes: { level: 5 } },
    { name: 'h6', title: 'Heading 6', isDefault: false, attributes: { level: 6 } },
  ],
  edit: HeadingEdit as BlockDefinition['edit'],
  save: ({ attributes }) => {
    const { content, level = 2, align, textColor, backgroundColor, fontSize, className, anchor } =
      attributes as HeadingAttrs
    const classes = [`wp-block-heading`]
    if (align) classes.push(`has-text-align-${align}`)
    if (textColor) classes.push(`has-${textColor}-color`, 'has-text-color')
    if (backgroundColor) classes.push(`has-${backgroundColor}-background-color`, 'has-background')
    if (fontSize) classes.push(`has-${fontSize}-font-size`)
    if (className) classes.push(className)
    const classStr = classes.join(' ')
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    return `<h${level} class="${classStr}"${anchorAttr}>${content}</h${level}>`
  },
  merge: (baseAttrs, mergeAttrs) => ({
    ...baseAttrs,
    content: (baseAttrs.content as string) + (mergeAttrs.content as string),
  }),
}
