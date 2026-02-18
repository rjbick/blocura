import { Minus } from 'lucide-react'
import type { BlockDefinition } from '../../../types'

export const separatorBlock: BlockDefinition = {
  name: 'core/separator',
  title: 'Separator',
  description: 'Create a break between ideas or sections with a horizontal separator.',
  category: 'design',
  icon: <Minus size={20} />,
  keywords: ['horizontal-rule', 'hr', 'line', 'divider'],
  supports: {
    align: ['left', 'center', 'right', 'wide', 'full'],
    color: { text: true, background: true },
    spacing: { margin: true },
  },
  attributes: {
    align: { type: 'string' },
    backgroundColor: { type: 'string' },
    style: { type: 'object' },
    opacity: { type: 'string', default: 'alpha-channel' },
    className: { type: 'string' },
  },
  edit: function SeparatorEdit({ attributes }) {
    const { align, backgroundColor } = attributes as { align?: string; backgroundColor?: string }
    return (
      <hr
        style={{
          border: 'none',
          borderTop: '2px solid',
          borderColor: backgroundColor ?? 'currentColor',
          margin: '2em auto',
          width: align === 'wide' ? '100%' : align === 'full' ? '100vw' : 200,
        }}
      />
    )
  },
  save: ({ attributes }) => {
    const { align, backgroundColor, className } = attributes as {
      align?: string; backgroundColor?: string; className?: string
    }
    const classes = ['wp-block-separator']
    if (align) classes.push(`align${align}`)
    if (backgroundColor) classes.push(`has-${backgroundColor}-background-color`, 'has-background')
    if (className) classes.push(className)
    return `<hr class="${classes.join(' ')}" />`
  },
}
