import { MessageSquareText } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import type { LatestCommentItem } from '../../../types'
import { useEditorRuntime } from '../../../context'

interface LatestCommentsAttributes {
  commentsToShow: number
  displayAvatar: boolean
  displayDate: boolean
  displayExcerpt: boolean
  className?: string
  anchor?: string
}

interface DemoComment {
  author: string
  avatarUrl: string
  date: string
  excerpt: string
  postTitle: string
  postUrl: string
}

const DEMO_COMMENTS: DemoComment[] = [
  {
    author: 'Alex Rivera',
    avatarUrl: 'https://www.gravatar.com/avatar/?d=mp',
    date: '2026-02-15',
    excerpt: 'This approach to reusable block templates made our editorial process much faster.',
    postTitle: 'Building a Block-Based Editorial Workflow',
    postUrl: '#block-workflow',
  },
  {
    author: 'Priya Shah',
    avatarUrl: 'https://www.gravatar.com/avatar/?d=identicon',
    date: '2026-02-12',
    excerpt: 'The spacing controls are finally predictable across nested groups.',
    postTitle: 'Design Tokens for Gutenberg-Compatible UI',
    postUrl: '#design-tokens',
  },
  {
    author: 'Morgan Lee',
    avatarUrl: 'https://www.gravatar.com/avatar/?d=monsterid',
    date: '2026-02-08',
    excerpt: 'Would love to see this tied into synced patterns next.',
    postTitle: 'Shipping Faster With Pattern-First Content',
    postUrl: '#patterns',
  },
  {
    author: 'Jordan Smith',
    avatarUrl: 'https://www.gravatar.com/avatar/?d=retro',
    date: '2026-02-05',
    excerpt: 'Keyboard navigation behavior now feels much closer to core Gutenberg.',
    postTitle: 'Improving Accessibility in Rich Text Editors',
    postUrl: '#accessibility',
  },
  {
    author: 'Taylor Kim',
    avatarUrl: 'https://www.gravatar.com/avatar/?d=robohash',
    date: '2026-01-30',
    excerpt: 'Validation cards are clear and actually actionable.',
    postTitle: 'How We Structured Block Validation',
    postUrl: '#validation',
  },
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getVisibleComments(attributes: LatestCommentsAttributes): DemoComment[] {
  const limit = Math.min(Math.max(attributes.commentsToShow || 5, 1), 20)
  return DEMO_COMMENTS.slice(0, limit)
}

function toDemoComment(comment: LatestCommentItem): DemoComment {
  return {
    author: comment.author || 'Anonymous',
    avatarUrl: comment.avatarUrl || 'https://www.gravatar.com/avatar/?d=mp',
    date: comment.date || '1970-01-01',
    excerpt: comment.excerpt || '',
    postTitle: comment.postTitle || 'Untitled post',
    postUrl: comment.postUrl || '#',
  }
}

function LatestCommentsEdit({
  attributes,
  setAttributes,
  isSelected,
}: BlockEditProps<LatestCommentsAttributes>) {
  const { onFetchLatestComments } = useEditorRuntime()
  const settings: LatestCommentsAttributes = {
    commentsToShow: Math.min(Math.max(attributes.commentsToShow || 5, 1), 20),
    displayAvatar: attributes.displayAvatar ?? true,
    displayDate: attributes.displayDate ?? true,
    displayExcerpt: attributes.displayExcerpt ?? true,
    className: attributes.className,
    anchor: attributes.anchor,
  }
  const [runtimeComments, setRuntimeComments] = useState<DemoComment[] | null>(null)
  const [isRuntimeLoading, setIsRuntimeLoading] = useState(false)
  const [hasRuntimeError, setHasRuntimeError] = useState(false)

  useEffect(() => {
    if (!onFetchLatestComments) {
      setRuntimeComments(null)
      setHasRuntimeError(false)
      setIsRuntimeLoading(false)
      return
    }

    let cancelled = false
    setIsRuntimeLoading(true)
    setHasRuntimeError(false)

    void onFetchLatestComments({
      commentsToShow: settings.commentsToShow,
      displayAvatar: settings.displayAvatar,
      displayDate: settings.displayDate,
      displayExcerpt: settings.displayExcerpt,
    }).then((items) => {
      if (cancelled) return
      setRuntimeComments((items ?? []).map(toDemoComment))
    }).catch(() => {
      if (cancelled) return
      setRuntimeComments(null)
      setHasRuntimeError(true)
    }).finally(() => {
      if (cancelled) return
      setIsRuntimeLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [
    onFetchLatestComments,
    settings.commentsToShow,
    settings.displayAvatar,
    settings.displayDate,
    settings.displayExcerpt,
  ])

  const comments = runtimeComments && runtimeComments.length > 0
    ? runtimeComments.slice(0, settings.commentsToShow)
    : getVisibleComments(settings)

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
            fontFamily: 'var(--editor-font-family)',
            fontSize: 12,
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Number of comments
            <input
              type="number"
              min={1}
              max={20}
              value={settings.commentsToShow}
              onChange={(e) =>
                setAttributes({ commentsToShow: Math.min(Math.max(Number(e.target.value) || 1, 1), 20) })
              }
              style={controlInputStyle}
            />
          </label>
          <div />
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={settings.displayAvatar}
              onChange={(e) => setAttributes({ displayAvatar: e.target.checked })}
            />
            Show avatar
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

      <ol
        style={{
          margin: 0,
          paddingLeft: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          fontFamily: 'var(--editor-font-family)',
        }}
      >
        {comments.map((comment, index) => (
          <li
            key={`${comment.author}-${index}`}
            style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: '#1e1e1e' }}
          >
            {settings.displayAvatar && (
              <img
                src={comment.avatarUrl}
                alt=""
                width={40}
                height={40}
                style={{ borderRadius: '50%', border: '1px solid #dcdcde', flexShrink: 0 }}
              />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13 }}>
                <strong>{comment.author}</strong> on{' '}
                <a href={comment.postUrl} style={{ color: 'var(--editor-components-color-accent)', textDecoration: 'none' }}>
                  {comment.postTitle}
                </a>
              </div>
              {settings.displayDate && (
                <div style={{ fontSize: 12, color: '#757575', marginTop: 2 }}>{formatDate(comment.date)}</div>
              )}
              {settings.displayExcerpt && (
                <div style={{ fontSize: 13, color: '#50575e', marginTop: 4 }}>{comment.excerpt}</div>
              )}
            </div>
          </li>
        ))}
      </ol>
      {(isRuntimeLoading || hasRuntimeError) && (
        <div style={{ marginTop: 10, fontSize: 11, color: '#757575' }}>
          {isRuntimeLoading
            ? 'Loading latest comments...'
            : 'Using fallback comments because live data could not be loaded.'}
        </div>
      )}
    </div>
  )
}

const controlInputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #dcdcde',
  borderRadius: 2,
  padding: '6px 8px',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
  backgroundColor: '#fff',
}

export const latestCommentsBlock: BlockDefinition = {
  name: 'core/latest-comments',
  title: 'Latest Comments',
  description: 'Display your most recent comments.',
  category: 'widgets',
  icon: <MessageSquareText size={20} />,
  keywords: ['comments', 'recent', 'discussion'],
  supports: {
    align: ['left', 'center', 'right', 'wide', 'full'],
    anchor: true,
    className: true,
  },
  attributes: {
    commentsToShow: { type: 'number', default: 5 },
    displayAvatar: { type: 'boolean', default: true },
    displayDate: { type: 'boolean', default: true },
    displayExcerpt: { type: 'boolean', default: true },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: LatestCommentsEdit,
  save: ({ attributes }) => {
    const settings: LatestCommentsAttributes = {
      commentsToShow: Math.min(Math.max((attributes as LatestCommentsAttributes).commentsToShow || 5, 1), 20),
      displayAvatar: (attributes as LatestCommentsAttributes).displayAvatar ?? true,
      displayDate: (attributes as LatestCommentsAttributes).displayDate ?? true,
      displayExcerpt: (attributes as LatestCommentsAttributes).displayExcerpt ?? true,
      className: (attributes as LatestCommentsAttributes).className,
      anchor: (attributes as LatestCommentsAttributes).anchor,
    }
    const comments = getVisibleComments(settings)
    const classes = ['editor-block-latest-comments']
    if (settings.className) classes.push(settings.className)
    const anchorAttr = settings.anchor ? ` id="${settings.anchor}"` : ''
    const items = comments
      .map((comment) => {
        const avatarHtml = settings.displayAvatar
          ? `<img class="avatar" src="${comment.avatarUrl}" alt="" width="40" height="40" />`
          : ''
        const dateHtml = settings.displayDate
          ? `<time class="editor-block-latest-comments__comment-date" datetime="${comment.date}">${formatDate(comment.date)}</time>`
          : ''
        const excerptHtml = settings.displayExcerpt
          ? `<p class="editor-block-latest-comments__comment-excerpt">${comment.excerpt}</p>`
          : ''
        return `<li class="editor-block-latest-comments__comment">${avatarHtml}<article><footer><strong>${comment.author}</strong> on <a href="${comment.postUrl}">${comment.postTitle}</a>${dateHtml}</footer>${excerptHtml}</article></li>`
      })
      .join('')
    return `<ol class="${classes.join(' ')}"${anchorAttr}>${items}</ol>`
  },
}
