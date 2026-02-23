import { useState, useRef } from 'react'
import { AlignLeft } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { RichText } from '../../../components/richtext/RichText'
import { SlashInserter } from '../../../components/inserter/SlashInserter'
import { useEditorActions, useEditorStore } from '../../../store'
import { generateClientId } from '../../../helpers/generateClientId'
import { flattenBlocks, findBlockParent } from '../../../helpers/flattenBlocks'
import { createBlockFromDefinition } from '../../../helpers/insertionRules'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface ParagraphAttrs {
  content: string
  dropCap?: boolean
  placeholder?: string
  align?: string
  fontSize?: string
  style?: Record<string, unknown>
  textColor?: string
  backgroundColor?: string
  gradient?: string
  className?: string
  anchor?: string
}

/** Strip all HTML tags to get plain text */
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

function ParagraphEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  insertBlocksAfter,
  mergeBlocks,
  onNavigateOut,
  initialPosition,
  onRemove,
}: BlockEditProps<ParagraphAttrs>) {
  const { insertBlock, replaceBlock } = useEditorActions()
  const blocks = useEditorStore(s => s.blocks)
  const [slashQuery, setSlashQuery] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const parent = findBlockParent(blocks, clientId)

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <input
            type="checkbox"
            checked={attributes.dropCap ?? false}
            onChange={(e) => setAttributes({ dropCap: e.target.checked })}
          />
          Drop cap
        </label>

        <div>
          <div style={inspectorLabelStyle}>Placeholder</div>
          <input
            type="text"
            value={attributes.placeholder || ''}
            onChange={(e) => setAttributes({ placeholder: e.target.value })}
            placeholder="Type / to choose a block"
            style={inspectorInputStyle}
          />
        </div>
      </div>
    ),
    [attributes.dropCap, attributes.placeholder]
  )

  const handleChange = (content: string) => {
    setAttributes({ content })
    const text = stripTags(content)
    if (text.startsWith('/')) {
      setSlashQuery(text.slice(1))
    } else {
      if (slashQuery !== null) setSlashQuery(null)
    }
  }

  const handleSplit = (before: string, after: string) => {
    setSlashQuery(null)
    // Update current block with before content
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

    // Find position of this block and insert after
    const flat = flattenBlocks(blocks)
    const idx = flat.findIndex((b) => b.clientId === clientId)

    // Insert new paragraph after
    insertBlock(
      nextBlock,
      null,
      idx + 1
    )
  }

  const handleMerge = (forward: boolean) => {
    mergeBlocks?.(forward)
  }

  const handleRemove = (forward: boolean) => {
    onRemove?.(forward)
  }

  const handleNavigateOut = (direction: 'up' | 'down') => {
    onNavigateOut?.(direction)
  }

  const handleSlashSelect = (def: BlockDefinition) => {
    setSlashQuery(null)
    replaceBlock(clientId, createBlockFromDefinition(def))
  }

  const handleSlashClose = () => {
    setSlashQuery(null)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <RichText
        tagName="p"
        value={attributes.content}
        onChange={handleChange}
        onSplit={handleSplit}
        onMerge={handleMerge}
        onRemove={handleRemove}
        onNavigateOut={handleNavigateOut}
        placeholder={attributes.placeholder || 'Type / to choose a block'}
        isSelected={isSelected}
        initialPosition={initialPosition}
        style={{
          margin: 0,
          padding: '3px 0',
          minHeight: '1.6em',
          lineHeight: 1.8,
          fontSize: 16,
          textAlign: (attributes.align as React.CSSProperties['textAlign']) || 'left',
        }}
      />
      {slashQuery !== null && isSelected && (
        <SlashInserter
          anchorEl={containerRef.current}
          rootClientId={parent?.clientId ?? null}
          query={slashQuery}
          onSelect={handleSlashSelect}
          onClose={handleSlashClose}
        />
      )}
    </div>
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
  fontFamily: 'var(--editor-font-family)',
}

export const paragraphBlock: BlockDefinition = {
  name: 'core/paragraph',
  title: 'Paragraph',
  description: 'Start with the building block of all narrative.',
  category: 'text',
  icon: <AlignLeft size={20} />,
  keywords: ['text', 'paragraph', 'p'],
  supports: {
    anchor: true,
    className: true,
    color: {
      text: true,
      background: true,
      link: true,
      gradients: true,
    },
    typography: {
      fontSize: true,
      lineHeight: true,
      fontFamily: true,
      fontWeight: true,
      fontStyle: true,
      textDecoration: true,
      textTransform: true,
      letterSpacing: true,
      textColumns: true,
    },
    spacing: {
      margin: true,
      padding: true,
    },
    __experimentalBorder: true,
  },
  attributes: {
    content: { type: 'string', source: 'html', selector: 'p', default: '' },
    dropCap: { type: 'boolean', default: false },
    placeholder: { type: 'string' },
    align: { type: 'string' },
    fontSize: { type: 'string' },
    style: { type: 'object' },
    textColor: { type: 'string' },
    backgroundColor: { type: 'string' },
    gradient: { type: 'string' },
    className: { type: 'string' },
    anchor: { type: 'string' },
  },
  edit: ParagraphEdit as BlockDefinition['edit'],
  save: ({ attributes }) => {
    const { content, align, dropCap, textColor, backgroundColor, fontSize, className, anchor } =
      attributes as ParagraphAttrs
    const classes = ['editor-block-paragraph']
    if (dropCap) classes.push('has-drop-cap')
    if (align) classes.push(`has-text-align-${align}`)
    if (textColor) classes.push(`has-${textColor}-color`, 'has-text-color')
    if (backgroundColor) classes.push(`has-${backgroundColor}-background-color`, 'has-background')
    if (fontSize) classes.push(`has-${fontSize}-font-size`)
    if (className) classes.push(className)
    const classStr = classes.join(' ')
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    return `<p class="${classStr}"${anchorAttr}>${content}</p>`
  },
  merge: (baseAttrs, mergeAttrs) => ({
    ...baseAttrs,
    content: (baseAttrs.content as string) + (mergeAttrs.content as string),
  }),
}
