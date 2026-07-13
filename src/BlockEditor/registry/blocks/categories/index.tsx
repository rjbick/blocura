import { FolderTree } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'

interface CategoriesAttributes {
  displayAsDropdown: boolean
  showPostCounts: boolean
  showHierarchy: boolean
  className?: string
  anchor?: string
}

interface DemoCategory {
  id: number
  name: string
  url: string
  count: number
  parentId: number | null
}

const DEMO_CATEGORIES: DemoCategory[] = [
  { id: 1, name: 'News', url: '#news', count: 12, parentId: null },
  { id: 2, name: 'Company', url: '#company', count: 4, parentId: 1 },
  { id: 3, name: 'Product', url: '#product', count: 8, parentId: 1 },
  { id: 4, name: 'Tutorials', url: '#tutorials', count: 6, parentId: null },
  { id: 5, name: 'Releases', url: '#releases', count: 3, parentId: 4 },
]

function getCategoryDepth(categories: DemoCategory[], category: DemoCategory): number {
  let depth = 0
  let parentId = category.parentId
  while (parentId !== null) {
    const parent = categories.find((entry) => entry.id === parentId)
    if (!parent) break
    depth += 1
    parentId = parent.parentId
  }
  return depth
}

function CategoriesEdit({
  attributes,
  setAttributes,
  isSelected,
}: BlockEditProps<CategoriesAttributes>) {
  const settings: CategoriesAttributes = {
    displayAsDropdown: attributes.displayAsDropdown ?? false,
    showPostCounts: attributes.showPostCounts ?? false,
    showHierarchy: attributes.showHierarchy ?? false,
    className: attributes.className,
    anchor: attributes.anchor,
  }

  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        padding: 12,
        backgroundColor: '#fff',
        fontFamily: 'var(--editor-font-family)',
      }}
    >
      {isSelected && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 10,
            fontSize: 12,
          }}
        >
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={settings.displayAsDropdown}
              onChange={(e) => setAttributes({ displayAsDropdown: e.target.checked })}
            />
            Display as dropdown
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={settings.showPostCounts}
              onChange={(e) => setAttributes({ showPostCounts: e.target.checked })}
            />
            Show post counts
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={settings.showHierarchy}
              onChange={(e) => setAttributes({ showHierarchy: e.target.checked })}
            />
            Show hierarchy
          </label>
        </div>
      )}

      {settings.displayAsDropdown ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, color: 'var(--editor-text-muted)' }}>Select Category</label>
          <select
            value=""
            onChange={() => undefined}
            style={{
              border: '1px solid var(--editor-border)',
              borderRadius: 2,
              padding: '6px 8px',
              fontSize: 13,
              backgroundColor: '#fff',
              fontFamily: 'inherit',
            }}
          >
            <option value="">Select Category</option>
            {DEMO_CATEGORIES.map((category) => {
              const depth = settings.showHierarchy ? getCategoryDepth(DEMO_CATEGORIES, category) : 0
              const prefix = depth > 0 ? `${'— '.repeat(depth)}` : ''
              const count = settings.showPostCounts ? ` (${category.count})` : ''
              return (
                <option key={category.id} value={category.url}>
                  {prefix}{category.name}{count}
                </option>
              )
            })}
          </select>
        </div>
      ) : (
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            fontSize: 13,
          }}
        >
          {DEMO_CATEGORIES.map((category) => {
            const depth = settings.showHierarchy ? getCategoryDepth(DEMO_CATEGORIES, category) : 0
            const count = settings.showPostCounts ? ` (${category.count})` : ''
            return (
              <li key={category.id} style={{ marginLeft: depth * 14 }}>
                <a
                  href={category.url}
                  style={{ color: 'var(--editor-components-color-accent)', textDecoration: 'none' }}
                >
                  {category.name}
                </a>
                {count}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export const categoriesBlock: BlockDefinition = {
  name: 'core/categories',
  title: 'Categories',
  description: 'Display a list or dropdown of categories.',
  category: 'widgets',
  icon: <FolderTree size={20} />,
  keywords: ['taxonomy', 'category', 'terms'],
  supports: {
    align: ['left', 'center', 'right', 'wide', 'full'],
    anchor: true,
    className: true,
  },
  attributes: {
    displayAsDropdown: { type: 'boolean', default: false },
    showPostCounts: { type: 'boolean', default: false },
    showHierarchy: { type: 'boolean', default: false },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: CategoriesEdit,
  save: ({ attributes }) => {
    const settings: CategoriesAttributes = {
      displayAsDropdown: (attributes as CategoriesAttributes).displayAsDropdown ?? false,
      showPostCounts: (attributes as CategoriesAttributes).showPostCounts ?? false,
      showHierarchy: (attributes as CategoriesAttributes).showHierarchy ?? false,
      className: (attributes as CategoriesAttributes).className,
      anchor: (attributes as CategoriesAttributes).anchor,
    }
    const classes = ['editor-block-categories']
    if (settings.className) classes.push(settings.className)
    const anchorAttr = settings.anchor ? ` id="${settings.anchor}"` : ''

    if (settings.displayAsDropdown) {
      const options = DEMO_CATEGORIES
        .map((category) => {
          const depth = settings.showHierarchy ? getCategoryDepth(DEMO_CATEGORIES, category) : 0
          const prefix = depth > 0 ? `${'— '.repeat(depth)}` : ''
          const count = settings.showPostCounts ? ` (${category.count})` : ''
          return `<option value="${category.url}">${prefix}${category.name}${count}</option>`
        })
        .join('')
      return `<div class="${classes.join(' ')}"${anchorAttr}><label class="editor-block-categories__label">Categories</label><select name="cat" class="editor-block-categories-dropdown"><option value="">Select Category</option>${options}</select></div>`
    }

    const items = DEMO_CATEGORIES
      .map((category) => {
        const depth = settings.showHierarchy ? getCategoryDepth(DEMO_CATEGORIES, category) : 0
        const count = settings.showPostCounts ? ` (${category.count})` : ''
        const style = depth > 0 ? ` style="margin-left:${depth * 14}px"` : ''
        return `<li${style}><a href="${category.url}">${category.name}</a>${count}</li>`
      })
      .join('')
    return `<ul class="${classes.join(' ')}"${anchorAttr}>${items}</ul>`
  },
}
