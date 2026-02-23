import { useMemo, useState } from 'react'
import { BlockEditor } from './BlockEditor'
import type { SavePayload } from './BlockEditor'

const STORAGE_KEY = 'blocura:document:v1'

interface StoredDocument {
  title: string
  blocksJson: string
  rawHtml: string
  metadata: Record<string, unknown>
  postSettings: SavePayload['postSettings']
  savedAt: string
}

function loadStoredDocument(): StoredDocument | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredDocument>
    if (typeof parsed.blocksJson !== 'string' || typeof parsed.rawHtml !== 'string') {
      return null
    }
    return {
      title: typeof parsed.title === 'string' ? parsed.title : '',
      blocksJson: parsed.blocksJson,
      rawHtml: parsed.rawHtml,
      metadata: parsed.metadata && typeof parsed.metadata === 'object'
        ? parsed.metadata as Record<string, unknown>
        : {},
      postSettings: parsed.postSettings && typeof parsed.postSettings === 'object'
        ? parsed.postSettings as SavePayload['postSettings']
        : {
          status: 'draft',
          visibility: 'public',
          slug: '',
          categories: [],
          tags: [],
          excerpt: '',
          allowComments: true,
          allowPingbacks: true,
          includeTitleInContent: true,
          meta: {},
        },
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : '',
    }
  } catch {
    return null
  }
}

export default function App() {
  const initialDocument = useMemo(loadStoredDocument, [])
  const [lastSavedAt, setLastSavedAt] = useState(initialDocument?.savedAt ?? '')

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <BlockEditor
        initialTitle={initialDocument?.title || 'Hello World'}
        initialBlocksJson={initialDocument?.blocksJson}
        initialRawHtml={initialDocument?.rawHtml}
        initialPostSettings={initialDocument?.postSettings}
        onSave={(payload) => {
          const stored: StoredDocument = {
            title: payload.title,
            blocksJson: payload.blocksJson,
            rawHtml: payload.rawHtml,
            metadata: payload.metadata,
            postSettings: payload.postSettings,
            savedAt: new Date().toISOString(),
          }
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
          setLastSavedAt(stored.savedAt)
          console.log('Saved:', payload)
        }}
      />
      {lastSavedAt && (
        <div
          style={{
            position: 'fixed',
            right: 12,
            bottom: 12,
            background: 'rgba(30,30,30,0.82)',
            color: '#fff',
            borderRadius: 2,
            padding: '6px 8px',
            fontSize: 11,
            fontFamily: 'var(--editor-font-family)',
            zIndex: 20,
          }}
        >
          Saved {new Date(lastSavedAt).toLocaleString()}
        </div>
      )}
    </div>
  )
}
