# Save Payload Contract

`BlockEditor` returns this object to `onSave` and `onAutoSave`.

## Type

```ts
interface SavePayload {
  blocks: Block[];
  blocksJson: string;
  title: string;
  rawHtml: string;
  postSettings: PostSettings;
  metadata: Record<string, unknown>;
  images: ImageAsset[];
  tailwindSafelist: string[];
  titleIncludedInContent: boolean;
}
```

## Full Example

```json
{
  "blocks": [
    {
      "clientId": "f3c8a5b4-4b70-41ac-a8c5-5f9a2192f3f1",
      "name": "core/paragraph",
      "attributes": {
        "content": "Hello world",
        "className": "lead"
      },
      "innerBlocks": []
    },
    {
      "clientId": "793d90d4-3d0a-4f83-93e2-6a89d6f0f5d4",
      "name": "core/image",
      "attributes": {
        "url": "https://cdn.example.com/hero.jpg",
        "alt": "Hero",
        "id": 112
      },
      "innerBlocks": []
    }
  ],
  "blocksJson": "[{\"clientId\":\"f3c8a5b4-4b70-41ac-a8c5-5f9a2192f3f1\",\"name\":\"core/paragraph\",\"attributes\":{\"content\":\"Hello world\",\"className\":\"lead\"},\"innerBlocks\":[]},{\"clientId\":\"793d90d4-3d0a-4f83-93e2-6a89d6f0f5d4\",\"name\":\"core/image\",\"attributes\":{\"url\":\"https://cdn.example.com/hero.jpg\",\"alt\":\"Hero\",\"id\":112},\"innerBlocks\":[]}]",
  "title": "Landing Page",
  "rawHtml": "<h1>Landing Page</h1>\n<p class=\"lead\">Hello world</p>\n<figure><img src=\"https://cdn.example.com/hero.jpg\" alt=\"Hero\" /></figure>",
  "postSettings": {
    "status": "draft",
    "visibility": "public",
    "slug": "landing-page",
    "permalink": "https://example.com/landing-page",
    "categories": [
      { "id": 2, "name": "Marketing", "slug": "marketing" }
    ],
    "tags": [
      { "id": 7, "name": "homepage", "slug": "homepage" }
    ],
    "featuredImageId": 112,
    "featuredImageUrl": "https://cdn.example.com/hero.jpg",
    "excerpt": "Landing page summary",
    "allowComments": false,
    "allowPingbacks": false,
    "includeTitleInContent": true,
    "meta": {
      "seo_title": "Landing Page | Example",
      "seo_description": "Custom SEO description"
    }
  },
  "metadata": {
    "seo_title": "Landing Page | Example",
    "seo_description": "Custom SEO description"
  },
  "images": [
    {
      "url": "https://cdn.example.com/hero.jpg",
      "alt": "Hero",
      "id": 112,
      "blockClientId": "793d90d4-3d0a-4f83-93e2-6a89d6f0f5d4",
      "blockName": "core/image"
    }
  ],
  "tailwindSafelist": [
    "lead"
  ],
  "titleIncludedInContent": true
}
```

## Body Editor Mode

Set `settings.contentMode` to `'body'` to force body-only output.

```tsx
<BlockEditor
  settings={{
    contentMode: 'body',
    showDocumentMetadata: true
  }}
/>
```

Behavior in body mode:

- `rawHtml` never includes `<h1>` from editor title.
- `titleIncludedInContent` is always `false`.
- `postSettings.includeTitleInContent` is forced to `false`.
- Metadata (`postSettings`, `metadata`) remains in the payload.

## Recommended Persistence Wiring

Store all three values on save:

- `blocksJson` (primary restore source)
- `rawHtml` (fallback / drop-in rendering)
- `metadata` (mirrors `postSettings.meta`)
- `tailwindSafelist` (optional: pass to your Tailwind build safelist pipeline)

```tsx
const saved = JSON.parse(localStorage.getItem('doc:v1') ?? 'null')

<BlockEditor
  initialBlocksJson={saved?.blocksJson}
  initialRawHtml={saved?.rawHtml}
  initialPostSettings={saved?.postSettings}
  onSave={(payload) => {
    localStorage.setItem(
      'doc:v1',
      JSON.stringify({
        title: payload.title,
        blocksJson: payload.blocksJson,
        rawHtml: payload.rawHtml,
        metadata: payload.metadata,
        postSettings: payload.postSettings,
        tailwindSafelist: payload.tailwindSafelist,
      })
    )
  }}
/>
```

Load order in the editor:

1. `initialBlocksJson`
2. `initialBlocks`
3. `initialRawHtml`

## PHP Integration

For a full backend wiring example (save/load routes, DB schema, preview settings, and Tailwind safelist usage in PHP), see `docs/php-integration.md`.
