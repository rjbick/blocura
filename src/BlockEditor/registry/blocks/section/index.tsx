import { Group as SectionIcon } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { BlockList } from '../../../components/block/BlockList'
import { BlockAppender } from '../../../components/inserter/BlockAppender'
import { getCombinedInlineStyleObject, type BlockStyleAttrs } from '../../../helpers/inlineStyles'
import { serializeInlineStyleAttribute } from '../../../helpers/inlineStyles'

interface SectionAttributes {
  className?: string
  anchor?: string
  style?: BlockStyleAttrs
  backgroundColor?: string
  textColor?: string
  gradient?: string
  layout?: Record<string, unknown>
}

function hasPaddingStyle(style: Record<string, unknown>): boolean {
  return (
    'padding' in style ||
    'paddingTop' in style ||
    'paddingRight' in style ||
    'paddingBottom' in style ||
    'paddingLeft' in style
  )
}

function SectionEdit({
  clientId,
  attributes,
  isSelected,
  innerBlocks = [],
}: BlockEditProps<SectionAttributes>) {
  const {
    className,
    backgroundColor,
    textColor,
    gradient,
  } = attributes

  const combinedStyle = getCombinedInlineStyleObject(attributes as unknown as Record<string, unknown>)
  const shouldAddDefaultPadding = !className && !hasPaddingStyle(combinedStyle)

  return (
    <section
      className={className || undefined}
      style={{
        ...(shouldAddDefaultPadding ? { padding: '24px' } : {}),
        ...combinedStyle,
        ...(backgroundColor && !combinedStyle.backgroundColor
          ? { backgroundColor: `var(--editor--preset--color--${backgroundColor})` }
          : {}),
        ...(textColor && !combinedStyle.color
          ? { color: `var(--editor--preset--color--${textColor})` }
          : {}),
        ...(gradient && !combinedStyle.backgroundImage
          ? { backgroundImage: `var(--editor--preset--gradient--${gradient})` }
          : {}),
        minHeight: combinedStyle.minHeight ?? (innerBlocks.length === 0 ? 64 : undefined),
        border: innerBlocks.length === 0 && isSelected ? '1px dashed #ddd' : undefined,
        borderRadius: combinedStyle.borderRadius as string | number | undefined ?? 2,
      }}
    >
      <BlockList blocks={innerBlocks} rootClientId={clientId} displayContents />
      {innerBlocks.length === 0 && isSelected && (
        <BlockAppender rootClientId={clientId} />
      )}
    </section>
  )
}

export const sectionBlock: BlockDefinition = {
  name: 'core/section',
  title: 'Section',
  description: 'Structure content with semantic section containers.',
  category: 'design',
  icon: <SectionIcon size={20} />,
  keywords: ['container', 'wrapper', 'semantic'],
  supports: {
    anchor: true,
    align: ['wide', 'full'],
    className: true,
    color: { text: true, background: true, gradients: true },
    spacing: { padding: true, margin: true, blockGap: true },
    border: { color: true, radius: true, style: true, width: true },
    layout: true,
  },
  attributes: {
    className: { type: 'string' as const, default: '' },
    anchor: { type: 'string' as const, default: '' },
    style: { type: 'object' as const, default: {} },
    backgroundColor: { type: 'string' as const, default: '' },
    textColor: { type: 'string' as const, default: '' },
    gradient: { type: 'string' as const, default: '' },
    layout: { type: 'object' as const, default: {} },
  },
  edit: SectionEdit,
  save: ({ attributes, innerBlocks = [] }) => {
    const { className, anchor } = attributes as SectionAttributes
    const classAttr = ['editor-block-section', className].filter(Boolean).join(' ')
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const styleAttr = serializeInlineStyleAttribute(attributes as Record<string, unknown>)
    const innerHtml = innerBlocks.map(() => '<!-- inner block -->').join('\n')
    return `<section class="${classAttr}"${anchorAttr}${styleAttr}>\n${innerHtml}\n</section>`
  },
}
