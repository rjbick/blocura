import { useEffect, useRef } from 'react'
import { List } from 'lucide-react'
import type { Block, BlockDefinition, BlockEditProps } from '../../../types'
import { BlockList } from '../../../components/block/BlockList'
import { BlockAppender } from '../../../components/inserter/BlockAppender'
import { useEditorActions } from '../../../store'
import { generateClientId } from '../../../helpers/generateClientId'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface ListAttributes {
  values: string
  ordered: boolean
  className?: string
  anchor?: string
  start?: number
}

function isListElement(node: Element): node is HTMLOListElement | HTMLUListElement {
  const tag = node.tagName.toLowerCase()
  return tag === 'ol' || tag === 'ul'
}

function createListBlockFromElement(listEl: HTMLOListElement | HTMLUListElement): Block {
  const ordered = listEl.tagName.toLowerCase() === 'ol'
  const startAttr = listEl.getAttribute('start')
  const parsedStart = startAttr ? Number(startAttr) : 1

  return {
    clientId: generateClientId(),
    name: 'core/list',
    attributes: {
      values: '',
      ordered,
      start: Number.isFinite(parsedStart) && parsedStart > 0 ? parsedStart : 1,
    },
    innerBlocks: parseListItemsFromElement(listEl),
  }
}

function parseListItemsFromElement(listEl: HTMLOListElement | HTMLUListElement): Block[] {
  return Array.from(listEl.children)
    .filter((child): child is HTMLLIElement => child.tagName.toLowerCase() === 'li')
    .map((li) => {
      const clone = li.cloneNode(true) as HTMLLIElement
      const nestedListChildren = Array.from(li.children).filter(isListElement)
      Array.from(clone.children).forEach((child) => {
        if (isListElement(child)) child.remove()
      })

      const className = li.getAttribute('class') ?? ''
      const anchor = li.getAttribute('id') ?? ''

      return {
        clientId: generateClientId(),
        name: 'core/list-item',
        attributes: {
          content: clone.innerHTML.trim(),
          ...(className ? { className } : {}),
          ...(anchor ? { anchor } : {}),
        },
        innerBlocks: nestedListChildren.map((nested) => createListBlockFromElement(nested)),
      }
    })
}

function parseLegacyValuesToListItems(values: string, ordered: boolean, start: number): Block[] {
  const wrapper = document.createElement('div')
  const tag = ordered ? 'ol' : 'ul'
  wrapper.innerHTML = `<${tag}${ordered && start > 1 ? ` start="${start}"` : ''}>${values}</${tag}>`
  const list = wrapper.firstElementChild
  if (!list || !isListElement(list)) return []
  return parseListItemsFromElement(list)
}

function ListEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  innerBlocks = [],
}: BlockEditProps<ListAttributes>) {
  const { insertBlocks } = useEditorActions()
  const didHydrateLegacyRef = useRef(false)
  const ordered = attributes.ordered ?? false
  const start = attributes.start ?? 1

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>List type</div>
          <select
            value={ordered ? 'ol' : 'ul'}
            onChange={(e) => setAttributes({ ordered: e.target.value === 'ol' })}
            style={inspectorInputStyle}
          >
            <option value="ul">Bulleted</option>
            <option value="ol">Numbered</option>
          </select>
        </div>

        {ordered && (
          <div>
            <div style={inspectorLabelStyle}>Start value</div>
            <input
              type="number"
              min={1}
              value={start}
              onChange={(e) => setAttributes({ start: Math.max(Number(e.target.value) || 1, 1) })}
              style={inspectorInputStyle}
            />
          </div>
        )}
      </div>
    ),
    [ordered, start]
  )

  useEffect(() => {
    if (didHydrateLegacyRef.current) return
    didHydrateLegacyRef.current = true
    if (innerBlocks.length > 0) return
    if (!attributes.values?.trim()) return

    const parsed = parseLegacyValuesToListItems(attributes.values, ordered, start)
    if (parsed.length === 0) return
    insertBlocks(parsed, clientId, 0)
    setAttributes({ values: '' })
  }, [attributes.values, clientId, innerBlocks.length, insertBlocks, ordered, setAttributes, start])

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div
        style={{
          paddingLeft: 4,
          display: 'grid',
          gap: 2,
          minHeight: innerBlocks.length === 0 ? 28 : undefined,
          border: isSelected && innerBlocks.length === 0 ? '1px dashed #ddd' : undefined,
          borderRadius: 2,
        }}
      >
        <BlockList blocks={innerBlocks} rootClientId={clientId} />
      </div>

      {isSelected && <BlockAppender rootClientId={clientId} />}
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

export const listBlock: BlockDefinition = {
  name: 'core/list',
  title: 'List',
  description: 'An organized collection of items.',
  category: 'text',
  icon: <List size={20} />,
  keywords: ['ul', 'ol', 'bullet', 'numbered'],
  supports: {
    anchor: true,
    className: true,
    color: { text: true, background: true, gradients: true },
    typography: { fontSize: true },
    spacing: { padding: true, margin: true },
  },
  attributes: {
    values: { type: 'string', default: '' },
    ordered: { type: 'boolean', default: false },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
    start: { type: 'number', default: 1 },
  },
  edit: ListEdit,
  save: ({ attributes, innerBlocks = [] }) => {
    const { values, ordered, className, anchor, start } = attributes as ListAttributes
    const tag = ordered ? 'ol' : 'ul'
    const startAttr = ordered && start && start !== 1 ? ` start="${start}"` : ''
    const classes = ['editor-block-list']
    if (className) classes.push(className)
    const classAttr = ` class="${classes.join(' ')}"`
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const body = innerBlocks.length > 0 ? '<!--inner-->' : (values ?? '')
    return `<${tag}${classAttr}${anchorAttr}${startAttr}>${body}</${tag}>`
  },
}
