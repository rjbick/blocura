import { ListTree } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'

interface PageListAttributes {
  sortOrder: 'asc' | 'desc'
  displayDate: boolean
  className?: string
  anchor?: string
}

interface DemoPage {
  title: string
  url: string
  date: string
}

const DEMO_PAGES: DemoPage[] = [
  { title: 'About', url: '#about', date: '2025-07-01' },
  { title: 'Services', url: '#services', date: '2025-09-10' },
  { title: 'Team', url: '#team', date: '2025-10-04' },
  { title: 'Contact', url: '#contact', date: '2025-12-19' },
  { title: 'Privacy Policy', url: '#privacy-policy', date: '2026-01-11' },
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function getVisiblePages(sortOrder: 'asc' | 'desc'): DemoPage[] {
  const pages = [...DEMO_PAGES]
  pages.sort((a, b) =>
    sortOrder === 'asc'
      ? a.title.localeCompare(b.title)
      : b.title.localeCompare(a.title)
  )
  return pages
}

function PageListEdit({ attributes, setAttributes, isSelected }: BlockEditProps<PageListAttributes>) {
  const settings: PageListAttributes = {
    sortOrder: attributes.sortOrder || 'asc',
    displayDate: attributes.displayDate ?? false,
    className: attributes.className,
    anchor: attributes.anchor,
  }
  const pages = getVisiblePages(settings.sortOrder)

  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        padding: 12,
        backgroundColor: '#fff',
        fontFamily: 'var(--wp-font-family)',
      }}
    >
      {isSelected && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            Sort order
            <select
              value={settings.sortOrder}
              onChange={(e) => setAttributes({ sortOrder: e.target.value as PageListAttributes['sortOrder'] })}
              style={controlInputStyle}
            >
              <option value="asc">A to Z</option>
              <option value="desc">Z to A</option>
            </select>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <input
              type="checkbox"
              checked={settings.displayDate}
              onChange={(e) => setAttributes({ displayDate: e.target.checked })}
            />
            Show date
          </label>
        </div>
      )}

      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {pages.map((page) => (
          <li key={page.url}>
            <a href={page.url} style={{ color: 'var(--wp-components-color-accent)', textDecoration: 'none' }}>
              {page.title}
            </a>
            {settings.displayDate && (
              <div style={{ marginTop: 2, color: '#757575', fontSize: 12 }}>{formatDate(page.date)}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

const controlInputStyle: React.CSSProperties = {
  border: '1px solid #dcdcde',
  borderRadius: 2,
  padding: '6px 8px',
  fontSize: 13,
  fontFamily: 'var(--wp-font-family)',
  backgroundColor: '#fff',
}

export const pageListBlock: BlockDefinition = {
  name: 'core/page-list',
  title: 'Page List',
  description: 'Display a list of your site pages.',
  category: 'widgets',
  icon: <ListTree size={20} />,
  keywords: ['pages', 'navigation', 'list'],
  supports: {
    align: ['left', 'center', 'right', 'wide', 'full'],
    anchor: true,
    className: true,
  },
  attributes: {
    sortOrder: { type: 'string', default: 'asc' },
    displayDate: { type: 'boolean', default: false },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: PageListEdit,
  save: ({ attributes }) => {
    const settings: PageListAttributes = {
      sortOrder: (attributes as PageListAttributes).sortOrder || 'asc',
      displayDate: (attributes as PageListAttributes).displayDate ?? false,
      className: (attributes as PageListAttributes).className,
      anchor: (attributes as PageListAttributes).anchor,
    }
    const pages = getVisiblePages(settings.sortOrder)
    const classes = ['wp-block-page-list']
    if (settings.className) classes.push(settings.className)
    const anchorAttr = settings.anchor ? ` id="${settings.anchor}"` : ''
    const items = pages
      .map((page) => {
        const dateHtml = settings.displayDate
          ? `<time datetime="${page.date}" class="wp-block-page-list__date">${formatDate(page.date)}</time>`
          : ''
        return `<li><a href="${page.url}">${page.title}</a>${dateHtml}</li>`
      })
      .join('')
    return `<ul class="${classes.join(' ')}"${anchorAttr}>${items}</ul>`
  },
}
