# PHP Integration Guide

This guide shows how to wire the editor into a PHP backend while preserving:

- `blocksJson` as the canonical editable source
- `rawHtml` as direct render output
- `postSettings` + `metadata`
- `tailwindSafelist` for utility-class builds

## 1. Frontend Wiring (React -> PHP API)

```tsx
import { BlockEditor } from './BlockEditor'

type SavedDoc = {
  title: string
  blocksJson: string
  rawHtml: string
  postSettings: Record<string, unknown>
  metadata: Record<string, unknown>
  tailwindSafelist: string[]
}

async function fetchDocument(id: number): Promise<SavedDoc> {
  const res = await fetch(`/api/editor/documents/${id}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Failed to load document (${res.status})`)
  return res.json()
}

export function PageEditor({ id, initial }: { id: number; initial: SavedDoc | null }) {
  return (
    <BlockEditor
      initialTitle={initial?.title ?? ''}
      initialBlocksJson={initial?.blocksJson}
      initialRawHtml={initial?.rawHtml}
      initialPostSettings={initial?.postSettings as any}
      settings={{
        contentMode: 'body',
        showDocumentMetadata: true,
        preview: {
          stylesheets: ['/assets/app.css'],
          scripts: ['/assets/app.js'],
          htmlClassName: 'site-html',
          bodyClassName: 'page page-editor-preview',
          baseUrl: 'https://example.com/',
          templateHtml: '<div id="app"><main class="content">{{content}}</main></div>',
          includeDefaultStyles: false,
        },
      }}
      onResolvePreviewAssetUrl={(url, context) => {
        if (context.tagName === 'img' && context.attribute === 'src' && url.startsWith('blob:')) {
          // Replace temporary local blob previews with a reachable CDN URL for preview.
          return '/media/preview-placeholder.jpg'
        }
        return url
      }}
      onSave={async (payload) => {
        const res = await fetch(`/api/editor/documents/${id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          throw new Error(`Save failed (${res.status})`)
        }
      }}
    />
  )
}
```

## 2. Suggested DB Schema

```sql
CREATE TABLE editor_documents (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL DEFAULT '',
  blocks_json LONGTEXT NOT NULL,
  raw_html LONGTEXT NOT NULL,
  post_settings_json LONGTEXT NOT NULL,
  metadata_json LONGTEXT NOT NULL,
  tailwind_safelist_json LONGTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 3. Plain PHP Endpoint (Save)

```php
<?php
// PUT /api/editor/documents/{id}
declare(strict_types=1);

header('Content-Type: application/json');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid id']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON body']);
    exit;
}

$required = ['title', 'blocksJson', 'rawHtml', 'postSettings', 'metadata', 'tailwindSafelist'];
foreach ($required as $field) {
    if (!array_key_exists($field, $input)) {
        http_response_code(422);
        echo json_encode(['error' => "Missing field: {$field}"]);
        exit;
    }
}

$title = (string)$input['title'];
$blocksJson = (string)$input['blocksJson'];
$rawHtml = (string)$input['rawHtml'];
$postSettingsJson = json_encode($input['postSettings'], JSON_UNESCAPED_UNICODE);
$metadataJson = json_encode($input['metadata'], JSON_UNESCAPED_UNICODE);
$tailwindSafelistJson = json_encode($input['tailwindSafelist'], JSON_UNESCAPED_UNICODE);

$pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

$stmt = $pdo->prepare('
  UPDATE editor_documents
  SET title = :title,
      blocks_json = :blocks_json,
      raw_html = :raw_html,
      post_settings_json = :post_settings_json,
      metadata_json = :metadata_json,
      tailwind_safelist_json = :tailwind_safelist_json
  WHERE id = :id
');

$stmt->execute([
    ':id' => $id,
    ':title' => $title,
    ':blocks_json' => $blocksJson,
    ':raw_html' => $rawHtml,
    ':post_settings_json' => $postSettingsJson,
    ':metadata_json' => $metadataJson,
    ':tailwind_safelist_json' => $tailwindSafelistJson,
]);

echo json_encode(['ok' => true]);
```

## 4. Plain PHP Endpoint (Load)

```php
<?php
// GET /api/editor/documents/{id}
declare(strict_types=1);

header('Content-Type: application/json');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid id']);
    exit;
}

$pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

$stmt = $pdo->prepare('
  SELECT title, blocks_json, raw_html, post_settings_json, metadata_json, tailwind_safelist_json
  FROM editor_documents
  WHERE id = :id
');
$stmt->execute([':id' => $id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    exit;
}

echo json_encode([
    'title' => (string)$row['title'],
    'blocksJson' => (string)$row['blocks_json'],
    'rawHtml' => (string)$row['raw_html'],
    'postSettings' => json_decode((string)$row['post_settings_json'], true) ?? [],
    'metadata' => json_decode((string)$row['metadata_json'], true) ?? [],
    'tailwindSafelist' => json_decode((string)$row['tailwind_safelist_json'], true) ?? [],
], JSON_UNESCAPED_UNICODE);
```

## 5. Rendering on the Site

For public page rendering:

- Prefer trusted/sanitized `rawHtml` as direct output.
- Keep `blocksJson` for round-trip editing.
- Use `title` + `postSettings` based on your routing/template needs.

Example server-render in PHP template:

```php
<?php
/** @var array $doc */
echo $doc['rawHtml']; // Ensure your sanitization policy fits your trust model.
```

## 6. Tailwind Safelist Workflow

Use `tailwindSafelist` from saved documents to avoid purging editor-entered utility classes.

Typical flow:

1. Aggregate all `tailwind_safelist_json` arrays from documents.
2. Deduplicate class names.
3. Write to a JSON file consumed by your Tailwind config.

Example aggregation script:

```php
<?php
$pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$rows = $pdo->query('SELECT tailwind_safelist_json FROM editor_documents')->fetchAll(PDO::FETCH_ASSOC);

$classes = [];
foreach ($rows as $row) {
    $list = json_decode((string)$row['tailwind_safelist_json'], true);
    if (!is_array($list)) continue;
    foreach ($list as $className) {
        if (is_string($className) && $className !== '') {
            $classes[$className] = true;
        }
    }
}

$safelist = array_keys($classes);
sort($safelist, SORT_STRING);

file_put_contents(__DIR__ . '/tailwind-safelist.json', json_encode($safelist, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
```

Then in Tailwind config (JS side), import that JSON and append to `safelist`.

## 7. Security Notes

- Validate and authorize all save/load requests.
- Treat editor HTML as untrusted unless your author role is trusted.
- If untrusted, sanitize `rawHtml` server-side before rendering.
- Add CSRF protection on write endpoints.
