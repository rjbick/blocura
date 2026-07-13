import { Rss } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import type { RssFeedItem, RssFeedResult } from '../../../types'
import { useEditorRuntime } from '../../../context'

interface RSSAttributes {
  feedURL: string
  itemsToShow: number
  displayAuthor: boolean
  displayDate: boolean
  displayExcerpt: boolean
  className?: string
  anchor?: string
}

interface DemoFeedItem {
  title: string
  url: string
  author: string
  date: string
  excerpt: string
}

const DEMO_FEED_ITEMS: DemoFeedItem[] = [
  {
    title: 'State of the Block Editor in 2026',
    url: '#rss-state-2026',
    author: 'Editor Weekly',
    date: '2026-02-16',
    excerpt: 'A broad look at how block editing workflows changed over the past year.',
  },
  {
    title: 'How to Compose Better Patterns',
    url: '#rss-patterns',
    author: 'Content Ops',
    date: '2026-02-11',
    excerpt: 'Reusable composition patterns reduce layout drift and speed up publishing.',
  },
  {
    title: 'Accessibility Checklist for Rich Text Blocks',
    url: '#rss-a11y',
    author: 'Inclusive Web',
    date: '2026-02-07',
    excerpt: 'A focused checklist for keyboard navigation, semantics, and focus behavior.',
  },
  {
    title: 'Performance Tuning for Large Documents',
    url: '#rss-performance',
    author: 'Render Bench',
    date: '2026-01-30',
    excerpt: 'Practical steps to keep editing responsive as block counts increase.',
  },
  {
    title: 'Design Systems and Gutenberg Tokens',
    url: '#rss-design-system',
    author: 'Design Review',
    date: '2026-01-25',
    excerpt: 'Design token parity is key when replicating the native editor experience.',
  },
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function getFeedLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    return hostname || 'RSS feed'
  } catch {
    return 'RSS feed'
  }
}

function getVisibleItems(itemsToShow: number): DemoFeedItem[] {
  const limit = Math.min(Math.max(itemsToShow || 4, 1), 20)
  return DEMO_FEED_ITEMS.slice(0, limit)
}

function toDemoFeedItem(item: RssFeedItem): DemoFeedItem {
  return {
    title: item.title || 'Untitled item',
    url: item.url || '#',
    author: item.author || 'Unknown author',
    date: item.date || '1970-01-01',
    excerpt: item.excerpt || '',
  }
}

function normalizeFeedResult(result: RssFeedResult | RssFeedItem[]): RssFeedResult {
  if (Array.isArray(result)) {
    return { items: result }
  }
  return result
}

function RSSEdit({ attributes, setAttributes, isSelected }: BlockEditProps<RSSAttributes>) {
  const { onFetchRssFeed } = useEditorRuntime()
  const settings: RSSAttributes = {
    feedURL: attributes.feedURL || '',
    itemsToShow: Math.min(Math.max(attributes.itemsToShow || 4, 1), 20),
    displayAuthor: attributes.displayAuthor ?? false,
    displayDate: attributes.displayDate ?? false,
    displayExcerpt: attributes.displayExcerpt ?? false,
    className: attributes.className,
    anchor: attributes.anchor,
  }
  const [runtimeFeed, setRuntimeFeed] = useState<RssFeedResult | null>(null)
  const [isRuntimeLoading, setIsRuntimeLoading] = useState(false)
  const [hasRuntimeError, setHasRuntimeError] = useState(false)

  useEffect(() => {
    if (!onFetchRssFeed || !settings.feedURL) {
      setRuntimeFeed(null)
      setHasRuntimeError(false)
      setIsRuntimeLoading(false)
      return
    }

    let cancelled = false
    setIsRuntimeLoading(true)
    setHasRuntimeError(false)

    void onFetchRssFeed({
      feedURL: settings.feedURL,
      itemsToShow: settings.itemsToShow,
      displayAuthor: settings.displayAuthor,
      displayDate: settings.displayDate,
      displayExcerpt: settings.displayExcerpt,
    }).then((result) => {
      if (cancelled) return
      setRuntimeFeed(normalizeFeedResult(result))
    }).catch(() => {
      if (cancelled) return
      setRuntimeFeed(null)
      setHasRuntimeError(true)
    }).finally(() => {
      if (cancelled) return
      setIsRuntimeLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [
    onFetchRssFeed,
    settings.displayAuthor,
    settings.displayDate,
    settings.displayExcerpt,
    settings.feedURL,
    settings.itemsToShow,
  ])

  const entries = runtimeFeed && runtimeFeed.items.length > 0
    ? runtimeFeed.items.map(toDemoFeedItem).slice(0, settings.itemsToShow)
    : getVisibleItems(settings.itemsToShow)

  if (!settings.feedURL) {
    return (
      <div
        style={{
          border: '2px dashed #dcdcde',
          borderRadius: 2,
          padding: 18,
          backgroundColor: '#fafafa',
          fontFamily: 'var(--editor-font-family)',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Rss size={18} />
          <strong style={{ fontSize: 14 }}>RSS</strong>
        </div>
        <div style={{ fontSize: 13, color: 'var(--editor-text-muted)', marginBottom: 10 }}>
          Enter a feed URL to display recent entries.
        </div>
        <input
          type="url"
          value={settings.feedURL}
          onChange={(e) => setAttributes({ feedURL: e.target.value })}
          placeholder="https://example.com/feed"
          style={controlInputStyle}
          autoFocus={isSelected}
        />
      </div>
    )
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
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 8,
            marginBottom: 10,
            fontSize: 12,
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
            Feed URL
            <input
              type="url"
              value={settings.feedURL}
              onChange={(e) => setAttributes({ feedURL: e.target.value })}
              style={controlInputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Number of items
            <input
              type="number"
              min={1}
              max={20}
              value={settings.itemsToShow}
              onChange={(e) =>
                setAttributes({ itemsToShow: Math.min(Math.max(Number(e.target.value) || 1, 1), 20) })
              }
              style={controlInputStyle}
            />
          </label>
          <div />
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={settings.displayAuthor}
              onChange={(e) => setAttributes({ displayAuthor: e.target.checked })}
            />
            Show author
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={settings.displayDate}
              onChange={(e) => setAttributes({ displayDate: e.target.checked })}
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
        </div>
      )}

      <div style={{ fontSize: 12, color: 'var(--editor-text-muted)', marginBottom: 8 }}>
        Source: {runtimeFeed?.sourceLabel || getFeedLabel(settings.feedURL)}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((item) => (
          <li key={item.url}>
            <a href={item.url} style={{ color: 'var(--editor-components-color-accent)', textDecoration: 'none' }}>
              {item.title}
            </a>
            {(settings.displayAuthor || settings.displayDate) && (
              <div style={{ marginTop: 2, color: 'var(--editor-text-muted)', fontSize: 12 }}>
                {settings.displayAuthor ? item.author : ''}
                {settings.displayAuthor && settings.displayDate ? ' · ' : ''}
                {settings.displayDate ? formatDate(item.date) : ''}
              </div>
            )}
            {settings.displayExcerpt && (
              <div style={{ marginTop: 3, color: 'var(--editor-text-muted)', fontSize: 13 }}>{item.excerpt}</div>
            )}
          </li>
        ))}
      </ul>
      {(isRuntimeLoading || hasRuntimeError) && (
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--editor-text-muted)' }}>
          {isRuntimeLoading
            ? 'Loading RSS feed...'
            : 'Using fallback feed preview because live data could not be loaded.'}
        </div>
      )}
    </div>
  )
}

const controlInputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--editor-border)',
  borderRadius: 2,
  padding: '6px 8px',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
  backgroundColor: '#fff',
}

export const rssBlock: BlockDefinition = {
  name: 'core/rss',
  title: 'RSS',
  description: 'Display entries from any RSS or Atom feed.',
  category: 'widgets',
  icon: <Rss size={20} />,
  keywords: ['feed', 'rss', 'atom', 'syndication'],
  supports: {
    align: ['left', 'center', 'right', 'wide', 'full'],
    anchor: true,
    className: true,
  },
  attributes: {
    feedURL: { type: 'string', default: '' },
    itemsToShow: { type: 'number', default: 4 },
    displayAuthor: { type: 'boolean', default: false },
    displayDate: { type: 'boolean', default: false },
    displayExcerpt: { type: 'boolean', default: false },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: RSSEdit,
  save: ({ attributes }) => {
    const settings: RSSAttributes = {
      feedURL: (attributes as RSSAttributes).feedURL || '',
      itemsToShow: Math.min(Math.max((attributes as RSSAttributes).itemsToShow || 4, 1), 20),
      displayAuthor: (attributes as RSSAttributes).displayAuthor ?? false,
      displayDate: (attributes as RSSAttributes).displayDate ?? false,
      displayExcerpt: (attributes as RSSAttributes).displayExcerpt ?? false,
      className: (attributes as RSSAttributes).className,
      anchor: (attributes as RSSAttributes).anchor,
    }
    const classes = ['editor-block-rss']
    if (settings.className) classes.push(settings.className)
    const anchorAttr = settings.anchor ? ` id="${settings.anchor}"` : ''
    const sourceLabel = settings.feedURL ? getFeedLabel(settings.feedURL) : 'RSS feed'
    const entries = getVisibleItems(settings.itemsToShow)

    const listHtml = entries
      .map((item) => {
        const meta = [settings.displayAuthor ? item.author : '', settings.displayDate ? formatDate(item.date) : '']
          .filter(Boolean)
          .join(' · ')
        const metaHtml = meta ? `<div class="editor-block-rss__item-meta">${meta}</div>` : ''
        const excerptHtml = settings.displayExcerpt
          ? `<p class="editor-block-rss__item-excerpt">${item.excerpt}</p>`
          : ''
        return `<li><a href="${item.url}">${item.title}</a>${metaHtml}${excerptHtml}</li>`
      })
      .join('')

    return `<div class="${classes.join(' ')}"${anchorAttr}><div class="editor-block-rss__source">${sourceLabel}</div><ul>${listHtml}</ul></div>`
  },
}
