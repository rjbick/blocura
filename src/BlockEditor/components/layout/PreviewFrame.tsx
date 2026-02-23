import { X, Monitor, Tablet, Smartphone } from 'lucide-react'
import { useEditorStore, useEditorActions } from '../../store'
import { blocksToRawHtml } from '../../helpers/blocksToRawHtml'
import { buildPreviewDocument } from '../../helpers/buildPreviewDocument'

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
  const includeTitleInContent = useEditorStore(s => s.postSettings.includeTitleInContent)
  const { setPreviewDevice } = useEditorActions()

  if (!previewDevice) return null

  const config = DEVICE_CONFIG[previewDevice]
  const rawHtml = blocksToRawHtml(blocks, {
    title,
    includeTitle: includeTitleInContent,
  })
  const srcdoc = buildPreviewDocument({ rawHtml, title })

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
