type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

interface BuildPreviewDocumentOptions {
  rawHtml: string
  title: string
  device?: PreviewDevice
}

function escapeTitle(input: string): string {
  return input.replace(/</g, '&lt;')
}

function getBodyWidth(device?: PreviewDevice): string {
  if (device === 'tablet') return '768px'
  if (device === 'mobile') return '390px'
  return '100%'
}

export function buildPreviewDocument({
  rawHtml,
  title,
  device,
}: BuildPreviewDocumentOptions): string {
  const bodyWidth = getBodyWidth(device)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeTitle(title)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0 auto;
      width: ${bodyWidth};
      max-width: 100%;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                   Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
      font-size: 16px;
      line-height: 1.7;
      color: #1e1e1e;
    }
    h1,h2,h3,h4,h5,h6 { margin: 0.5em 0 0.25em; line-height: 1.3; }
    p { margin: 0 0 1em; }
    img { max-width: 100%; height: auto; }
    pre { background: #f6f7f7; padding: 16px; border-radius: 2px; overflow-x: auto; }
    code { font-family: "Courier New", monospace; font-size: 0.9em; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding: 8px 16px; color: #555; }
    figure { margin: 0; }
    figcaption { font-size: 13px; color: #757575; text-align: center; margin-top: 8px; }
    .wp-block-separator { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
    .wp-block-spacer { display: block; }
    .wp-block-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
    .wp-block-button__link {
      display: inline-block;
      padding: 10px 20px;
      background: #2271b1;
      color: #fff;
      text-decoration: none;
      border-radius: 2px;
      font-weight: 500;
    }
    .wp-block-columns { display: flex; gap: 24px; }
    .wp-block-column { flex: 1 1 0; min-width: 0; }
    .wp-block-group { padding: 16px; }
    .wp-block-pullquote { text-align: center; padding: 28px 0;
      border-top: 4px solid #1e1e1e; border-bottom: 4px solid #1e1e1e; }
    .wp-block-pullquote p { font-size: 1.75em; font-style: italic; font-weight: 300; }
    .wp-block-verse { font-family: inherit; white-space: pre-wrap; }
    .wp-block-post-title { margin: 0 0 32px; font-size: 2.5em; line-height: 1.3; }
  </style>
</head>
<body>${rawHtml}</body>
</html>`
}
