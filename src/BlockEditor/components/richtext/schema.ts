import { Schema } from 'prosemirror-model'
import { nodes as basicNodes, marks as basicMarks } from 'prosemirror-schema-basic'
import { orderedList, bulletList, listItem } from 'prosemirror-schema-list'

// Extended schema for Gutenberg-compatible rich text
export const schema = new Schema({
  nodes: {
    doc: basicNodes.doc,
    paragraph: basicNodes.paragraph,
    text: basicNodes.text,
    hard_break: basicNodes.hard_break,
    horizontal_rule: basicNodes.horizontal_rule,
    // List nodes
    ordered_list: {
      ...orderedList,
      content: 'list_item+',
      group: 'block',
    },
    bullet_list: {
      ...bulletList,
      content: 'list_item+',
      group: 'block',
    },
    list_item: {
      ...listItem,
      content: 'paragraph block*',
    },
  },
  marks: {
    ...basicMarks,
    // Standard marks
    bold: {
      parseDOM: [
        { tag: 'strong' },
        { tag: 'b', getAttrs: (node: HTMLElement) => node.style.fontWeight !== 'normal' && null },
        {
          style: 'font-weight',
          getAttrs: (value: string) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
        },
      ],
      toDOM: () => ['strong', 0],
    },
    italic: {
      parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
      toDOM: () => ['em', 0],
    },
    underline: {
      parseDOM: [
        { tag: 'u' },
        { style: 'text-decoration=underline' },
      ],
      toDOM: () => ['u', 0],
    },
    strikethrough: {
      parseDOM: [
        { tag: 's' },
        { tag: 'del' },
        { tag: 'strike' },
        { style: 'text-decoration=line-through' },
      ],
      toDOM: () => ['s', 0],
    },
    code: {
      parseDOM: [{ tag: 'code' }],
      toDOM: () => ['code', 0],
    },
    subscript: {
      excludes: 'superscript',
      parseDOM: [{ tag: 'sub' }],
      toDOM: () => ['sub', 0],
    },
    superscript: {
      excludes: 'subscript',
      parseDOM: [{ tag: 'sup' }],
      toDOM: () => ['sup', 0],
    },
    keyboard: {
      parseDOM: [{ tag: 'kbd' }],
      toDOM: () => ['kbd', 0],
    },
    link: {
      attrs: {
        href: {},
        title: { default: null },
        target: { default: null },
        rel: { default: null },
      },
      inclusive: false,
      parseDOM: [
        {
          tag: 'a[href]',
          getAttrs: (dom: HTMLElement) => ({
            href: dom.getAttribute('href'),
            title: dom.getAttribute('title'),
            target: dom.getAttribute('target'),
            rel: dom.getAttribute('rel'),
          }),
        },
      ],
      toDOM: (mark) => {
        const { href, title, target, rel } = mark.attrs as {
          href: string; title: string | null; target: string | null; rel: string | null
        }
        return ['a', { href, title, target, rel }, 0]
      },
    },
    // Text color — uses <mark> with style
    textColor: {
      attrs: { color: {} },
      parseDOM: [
        {
          tag: 'mark[style]',
          getAttrs: (dom: HTMLElement) => {
            const color = dom.style.color
            return color ? { color } : false
          },
          consuming: false,
        },
      ],
      toDOM: (mark) => {
        const { color } = mark.attrs as { color: string }
        const slug = color.replace(/[^a-z0-9-]/g, '')
        return [
          'mark',
          {
            style: `color:${color}`,
            class: `has-${slug}-color`,
          },
          0,
        ]
      },
    },
    // Highlight — uses <mark> with background-color
    highlight: {
      attrs: { color: {} },
      parseDOM: [
        {
          tag: 'mark[style]',
          getAttrs: (dom: HTMLElement) => {
            const bg = dom.style.backgroundColor
            return bg ? { color: bg } : false
          },
          consuming: false,
        },
      ],
      toDOM: (mark) => {
        const { color } = mark.attrs as { color: string }
        const slug = color.replace(/[^a-z0-9-]/g, '')
        return [
          'mark',
          {
            style: `background-color:${color}`,
            class: `has-${slug}-background-color`,
          },
          0,
        ]
      },
    },
    // Language
    language: {
      attrs: { lang: {} },
      parseDOM: [
        {
          tag: 'span[lang]',
          getAttrs: (dom: HTMLElement) => ({ lang: dom.getAttribute('lang') }),
        },
      ],
      toDOM: (mark) => ['span', { lang: (mark.attrs as { lang: string }).lang }, 0],
    },
  },
})

export type EditorSchema = typeof schema

// Helper: serialize ProseMirror node to HTML string
export function serializeToHTML(doc: ReturnType<EditorSchema['node']>): string {
  const fragment = doc.content
  const div = document.createElement('div')

  fragment.forEach((node) => {
    div.appendChild(nodeToDOM(node))
  })

  return div.innerHTML
}

function nodeToDOM(node: ReturnType<EditorSchema['node']>): Node {
  if (node.isText) {
    let domNode: Node = document.createTextNode(node.text ?? '')

    // Apply marks from innermost to outermost
    const marks = [...node.marks].reverse()
    for (const mark of marks) {
      const [tag, attrs] = mark.type.spec.toDOM!(mark, false) as [string, Record<string, string>, number]
      const el = document.createElement(tag)
      if (attrs) {
        for (const [k, v] of Object.entries(attrs)) {
          if (v != null) el.setAttribute(k, v)
        }
      }
      el.appendChild(domNode)
      domNode = el
    }

    return domNode
  }

  const spec = node.type.spec
  const [tag, attrs] = spec.toDOM ? (spec.toDOM(node) as [string, Record<string, string>]) : ['span', {}]
  const el = document.createElement(tag)
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k !== 'contenteditable' && v != null) el.setAttribute(k, String(v))
    }
  }

  node.forEach((child: ReturnType<EditorSchema['node']>) => {
    el.appendChild(nodeToDOM(child))
  })

  return el
}
