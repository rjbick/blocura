# blocura

Standalone React block editor with Gutenberg-like UX, built without `@wordpress/*` dependencies.

## Install

```bash
npm install blocura
```

`react` and `react-dom` are peer dependencies.

For local cross-project testing before publish, use the tarball workflow in `docs/local-package.md`.

## Usage

```tsx
import { BlockEditor } from 'blocura'

export function EditorPage() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <BlockEditor
        onSave={async (payload) => {
          await fetch('/api/editor/document/1', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        }}
      />
    </div>
  )
}
```

## Style Isolation

`blocura` (default entry) auto-imports editor CSS.

- Use this when you want zero setup:

```tsx
import { BlockEditor } from 'blocura'
```

- Use this when you want explicit style control in host apps (for example Tailwind-heavy apps):

```tsx
import { BlockEditor } from 'blocura/unstyled'
import 'blocura/styles.css'
```

All shipped editor selectors are scoped to `.editor-shell`.

## Save Payload

`onSave` and `onAutoSave` receive:

- `blocks` / `blocksJson`
- `rawHtml`
- `postSettings` / `metadata`
- `images`
- `tailwindSafelist`
- `titleIncludedInContent`

See `docs/save-payload.md` for full contract and examples.

`rawHtml` is markup only (no linked stylesheets/scripts). It can still contain:

- inline `style=""` attributes emitted by block serializers
- scoped `<style>` tags only when block attribute `__customCSS` is present

## Preview Parity Settings

Use `settings.preview` to render preview with your site shell/assets:

```tsx
<BlockEditor
  settings={{
    preview: {
      stylesheets: ['/assets/app.css'],
      scripts: ['/assets/app.js'],
      htmlClassName: 'site-html',
      bodyClassName: 'page page-preview',
      baseUrl: 'https://example.com/',
      templateHtml: '<div id="app"><main>{{content}}</main></div>',
      includeDefaultStyles: false,
    },
  }}
  onResolvePreviewAssetUrl={(url, context) => {
    if (context.tagName === 'img' && context.attribute === 'src' && url.startsWith('blob:')) {
      return '/media/preview-image.jpg'
    }
    return url
  }}
/>
```

## PHP Integration

See `docs/php-integration.md` for:

- Save/load endpoints
- Suggested DB schema
- Rendering strategy (`rawHtml` + `blocksJson`)
- Tailwind safelist aggregation

## Publish Readiness

Run:

```bash
npm run release:check
```

Then follow `docs/publish-checklist.md` before publishing.

## CSS

The package entry imports editor CSS automatically. If you need explicit control, import:

```ts
import 'blocura/styles.css'
```

## License

MIT
