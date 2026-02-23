import { Search } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'

interface SearchAttributes {
  label: string
  placeholder: string
  buttonText: string
  showLabel: boolean
  buttonPosition: 'button-outside' | 'button-inside' | 'no-button'
  className?: string
  anchor?: string
}

function SearchEdit({ attributes, setAttributes, isSelected }: BlockEditProps<SearchAttributes>) {
  const label = attributes.label || 'Search'
  const placeholder = attributes.placeholder || 'Search...'
  const buttonText = attributes.buttonText || 'Search'
  const buttonPosition = attributes.buttonPosition || 'button-outside'
  const showLabel = attributes.showLabel ?? false
  const showButton = buttonPosition !== 'no-button'
  const isButtonInside = buttonPosition === 'button-inside' && showButton

  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        padding: 12,
        backgroundColor: '#fff',
      }}
    >
      {isSelected && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 8,
            marginBottom: 10,
            fontFamily: 'var(--editor-font-family)',
            fontSize: 12,
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Label
            <input
              type="text"
              value={label}
              onChange={(e) => setAttributes({ label: e.target.value })}
              style={controlInputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Placeholder
            <input
              type="text"
              value={placeholder}
              onChange={(e) => setAttributes({ placeholder: e.target.value })}
              style={controlInputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Button text
            <input
              type="text"
              value={buttonText}
              onChange={(e) => setAttributes({ buttonText: e.target.value })}
              style={controlInputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            Button position
            <select
              value={buttonPosition}
              onChange={(e) =>
                setAttributes({
                  buttonPosition: e.target.value as SearchAttributes['buttonPosition'],
                })
              }
              style={controlInputStyle}
            >
              <option value="button-outside">Button outside</option>
              <option value="button-inside">Button inside</option>
              <option value="no-button">No button</option>
            </select>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={showLabel}
              onChange={(e) => setAttributes({ showLabel: e.target.checked })}
            />
            Show label
          </label>
        </div>
      )}

      <form
        onSubmit={(e) => e.preventDefault()}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {showLabel && (
          <label
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: '#1e1e1e',
              fontFamily: 'var(--editor-font-family)',
            }}
          >
            {label}
          </label>
        )}
        <div style={{ display: 'flex', gap: isButtonInside ? 0 : 8, position: 'relative' }}>
          <input
            type="search"
            value=""
            onChange={() => undefined}
            placeholder={placeholder}
            style={{
              ...controlInputStyle,
              flex: 1,
              paddingRight: isButtonInside ? 92 : 10,
            }}
          />
          {showButton && (
            <button
              type="submit"
              style={isButtonInside ? insideButtonStyle : outsideButtonStyle}
            >
              {buttonText}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

const controlInputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #dcdcde',
  borderRadius: 2,
  padding: '6px 8px',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
  backgroundColor: '#fff',
}

const outsideButtonStyle: React.CSSProperties = {
  border: '1px solid #1d4ed8',
  backgroundColor: '#2271b1',
  color: '#fff',
  borderRadius: 2,
  padding: '0 12px',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
  cursor: 'pointer',
}

const insideButtonStyle: React.CSSProperties = {
  ...outsideButtonStyle,
  position: 'absolute',
  right: 3,
  top: 3,
  bottom: 3,
}

export const searchBlock: BlockDefinition = {
  name: 'core/search',
  title: 'Search',
  description: 'Add a search box for your site.',
  category: 'widgets',
  icon: <Search size={20} />,
  keywords: ['find', 'query', 'search form'],
  supports: {
    align: ['left', 'center', 'right', 'wide', 'full'],
    anchor: true,
    className: true,
  },
  attributes: {
    label: { type: 'string', default: 'Search' },
    placeholder: { type: 'string', default: 'Search...' },
    buttonText: { type: 'string', default: 'Search' },
    showLabel: { type: 'boolean', default: false },
    buttonPosition: { type: 'string', default: 'button-outside' },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: SearchEdit,
  save: ({ attributes }) => {
    const {
      label = 'Search',
      placeholder = 'Search...',
      buttonText = 'Search',
      showLabel = false,
      buttonPosition = 'button-outside',
      className,
      anchor,
    } = attributes as SearchAttributes
    const classes = ['editor-block-search']
    if (buttonPosition === 'button-inside') classes.push('editor-block-search__button-inside')
    if (buttonPosition === 'no-button') classes.push('editor-block-search__no-button')
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const labelHtml = showLabel ? `<label class="editor-block-search__label">${label}</label>` : ''
    const buttonHtml = buttonPosition !== 'no-button'
      ? `<button class="editor-block-search__button" type="submit">${buttonText}</button>`
      : ''
    return `<div class="${classes.join(' ')}"${anchorAttr}><form role="search" class="editor-block-search__button-${buttonPosition}">${labelHtml}<input class="editor-block-search__input" type="search" placeholder="${placeholder}" />${buttonHtml}</form></div>`
  },
}
