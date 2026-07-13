import { Tags } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'

interface TagCloudAttributes {
  numberOfTags: number
  showTagCounts: boolean
  className?: string
  anchor?: string
}

interface DemoTag {
  name: string
  slug: string
  count: number
}

const DEMO_TAGS: DemoTag[] = [
  { name: 'Design', slug: 'design', count: 22 },
  { name: 'Accessibility', slug: 'accessibility', count: 14 },
  { name: 'Performance', slug: 'performance', count: 18 },
  { name: 'Gutenberg', slug: 'gutenberg', count: 26 },
  { name: 'Patterns', slug: 'patterns', count: 11 },
  { name: 'Blocks', slug: 'blocks', count: 23 },
  { name: 'React', slug: 'react', count: 20 },
  { name: 'TypeScript', slug: 'typescript', count: 17 },
  { name: 'Editorial', slug: 'editorial', count: 9 },
  { name: 'Workflow', slug: 'workflow', count: 13 },
  { name: 'UI', slug: 'ui', count: 15 },
  { name: 'Blocura', slug: 'blocura', count: 19 },
]

function getVisibleTags(numberOfTags: number): DemoTag[] {
  const limit = Math.min(Math.max(numberOfTags || 12, 1), 50)
  return DEMO_TAGS.slice(0, limit)
}

function getTagFontSize(tagCount: number, tags: DemoTag[]): number {
  const counts = tags.map((tag) => tag.count)
  const max = Math.max(...counts)
  const min = Math.min(...counts)
  if (max === min) return 16
  const normalized = (tagCount - min) / (max - min)
  return Math.round(12 + normalized * 14)
}

function TagCloudEdit({ attributes, setAttributes, isSelected }: BlockEditProps<TagCloudAttributes>) {
  const settings: TagCloudAttributes = {
    numberOfTags: Math.min(Math.max(attributes.numberOfTags || 12, 1), 50),
    showTagCounts: attributes.showTagCounts ?? false,
    className: attributes.className,
    anchor: attributes.anchor,
  }
  const tags = getVisibleTags(settings.numberOfTags)

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
        <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            Number of tags
            <input
              type="number"
              min={1}
              max={50}
              value={settings.numberOfTags}
              onChange={(e) =>
                setAttributes({ numberOfTags: Math.min(Math.max(Number(e.target.value) || 1, 1), 50) })
              }
              style={controlInputStyle}
            />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <input
              type="checkbox"
              checked={settings.showTagCounts}
              onChange={(e) => setAttributes({ showTagCounts: e.target.checked })}
            />
            Show tag counts
          </label>
        </div>
      )}

      <p style={{ margin: 0, lineHeight: 1.8 }}>
        {tags.map((tag) => (
          <a
            key={tag.slug}
            href={`#tag-${tag.slug}`}
            style={{
              fontSize: `${getTagFontSize(tag.count, tags)}px`,
              marginRight: 10,
              color: 'var(--editor-components-color-accent)',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            {tag.name}
            {settings.showTagCounts ? ` (${tag.count})` : ''}
          </a>
        ))}
      </p>
    </div>
  )
}

const controlInputStyle: React.CSSProperties = {
  border: '1px solid var(--editor-border)',
  borderRadius: 2,
  padding: '6px 8px',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
  backgroundColor: '#fff',
  width: 80,
}

export const tagCloudBlock: BlockDefinition = {
  name: 'core/tag-cloud',
  title: 'Tag Cloud',
  description: 'Display popular tags with weighted sizes.',
  category: 'widgets',
  icon: <Tags size={20} />,
  keywords: ['tags', 'taxonomy', 'cloud'],
  supports: {
    align: ['left', 'center', 'right', 'wide', 'full'],
    anchor: true,
    className: true,
  },
  attributes: {
    numberOfTags: { type: 'number', default: 12 },
    showTagCounts: { type: 'boolean', default: false },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: TagCloudEdit,
  save: ({ attributes }) => {
    const settings: TagCloudAttributes = {
      numberOfTags: Math.min(Math.max((attributes as TagCloudAttributes).numberOfTags || 12, 1), 50),
      showTagCounts: (attributes as TagCloudAttributes).showTagCounts ?? false,
      className: (attributes as TagCloudAttributes).className,
      anchor: (attributes as TagCloudAttributes).anchor,
    }
    const tags = getVisibleTags(settings.numberOfTags)
    const classes = ['editor-block-tag-cloud']
    if (settings.className) classes.push(settings.className)
    const anchorAttr = settings.anchor ? ` id="${settings.anchor}"` : ''
    const links = tags
      .map((tag) => {
        const size = getTagFontSize(tag.count, tags)
        return `<a href="#tag-${tag.slug}" class="tag-cloud-link" style="font-size:${size}px">${tag.name}${settings.showTagCounts ? ` (${tag.count})` : ''}</a>`
      })
      .join(' ')
    return `<p class="${classes.join(' ')}"${anchorAttr}>${links}</p>`
  },
}
