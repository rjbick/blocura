import { X, Monitor, Tablet, Smartphone } from 'lucide-react'
import { useEditorStore, useEditorActions } from '../../store'
import { blocksToRawHtml } from '../../helpers/blocksToRawHtml'

const DEVICE_CONFIG = {
  desktop: {
    label: 'Desktop',
    icon: Monitor,
    width: '100%',
    height: '100%',
    borderRadius: 0,
    border: 'none',
    boxShadow: 'none',
  },
  tablet: {
    label: 'Tablet',
    icon: Tablet,
    width: '768px',
    height: '90vh',
    maxHeight: '1024px',
    borderRadius: 12,
    border: '4px solid #1e1e1e',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  mobile: {
    label: 'Mobile',
    icon: Smartphone,
    width: '390px',
    height: '90vh',
    maxHeight: '844px',
    borderRadius: 40,
    border: '8px solid #1e1e1e',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
}

export function PreviewFrame() {
  const previewDevice = useEditorStore(s => s.previewDevice)
  const blocks = useEditorStore(s => s.blocks)
  const title = useEditorStore(s => s.title)
  const { setPreviewDevice } = useEditorActions()

  if (!previewDevice) return null

  const config = DEVICE_CONFIG[previewDevice]
  const rawHtml = blocksToRawHtml(blocks)
  const Icon = config.icon

  // Build a full HTML document for the iframe srcdoc
  const srcdoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title.replace(/</g, '&lt;')}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
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
    ${title ? `body::before { content: "${title.replace(/"/g, '\\"')}";
      display: block; font-size: 2.5em; font-weight: 700; margin-bottom: 32px; }` : ''}
  </style>
</head>
<body>${rawHtml}</body>
</html>`

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: '#f0f0f0',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 56,
          backgroundColor: '#fff',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0,
        }}
      >
        {/* Device switcher */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(Object.keys(DEVICE_CONFIG) as (keyof typeof DEVICE_CONFIG)[]).map(device => {
            const Ico = DEVICE_CONFIG[device].icon
            const active = previewDevice === device
            return (
              <button
                key={device}
                type="button"
                onClick={() => setPreviewDevice(device)}
                title={DEVICE_CONFIG[device].label}
                style={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  borderRadius: 2,
                  backgroundColor: active ? 'rgba(56,88,233,0.1)' : 'transparent',
                  color: active ? '#3858e9' : '#1e1e1e',
                  cursor: 'pointer',
                }}
              >
                <Ico size={18} />
              </button>
            )
          })}
        </div>

        <div
          style={{
            fontSize: 13,
            fontFamily: 'var(--wp-font-family)',
            color: '#757575',
          }}
        >
          {config.label} Preview
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={() => setPreviewDevice(null)}
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            borderRadius: 2,
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: '#1e1e1e',
          }}
          title="Exit preview"
        >
          <X size={18} />
        </button>
      </div>

      {/* Frame area */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: previewDevice === 'desktop' ? 'stretch' : 'center',
          justifyContent: 'center',
          padding: previewDevice === 'desktop' ? 0 : 32,
        }}
      >
        <iframe
          srcDoc={srcdoc}
          title={`${config.label} preview`}
          sandbox="allow-scripts allow-same-origin"
          style={{
            width: config.width,
            height: config.height,
            maxHeight: 'maxHeight' in config ? config.maxHeight : undefined,
            border: config.border,
            borderRadius: config.borderRadius,
            boxShadow: config.boxShadow,
            backgroundColor: '#fff',
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  )
}
