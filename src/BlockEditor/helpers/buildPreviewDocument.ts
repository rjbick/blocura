import type { PreviewSettings } from '../types'

type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

interface BuildPreviewDocumentOptions {
  rawHtml: string
  title: string
  device?: PreviewDevice
  preview?: PreviewSettings
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getBodyWidth(device?: PreviewDevice): string {
  if (device === 'tablet') return '768px'
  if (device === 'mobile') return '390px'
  return '100%'
}

function buildDefaultStyles(bodyWidth: string): string {
  return `  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0 auto;
      width: ${bodyWidth};
      max-width: 100%;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                   Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
      font-size: 13px;
      line-height: 1.6;
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
    .editor-block-separator { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
    .editor-block-spacer { display: block; }
    .editor-block-buttons { display: flex; flex-wrap: wrap; gap: 8px; }
    .editor-block-button { display: inline-flex; }
    .editor-block-button__link {
      display: inline-block;
      padding: 10px 20px;
      background: #2271b1;
      color: #fff;
      text-decoration: none;
      border-radius: 2px;
      font-weight: 500;
    }
    .editor-block-columns { display: flex; gap: 0; margin-left: -8px; margin-right: -8px; align-items: stretch; }
    .editor-block-columns.is-layout-flex { flex-wrap: wrap; }
    .is-layout-flex { display: flex; }
    .editor-block-column { flex: 1 1 0; min-width: 0; padding: 0 8px; }
    .editor-block-group { padding: 16px; }
    .editor-block-cover {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 2px;
      width: 100%;
      color: #fff;
    }
    .editor-block-cover__background {
      position: absolute;
      inset: 0;
      z-index: 1;
    }
    .editor-block-cover__image-background {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
      max-width: none;
    }
    .editor-block-cover__inner-container {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 960px;
      padding: 24px;
    }
    .editor-block-embed iframe { display: block; width: 100%; max-width: 100%; border: 0; }
    .editor-block-pullquote { text-align: center; padding: 28px 0;
      border-top: 4px solid #1e1e1e; border-bottom: 4px solid #1e1e1e; }
    .editor-block-pullquote p { font-size: 1.75em; font-style: italic; font-weight: 300; }
    .editor-block-verse { font-family: inherit; white-space: pre-wrap; }
    .editor-block-post-title { margin: 0 0 32px; font-size: 2.5em; line-height: 1.3; }
  </style>`
}

function renderStylesheetLinks(stylesheets?: string[]): string {
  if (!stylesheets || stylesheets.length === 0) return ''
  return stylesheets
    .map((href) => href.trim())
    .filter(Boolean)
    .map((href) => `  <link rel="stylesheet" href="${escapeHtml(href)}" />`)
    .join('\n')
}

function renderScriptTags(scripts?: string[]): string {
  if (!scripts || scripts.length === 0) return ''
  return scripts
    .map((src) => src.trim())
    .filter(Boolean)
    .map((src) => `  <script src="${escapeHtml(src)}" defer></script>`)
    .join('\n')
}

function applyBodyTemplate(rawHtml: string, templateHtml?: string): string {
  if (!templateHtml || !templateHtml.trim()) return rawHtml
  if (templateHtml.includes('{{content}}')) {
    return templateHtml.split('{{content}}').join(rawHtml)
  }
  return `${templateHtml}\n${rawHtml}`
}

export function buildPreviewDocument({
  rawHtml,
  title,
  device,
  preview,
}: BuildPreviewDocumentOptions): string {
  const bodyWidth = getBodyWidth(device)
  const previewSettings = preview ?? {}
  const stylesheetLinks = renderStylesheetLinks(previewSettings.stylesheets)
  const scriptTags = renderScriptTags(previewSettings.scripts)
  const headHtml = previewSettings.headHtml ? `${previewSettings.headHtml}\n` : ''
  const defaultStyles =
    previewSettings.includeDefaultStyles === false ? '' : `${buildDefaultStyles(bodyWidth)}\n`
  const htmlClass = previewSettings.htmlClassName?.trim()
  const htmlClassAttr = htmlClass ? ` class="${escapeHtml(htmlClass)}"` : ''
  const bodyClass = previewSettings.bodyClassName?.trim()
  const bodyClassAttr = bodyClass ? ` class="${escapeHtml(bodyClass)}"` : ''
  const baseUrl = previewSettings.baseUrl?.trim()
  const baseTag = baseUrl ? `  <base href="${escapeHtml(baseUrl)}" />\n` : ''
  const bodyHtml = applyBodyTemplate(rawHtml, previewSettings.templateHtml)

  return `<!DOCTYPE html>
<html lang="en"${htmlClassAttr}>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
${baseTag}${stylesheetLinks ? `${stylesheetLinks}\n` : ''}${headHtml}${defaultStyles}</head>
<body${bodyClassAttr}>${bodyHtml}${scriptTags ? `\n${scriptTags}` : ''}</body>
</html>`
}
