import type { ReactNode } from 'react'
import { Eye, Monitor, Tablet, Smartphone, ChevronDown } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useEditorActions, useEditorStore } from '../../store'
import { blocksToRawHtml } from '../../helpers/blocksToRawHtml'
import { buildPreviewDocument } from '../../helpers/buildPreviewDocument'
import { resolvePreviewAssetUrls } from '../../helpers/resolvePreviewAssetUrls'
import type { EditorSettings, PreviewAssetUrlContext } from '../../types'

type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

interface PreviewDropdownProps {
  previewSettings?: EditorSettings['preview']
  previewAssetUrlResolver?: (
    url: string,
    context: PreviewAssetUrlContext
  ) => string | null | undefined
}

const PREVIEW_OPTIONS: {
  device: PreviewDevice
  label: string
  icon: ReactNode
}[] = [
  { device: 'desktop', label: 'Desktop', icon: <Monitor size={16} /> },
  { device: 'tablet', label: 'Tablet', icon: <Tablet size={16} /> },
  { device: 'mobile', label: 'Mobile', icon: <Smartphone size={16} /> },
]

export function PreviewDropdown({
  previewSettings,
  previewAssetUrlResolver,
}: PreviewDropdownProps) {
  const blocks = useEditorStore((s) => s.blocks)
  const title = useEditorStore((s) => s.title)
  const includeTitleInContent = useEditorStore((s) => s.postSettings.includeTitleInContent)
  const {
    setPreviewDevice,
    createWarningNotice,
  } = useEditorActions()

  const openInNewTab = (device: PreviewDevice) => {
    const rawHtml = blocksToRawHtml(blocks, {
      title,
      includeTitle: includeTitleInContent,
      preserveInternalClasses: true,
    })
    const resolvedRawHtml = resolvePreviewAssetUrls(rawHtml, previewAssetUrlResolver)
    const html = buildPreviewDocument({
      rawHtml: resolvedRawHtml,
      title,
      device,
      preview: previewSettings,
    })
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const opened = window.open(url, '_blank', 'noopener,noreferrer')

    if (!opened) {
      createWarningNotice('Unable to open preview in a new tab.')
    }

    // Release memory after the browser has had time to load the new tab URL.
    window.setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 60_000)
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="preview-trigger-button"
          type="button"
          aria-label="Preview"
          style={{
            height: 36,
            paddingInline: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            border: '1px solid #ddd',
            borderRadius: 2,
            backgroundColor: '#fff',
            fontSize: 13,
            fontFamily: 'var(--editor-font-family)',
            cursor: 'pointer',
            color: '#1e1e1e',
          }}
        >
          <Eye size={16} />
          <span>Preview</span>
          <ChevronDown size={14} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="editor-popover-content"
          align="end"
          sideOffset={4}
          style={{
            minWidth: 200,
            backgroundColor: 'var(--editor-popover-bg)',
            borderRadius: 'var(--editor-popover-border-radius)',
            boxShadow: 'var(--editor-popover-shadow)',
            padding: '4px 0',
            zIndex: 9999,
          }}
        >
          {PREVIEW_OPTIONS.map(({ device, label, icon }) => (
            <DropdownMenu.Item
              key={device}
              onSelect={() => setPreviewDevice(device)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '8px 12px',
                fontSize: 13,
                fontFamily: 'var(--editor-font-family)',
                cursor: 'pointer',
                outline: 'none',
              }}
              className="editor-dropdown-item preview-dropdown-item"
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {icon}
                <span>{label}</span>
              </span>
              <button
                className="preview-open-tab-link"
                type="button"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  openInNewTab(device)
                }}
                style={{
                  fontSize: 11,
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  lineHeight: 1.2,
                }}
              >
                Open in new tab
              </button>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
