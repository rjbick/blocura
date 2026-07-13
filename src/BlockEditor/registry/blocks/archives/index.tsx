import { Archive } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'

interface ArchivesAttributes {
  displayAsDropdown: boolean
  showPostCounts: boolean
  className?: string
  anchor?: string
}

interface DemoArchive {
  label: string
  url: string
  count: number
}

const DEMO_ARCHIVES: DemoArchive[] = [
  { label: 'February 2026', url: '#2026-02', count: 9 },
  { label: 'January 2026', url: '#2026-01', count: 12 },
  { label: 'December 2025', url: '#2025-12', count: 7 },
  { label: 'November 2025', url: '#2025-11', count: 5 },
  { label: 'October 2025', url: '#2025-10', count: 10 },
]

function ArchivesEdit({ attributes, setAttributes, isSelected }: BlockEditProps<ArchivesAttributes>) {
  const settings: ArchivesAttributes = {
    displayAsDropdown: attributes.displayAsDropdown ?? false,
    showPostCounts: attributes.showPostCounts ?? false,
    className: attributes.className,
    anchor: attributes.anchor,
  }

  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        padding: 12,
        backgroundColor: '#fff',
        fontFamily: 'var(--editor-font-family)',
      }}
    >
      {isSelected && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={settings.displayAsDropdown}
              onChange={(e) => setAttributes({ displayAsDropdown: e.target.checked })}
            />
            Display as dropdown
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={settings.showPostCounts}
              onChange={(e) => setAttributes({ showPostCounts: e.target.checked })}
            />
            Show post counts
          </label>
        </div>
      )}

      {settings.displayAsDropdown ? (
        <select
          value=""
          onChange={() => undefined}
          style={{
            width: '100%',
            border: '1px solid var(--editor-border)',
            borderRadius: 2,
            padding: '6px 8px',
            fontSize: 13,
            backgroundColor: '#fff',
            fontFamily: 'inherit',
          }}
        >
          <option value="">Select Month</option>
          {DEMO_ARCHIVES.map((archive) => (
            <option key={archive.url} value={archive.url}>
              {archive.label}
              {settings.showPostCounts ? ` (${archive.count})` : ''}
            </option>
          ))}
        </select>
      ) : (
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            fontSize: 13,
          }}
        >
          {DEMO_ARCHIVES.map((archive) => (
            <li key={archive.url}>
              <a
                href={archive.url}
                style={{ color: 'var(--editor-components-color-accent)', textDecoration: 'none' }}
              >
                {archive.label}
              </a>
              {settings.showPostCounts ? ` (${archive.count})` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const archivesBlock: BlockDefinition = {
  name: 'core/archives',
  title: 'Archives',
  description: 'Display a monthly archive of posts.',
  category: 'widgets',
  icon: <Archive size={20} />,
  keywords: ['archive', 'months', 'date'],
  supports: {
    align: ['left', 'center', 'right', 'wide', 'full'],
    anchor: true,
    className: true,
  },
  attributes: {
    displayAsDropdown: { type: 'boolean', default: false },
    showPostCounts: { type: 'boolean', default: false },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: ArchivesEdit,
  save: ({ attributes }) => {
    const settings: ArchivesAttributes = {
      displayAsDropdown: (attributes as ArchivesAttributes).displayAsDropdown ?? false,
      showPostCounts: (attributes as ArchivesAttributes).showPostCounts ?? false,
      className: (attributes as ArchivesAttributes).className,
      anchor: (attributes as ArchivesAttributes).anchor,
    }
    const classes = ['editor-block-archives']
    if (settings.className) classes.push(settings.className)
    const anchorAttr = settings.anchor ? ` id="${settings.anchor}"` : ''

    if (settings.displayAsDropdown) {
      const options = DEMO_ARCHIVES
        .map(
          (archive) =>
            `<option value="${archive.url}">${archive.label}${settings.showPostCounts ? ` (${archive.count})` : ''}</option>`
        )
        .join('')
      return `<div class="${classes.join(' ')}"${anchorAttr}><label class="editor-block-archives__label">Archives</label><select name="archive-dropdown"><option value="">Select Month</option>${options}</select></div>`
    }

    const items = DEMO_ARCHIVES
      .map(
        (archive) =>
          `<li><a href="${archive.url}">${archive.label}</a>${settings.showPostCounts ? ` (${archive.count})` : ''}</li>`
      )
      .join('')
    return `<ul class="${classes.join(' ')}"${anchorAttr}>${items}</ul>`
  },
}
