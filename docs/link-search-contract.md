# Link Search Contract

Use `onSearchPages` to let the editor fetch link targets from the host website.

## Callback Type

```ts
interface SearchPagesOptions {
  query: string
  page: number
  perPage: number
  signal?: AbortSignal
}

interface LinkablePage {
  id?: string | number
  title: string
  url: string
  type?: string
}

interface SearchPagesResponse {
  pages: LinkablePage[]
  nextPage?: number | null
  total?: number
}

type SearchPagesResult = LinkablePage[] | SearchPagesResponse

onSearchPages?: (options: SearchPagesOptions) => Promise<SearchPagesResult>
```

## Behavior

- The editor debounces `query` updates before calling `onSearchPages`.
- `signal` is aborted whenever a newer request supersedes the current one.
- If you return `SearchPagesResponse.nextPage`, the dialog shows "Load more results".
- If you return a plain `LinkablePage[]`, it still works (legacy/simple mode).
- Invalid pages (missing `title` or `url`) are ignored by the editor.

## Auth + Pagination Example

```tsx
<BlockEditor
  onSearchPages={async ({ query, page, perPage, signal }) => {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      perPage: String(perPage),
    })

    const response = await fetch(`/api/editor/pages?${params.toString()}`, {
      method: 'GET',
      credentials: 'include',
      signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Page search failed (${response.status})`)
    }

    const data = await response.json() as {
      items: Array<{ id: number; title: string; url: string; type?: string }>
      nextPage?: number | null
      total?: number
    }

    return {
      pages: data.items.map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        type: item.type,
      })),
      nextPage: data.nextPage ?? null,
      total: data.total,
    }
  }}
/>
```

