import { Newspaper } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'

interface LatestPostsAttributes {
  postsToShow: number
  order: 'desc' | 'asc'
  displayPostDate: boolean
  displayExcerpt: boolean
  excerptLength: number
  className?: string
  anchor?: string
}

interface DemoPost {
  title: string
  date: string
  excerpt: string
  url: string
}

const DEMO_POSTS: DemoPost[] = [
  {
    title: 'Building a Block-Based Editorial Workflow',
    date: '2026-02-14',
    excerpt: 'Learn how to structure your publishing flow with reusable patterns and consistent block presets.',
    url: '#block-workflow',
  },
  {
    title: 'Design Tokens for Gutenberg-Compatible UI',
    date: '2026-02-09',
    excerpt: 'Token-driven design keeps spacing, typography, and color behavior predictable across every block.',
    url: '#design-tokens',
  },
  {
    title: 'Shipping Faster With Pattern-First Content',
    date: '2026-02-01',
    excerpt: 'Prebuilt patterns eliminate repetitive setup and make content assembly significantly faster.',
    url: '#patterns',
  },
  {
    title: 'Improving Accessibility in Rich Text Editors',
    date: '2026-01-28',
    excerpt: 'Small interaction improvements in keyboard handling and focus rings create large accessibility gains.',
    url: '#accessibility',
  },
  {
    title: 'How We Structured Block Validation',
    date: '2026-01-22',
    excerpt: 'A save-to-source validation pass helps detect drift and keeps stored block markup trustworthy.',
    url: '#validation',
  },
  {
    title: 'Using List View for Faster Page Editing',
    date: '2026-01-17',
    excerpt: 'List View is the quickest way to select deeply nested blocks and manage structure at scale.',
    url: '#list-view',
  },
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function trimWords(value: string, length: number): string {
  const words = value.trim().split(/\s+/)
  if (words.length <= length) return value
  return `${words.slice(0, length).join(' ')}…`
}

function getVisiblePosts(attributes: LatestPostsAttributes): DemoPost[] {
  const sorted = [...DEMO_POSTS].sort((a, b) => {
    const first = new Date(a.date).getTime()
    const second = new Date(b.date).getTime()
    return attributes.order === 'asc' ? first - second : second - first
  })
  const limit = Math.min(Math.max(attributes.postsToShow || 5, 1), 20)
  return sorted.slice(0, limit)
}

function LatestPostsEdit({ attributes, setAttributes, isSelected }: BlockEditProps<LatestPostsAttributes>) {
  const settings: LatestPostsAttributes = {
    postsToShow: Math.min(Math.max(attributes.postsToShow || 5, 1), 20),
    order: attributes.order || 'desc',
    displayPostDate: attributes.displayPostDate ?? false,
    displayExcerpt: attributes.displayExcerpt ?? false,
    excerptLength: Math.min(Math.max(attributes.excerptLength || 18, 5), 80),
    className: attributes.className,
    anchor: attributes.anchor,
  }
  const posts = getVisiblePosts(settings)

  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        padding: 12,
        backgroundColor: '#fff',
      }}
    >
      {isSelected && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 8,
            marginBottom: 10,
            fontFamily: 'var(--wp-font-family)',
            fontSize: 12,
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Number of posts
            <input
              type="number"
              min={1}
              max={20}
              value={settings.postsToShow}
              onChange={(e) =>
                setAttributes({ postsToShow: Math.min(Math.max(Number(e.target.value) || 1, 1), 20) })
              }
              style={controlInputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Order
            <select
              value={settings.order}
              onChange={(e) => setAttributes({ order: e.target.value as LatestPostsAttributes['order'] })}
              style={controlInputStyle}
            >
              <option value="desc">Newest to oldest</option>
              <option value="asc">Oldest to newest</option>
            </select>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={settings.displayPostDate}
              onChange={(e) => setAttributes({ displayPostDate: e.target.checked })}
            />
            Show date
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={settings.displayExcerpt}
              onChange={(e) => setAttributes({ displayExcerpt: e.target.checked })}
            />
            Show excerpt
          </label>
          {settings.displayExcerpt && (
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              Excerpt length (words)
              <input
                type="number"
                min={5}
                max={80}
                value={settings.excerptLength}
                onChange={(e) =>
                  setAttributes({ excerptLength: Math.min(Math.max(Number(e.target.value) || 5, 5), 80) })
                }
                style={controlInputStyle}
              />
            </label>
          )}
        </div>
      )}

      <ul
        style={{
          margin: 0,
          paddingLeft: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          fontFamily: 'var(--wp-font-family)',
        }}
      >
        {posts.map((post) => (
          <li key={post.url} style={{ color: '#1e1e1e' }}>
            <a href={post.url} style={{ color: 'var(--wp-components-color-accent)', textDecoration: 'none' }}>
              {post.title}
            </a>
            {settings.displayPostDate && (
              <div style={{ marginTop: 2, color: '#757575', fontSize: 12 }}>
                {formatDate(post.date)}
              </div>
            )}
            {settings.displayExcerpt && (
              <div style={{ marginTop: 3, color: '#50575e', fontSize: 13 }}>
                {trimWords(post.excerpt, settings.excerptLength)}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

const controlInputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #dcdcde',
  borderRadius: 2,
  padding: '6px 8px',
  fontSize: 13,
  fontFamily: 'var(--wp-font-family)',
  backgroundColor: '#fff',
}

export const latestPostsBlock: BlockDefinition = {
  name: 'core/latest-posts',
  title: 'Latest Posts',
  description: 'Display a list of your recent posts.',
  category: 'widgets',
  icon: <Newspaper size={20} />,
  keywords: ['recent', 'posts', 'loop', 'query'],
  supports: {
    align: ['left', 'center', 'right', 'wide', 'full'],
    anchor: true,
    className: true,
  },
  attributes: {
    postsToShow: { type: 'number', default: 5 },
    order: { type: 'string', default: 'desc' },
    displayPostDate: { type: 'boolean', default: false },
    displayExcerpt: { type: 'boolean', default: false },
    excerptLength: { type: 'number', default: 18 },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: LatestPostsEdit,
  save: ({ attributes }) => {
    const normalized: LatestPostsAttributes = {
      postsToShow: Math.min(Math.max((attributes as LatestPostsAttributes).postsToShow || 5, 1), 20),
      order: (attributes as LatestPostsAttributes).order || 'desc',
      displayPostDate: (attributes as LatestPostsAttributes).displayPostDate ?? false,
      displayExcerpt: (attributes as LatestPostsAttributes).displayExcerpt ?? false,
      excerptLength: Math.min(Math.max((attributes as LatestPostsAttributes).excerptLength || 18, 5), 80),
      className: (attributes as LatestPostsAttributes).className,
      anchor: (attributes as LatestPostsAttributes).anchor,
    }
    const posts = getVisiblePosts(normalized)
    const classes = ['wp-block-latest-posts']
    if (normalized.className) classes.push(normalized.className)
    const anchorAttr = normalized.anchor ? ` id="${normalized.anchor}"` : ''
    const items = posts
      .map((post) => {
        const dateHtml = normalized.displayPostDate
          ? `<time class="wp-block-latest-posts__post-date" datetime="${post.date}">${formatDate(post.date)}</time>`
          : ''
        const excerptHtml = normalized.displayExcerpt
          ? `<div class="wp-block-latest-posts__post-excerpt">${trimWords(post.excerpt, normalized.excerptLength)}</div>`
          : ''
        return `<li><a href="${post.url}">${post.title}</a>${dateHtml}${excerptHtml}</li>`
      })
      .join('')
    return `<ul class="${classes.join(' ')}"${anchorAttr}>${items}</ul>`
  },
}
