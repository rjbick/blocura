import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, X } from 'lucide-react'
import { useEditorStore, useEditorActions } from '../../store'
import { useEditorRuntime } from '../../context'
import type { Term } from '../../types'

interface PanelProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function Panel({ title, children, defaultOpen = false }: PanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div style={{ borderBottom: '1px solid var(--wp-sidebar-border)' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          fontFamily: 'var(--wp-font-family)',
          fontSize: 13,
          fontWeight: 600,
          color: '#1e1e1e',
          textAlign: 'left',
        }}
      >
        <span>{title}</span>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {isOpen && (
        <div style={{ padding: '0 16px 16px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 13, color: '#1e1e1e' }}>{label}</span>
      {children}
    </div>
  )
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function termMatches(a: Term, b: Term): boolean {
  if (a.id === b.id) return true
  const aSlug = a.slug || slugify(a.name)
  const bSlug = b.slug || slugify(b.name)
  return aSlug === bSlug
}

function termExists(terms: Term[], candidate: Term): boolean {
  return terms.some((term) => termMatches(term, candidate))
}

function removeTerm(terms: Term[], target: Term): Term[] {
  return terms.filter((term) => !termMatches(term, target))
}

function nextTermId(...lists: Term[][]): number {
  const maxId = lists
    .flat()
    .reduce((max, term) => (term.id > max ? term.id : max), 0)
  return maxId + 1
}

function createLocalTerm(name: string, existing: Term[]): Term {
  return {
    id: nextTermId(existing),
    name: name.trim(),
    slug: slugify(name),
  }
}

function useTermSuggestions(
  query: string,
  searchFn?: (query: string) => Promise<Term[]>
) {
  const [results, setResults] = useState<Term[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed || !searchFn) {
      setResults([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    const timer = window.setTimeout(async () => {
      try {
        const found = await searchFn(trimmed)
        if (!cancelled) {
          setResults(found ?? [])
        }
      } catch {
        if (!cancelled) {
          setResults([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, searchFn])

  return { results, isLoading }
}

export function DocumentSidebar() {
  const postSettings = useEditorStore(s => s.postSettings)
  const { updatePostSettings, createSuccessNotice, createErrorNotice } = useEditorActions()
  const { onImageUpload, onSearchCategories, onSearchTerms } = useEditorRuntime()

  const featuredInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingFeatured, setIsUploadingFeatured] = useState(false)

  const [categoryQuery, setCategoryQuery] = useState('')
  const [tagQuery, setTagQuery] = useState('')
  const { results: categorySuggestions, isLoading: categoryLoading } =
    useTermSuggestions(categoryQuery, onSearchCategories)
  const { results: tagSuggestions, isLoading: tagLoading } =
    useTermSuggestions(tagQuery, onSearchTerms)

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!onImageUpload) {
      const objectUrl = URL.createObjectURL(file)
      updatePostSettings({ featuredImageUrl: objectUrl })
      return
    }
    setIsUploadingFeatured(true)
    try {
      const uploaded = await onImageUpload(file)
      const parsedId = uploaded.id ? Number(uploaded.id) : undefined
      updatePostSettings({
        featuredImageUrl: uploaded.url,
        featuredImageId: Number.isFinite(parsedId) ? parsedId : undefined,
      })
      createSuccessNotice('Featured image updated.')
    } catch {
      createErrorNotice('Featured image upload failed.')
    } finally {
      setIsUploadingFeatured(false)
    }
  }

  const addCategory = (term: Term) => {
    if (termExists(postSettings.categories, term)) return
    updatePostSettings({ categories: [...postSettings.categories, term] })
    setCategoryQuery('')
  }

  const removeCategory = (term: Term) => {
    updatePostSettings({ categories: removeTerm(postSettings.categories, term) })
  }

  const addTag = (term: Term) => {
    if (termExists(postSettings.tags, term)) return
    updatePostSettings({ tags: [...postSettings.tags, term] })
    setTagQuery('')
  }

  const removeTag = (term: Term) => {
    updatePostSettings({ tags: removeTerm(postSettings.tags, term) })
  }

  const addTagFromQuery = () => {
    const value = tagQuery.trim()
    if (!value) return
    addTag(createLocalTerm(value, postSettings.tags))
  }

  const addCategoryFromQuery = () => {
    const value = categoryQuery.trim()
    if (!value) return
    addCategory(createLocalTerm(value, postSettings.categories))
  }

  return (
    <div>
      <Panel title="Status & visibility" defaultOpen={true}>
        <Row label="Visibility">
          <select
            value={postSettings.visibility}
            onChange={(e) => updatePostSettings({ visibility: e.target.value as 'public' | 'private' | 'password' })}
            style={{
              fontSize: 13,
              fontFamily: 'var(--wp-font-family)',
              border: '1px solid #ddd',
              borderRadius: 2,
              padding: '4px 8px',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="password">Password protected</option>
          </select>
        </Row>

        <Row label="Status">
          <select
            value={postSettings.status}
            onChange={(e) =>
              updatePostSettings({ status: e.target.value as 'draft' | 'publish' | 'private' | 'pending' | 'future' })
            }
            style={{
              fontSize: 13,
              fontFamily: 'var(--wp-font-family)',
              border: '1px solid #ddd',
              borderRadius: 2,
              padding: '4px 8px',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            <option value="draft">Draft</option>
            <option value="pending">Pending review</option>
            <option value="publish">Published</option>
          </select>
        </Row>

        <Row label="Publish">
          <span style={{ fontSize: 13, color: '#757575' }}>Immediately</span>
        </Row>

        <Row label="Template">
          <span style={{ fontSize: 13, color: '#757575' }}>Single Post</span>
        </Row>
      </Panel>

      <Panel title="Permalink">
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 11, color: '#757575', marginBottom: 4 }}>
            URL slug
          </label>
          <input
            type="text"
            value={postSettings.slug}
            onChange={(e) => updatePostSettings({ slug: e.target.value })}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #ddd',
              borderRadius: 2,
              fontSize: 13,
              fontFamily: 'var(--wp-font-family)',
            }}
          />
        </div>
        {postSettings.permalink && (
          <p style={{ fontSize: 11, color: '#757575', margin: 0 }}>
            <a href={postSettings.permalink} target="_blank" rel="noreferrer" style={{ color: 'var(--wp-admin-theme-color)' }}>
              {postSettings.permalink}
            </a>
          </p>
        )}
      </Panel>

      <Panel title="Categories">
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            type="text"
            value={categoryQuery}
            onChange={(e) => setCategoryQuery(e.target.value)}
            placeholder="Search categories"
            style={{
              flex: 1,
              padding: '6px 8px',
              border: '1px solid #ddd',
              borderRadius: 2,
              fontSize: 13,
              fontFamily: 'var(--wp-font-family)',
            }}
          />
          <button
            type="button"
            onClick={addCategoryFromQuery}
            disabled={!categoryQuery.trim()}
            style={{
              height: 30,
              padding: '0 10px',
              border: '1px solid #ddd',
              borderRadius: 2,
              backgroundColor: '#fff',
              fontSize: 12,
              cursor: categoryQuery.trim() ? 'pointer' : 'default',
              opacity: categoryQuery.trim() ? 1 : 0.55,
            }}
          >
            Add
          </button>
        </div>

        {categoryLoading && (
          <p style={{ fontSize: 12, color: '#757575', margin: '0 0 8px' }}>Searching…</p>
        )}

        {categorySuggestions.length > 0 && (
          <div style={{ marginBottom: 10, border: '1px solid #e5e5e5', borderRadius: 2 }}>
            {categorySuggestions.map((term) => {
              const selected = termExists(postSettings.categories, term)
              return (
                <button
                  key={`${term.id}-${term.slug}`}
                  type="button"
                  onClick={() => (selected ? removeCategory(term) : addCategory(term))}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 8px',
                    border: 'none',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: selected ? 'rgba(56,88,233,0.08)' : '#fff',
                    color: selected ? 'var(--wp-components-color-accent)' : '#1e1e1e',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {term.name}
                </button>
              )
            })}
          </div>
        )}

        {postSettings.categories.length === 0 ? (
          <p style={{ fontSize: 13, color: '#757575', margin: 0 }}>No categories</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {postSettings.categories.map((cat) => (
              <li
                key={`${cat.id}-${cat.slug}`}
                style={{ fontSize: 13, padding: '4px 0', display: 'flex', justifyContent: 'space-between', gap: 6 }}
              >
                <span>{cat.name}</span>
                <button
                  type="button"
                  onClick={() => removeCategory(cat)}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    color: '#757575',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={`Remove ${cat.name}`}
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Tags">
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            type="text"
            value={tagQuery}
            onChange={(e) => setTagQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addTagFromQuery()
              }
            }}
            placeholder="Add or search tags"
            style={{
              flex: 1,
              padding: '6px 8px',
              border: '1px solid #ddd',
              borderRadius: 2,
              fontSize: 13,
              fontFamily: 'var(--wp-font-family)',
            }}
          />
          <button
            type="button"
            onClick={addTagFromQuery}
            disabled={!tagQuery.trim()}
            style={{
              height: 30,
              padding: '0 10px',
              border: '1px solid #ddd',
              borderRadius: 2,
              backgroundColor: '#fff',
              fontSize: 12,
              cursor: tagQuery.trim() ? 'pointer' : 'default',
              opacity: tagQuery.trim() ? 1 : 0.55,
            }}
          >
            Add
          </button>
        </div>

        {tagLoading && (
          <p style={{ fontSize: 12, color: '#757575', margin: '0 0 8px' }}>Searching…</p>
        )}

        {tagSuggestions.length > 0 && (
          <div style={{ marginBottom: 10, border: '1px solid #e5e5e5', borderRadius: 2 }}>
            {tagSuggestions.map((term) => {
              const selected = termExists(postSettings.tags, term)
              return (
                <button
                  key={`${term.id}-${term.slug}`}
                  type="button"
                  onClick={() => (selected ? removeTag(term) : addTag(term))}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 8px',
                    border: 'none',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: selected ? 'rgba(56,88,233,0.08)' : '#fff',
                    color: selected ? 'var(--wp-components-color-accent)' : '#1e1e1e',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {term.name}
                </button>
              )
            })}
          </div>
        )}

        {postSettings.tags.length === 0 ? (
          <p style={{ fontSize: 13, color: '#757575', margin: 0 }}>No tags</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {postSettings.tags.map((tag) => (
              <span
                key={`${tag.id}-${tag.slug}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: '#f0f0f0',
                  borderRadius: 2,
                  padding: '2px 8px',
                  fontSize: 12,
                }}
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  style={{
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    color: '#757575',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={`Remove ${tag.name}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Featured image">
        {postSettings.featuredImageUrl ? (
          <div>
            <img
              src={postSettings.featuredImageUrl}
              alt="Featured"
              style={{ width: '100%', borderRadius: 2, display: 'block' }}
            />
            <button
              type="button"
              onClick={() => updatePostSettings({ featuredImageUrl: undefined, featuredImageId: undefined })}
              style={{
                marginTop: 8,
                fontSize: 12,
                color: 'var(--wp-admin-theme-color)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Remove image
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => featuredInputRef.current?.click()}
            disabled={isUploadingFeatured}
            style={{
              width: '100%',
              padding: '32px 16px',
              border: '2px dashed #ddd',
              borderRadius: 2,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: 13,
              color: '#757575',
              fontFamily: 'var(--wp-font-family)',
            }}
          >
            {isUploadingFeatured ? 'Uploading…' : 'Set featured image'}
          </button>
        )}
        <input
          ref={featuredInputRef}
          type="file"
          accept="image/*"
          onChange={handleFeaturedImageUpload}
          disabled={isUploadingFeatured}
          style={{ display: 'none' }}
        />
      </Panel>

      <Panel title="Excerpt">
        <textarea
          value={postSettings.excerpt}
          onChange={(e) => updatePostSettings({ excerpt: e.target.value })}
          placeholder="Write an excerpt (optional)"
          rows={4}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: 2,
            fontSize: 13,
            fontFamily: 'var(--wp-font-family)',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </Panel>

      <Panel title="Discussion">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={postSettings.allowComments}
              onChange={(e) => updatePostSettings({ allowComments: e.target.checked })}
              style={{ width: 16, height: 16 }}
            />
            <span style={{ fontSize: 13 }}>Allow comments</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={postSettings.allowPingbacks}
              onChange={(e) => updatePostSettings({ allowPingbacks: e.target.checked })}
              style={{ width: 16, height: 16 }}
            />
            <span style={{ fontSize: 13 }}>Allow pingbacks &amp; trackbacks</span>
          </label>
        </div>
      </Panel>
    </div>
  )
}
