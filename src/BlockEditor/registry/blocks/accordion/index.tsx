import { ListCollapse } from 'lucide-react'
import type { Block, BlockDefinition, BlockEditProps } from '../../../types'
import { BlockList } from '../../../components/block/BlockList'
import { BlockAppender } from '../../../components/inserter/BlockAppender'
import { useEditorActions } from '../../../store'
import { generateClientId } from '../../../helpers/generateClientId'

interface AccordionAttrs {
  className?: string
  anchor?: string
}

const detailsItem = (summary: string): Block => ({
  clientId: generateClientId(),
  name: 'core/details',
  attributes: { summary },
  innerBlocks: [
    {
      clientId: generateClientId(),
      name: 'core/paragraph',
      attributes: { content: '' },
      innerBlocks: [],
    },
  ],
})

function AccordionEdit({
  clientId,
  isSelected,
  innerBlocks = [],
}: BlockEditProps<AccordionAttrs>) {
  const { insertBlocks } = useEditorActions()

  const addItem = () => {
    insertBlocks([detailsItem('')], clientId, innerBlocks.length)
  }

  return (
    <div className="editor-block-accordion" style={{ display: 'grid', gap: 0 }}>
      {innerBlocks.length === 0 ? (
        <div
          style={{
            border: '2px dashed #ddd',
            borderRadius: 2,
            padding: '20px',
            textAlign: 'center',
            fontFamily: 'var(--editor-font-family)',
            fontSize: 13,
          }}
        >
          <button type="button" onClick={addItem} style={addButtonStyle}>
            Add first item
          </button>
        </div>
      ) : (
        <>
          <BlockList blocks={innerBlocks} rootClientId={clientId} />
          {isSelected && <BlockAppender rootClientId={clientId} />}
        </>
      )}
    </div>
  )
}

const addButtonStyle: React.CSSProperties = {
  backgroundColor: '#2271b1',
  color: '#fff',
  border: 'none',
  borderRadius: 2,
  padding: '8px 12px',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
  cursor: 'pointer',
}

export const accordionBlock: BlockDefinition = {
  name: 'core/accordion',
  title: 'Accordion',
  description: 'A stack of collapsible sections — ideal for FAQs.',
  category: 'design',
  icon: <ListCollapse size={20} />,
  keywords: ['accordion', 'faq', 'collapsible', 'details', 'toggle'],
  supports: {
    anchor: true,
    className: true,
    html: false,
    inserter: true,
    multiple: true,
    reusable: true,
  },
  attributes: {
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: AccordionEdit as BlockDefinition['edit'],
  save: ({ attributes, innerBlocks = [] }) => {
    const { className, anchor } = attributes as AccordionAttrs
    const classes = ['editor-block-accordion', className].filter(Boolean).join(' ')
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const innerHtml = innerBlocks.map(() => '<!-- inner block -->').join('\n')
    return `<div class="${classes}"${anchorAttr}>\n${innerHtml}\n</div>`
  },
}
