import { CalendarDays } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'

interface CalendarAttributes {
  monthLabel: string
  showWeekdayInitials: boolean
  className?: string
  anchor?: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface CalendarDay {
  day: number | null
  hasPost?: boolean
}

const DAYS: CalendarDay[] = [
  { day: null }, { day: null }, { day: null }, { day: null }, { day: 1 }, { day: 2 }, { day: 3 },
  { day: 4 }, { day: 5, hasPost: true }, { day: 6 }, { day: 7 }, { day: 8 }, { day: 9 }, { day: 10 },
  { day: 11 }, { day: 12, hasPost: true }, { day: 13 }, { day: 14 }, { day: 15 }, { day: 16 }, { day: 17 },
  { day: 18 }, { day: 19 }, { day: 20 }, { day: 21 }, { day: 22 }, { day: 23, hasPost: true }, { day: 24 },
  { day: 25 }, { day: 26 }, { day: 27 }, { day: 28 },
]

function CalendarEdit({ attributes, setAttributes, isSelected }: BlockEditProps<CalendarAttributes>) {
  const settings: CalendarAttributes = {
    monthLabel: attributes.monthLabel || 'February 2026',
    showWeekdayInitials: attributes.showWeekdayInitials ?? true,
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
        fontFamily: 'var(--wp-font-family)',
      }}
    >
      {isSelected && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            Month label
            <input
              type="text"
              value={settings.monthLabel}
              onChange={(e) => setAttributes({ monthLabel: e.target.value })}
              style={controlInputStyle}
            />
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <input
              type="checkbox"
              checked={settings.showWeekdayInitials}
              onChange={(e) => setAttributes({ showWeekdayInitials: e.target.checked })}
            />
            Abbreviate weekdays
          </label>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <caption style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#1e1e1e' }}>
          {settings.monthLabel}
        </caption>
        <thead>
          <tr>
            {WEEKDAYS.map((weekday) => (
              <th
                key={weekday}
                style={{
                  fontSize: 11,
                  color: '#757575',
                  fontWeight: 500,
                  paddingBottom: 6,
                }}
              >
                {settings.showWeekdayInitials ? weekday.slice(0, 1) : weekday}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 4 }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {DAYS.slice(rowIndex * 7, rowIndex * 7 + 7).map((entry, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  style={{
                    borderTop: '1px solid #f0f0f1',
                    textAlign: 'center',
                    padding: '6px 0',
                    fontSize: 12,
                    color: '#1e1e1e',
                    minHeight: 28,
                  }}
                >
                  {entry.day === null ? (
                    <span aria-hidden style={{ color: '#dcdcde' }}>·</span>
                  ) : entry.hasPost ? (
                    <a
                      href={`#day-${entry.day}`}
                      style={{ color: 'var(--wp-components-color-accent)', textDecoration: 'none' }}
                    >
                      {entry.day}
                    </a>
                  ) : (
                    entry.day
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const controlInputStyle: React.CSSProperties = {
  border: '1px solid #dcdcde',
  borderRadius: 2,
  padding: '6px 8px',
  fontSize: 13,
  fontFamily: 'var(--wp-font-family)',
  backgroundColor: '#fff',
}

export const calendarBlock: BlockDefinition = {
  name: 'core/calendar',
  title: 'Calendar',
  description: 'Display a monthly calendar of posts.',
  category: 'widgets',
  icon: <CalendarDays size={20} />,
  keywords: ['calendar', 'dates', 'archive'],
  supports: {
    align: ['left', 'center', 'right', 'wide', 'full'],
    anchor: true,
    className: true,
  },
  attributes: {
    monthLabel: { type: 'string', default: 'February 2026' },
    showWeekdayInitials: { type: 'boolean', default: true },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: CalendarEdit,
  save: ({ attributes }) => {
    const settings: CalendarAttributes = {
      monthLabel: (attributes as CalendarAttributes).monthLabel || 'February 2026',
      showWeekdayInitials: (attributes as CalendarAttributes).showWeekdayInitials ?? true,
      className: (attributes as CalendarAttributes).className,
      anchor: (attributes as CalendarAttributes).anchor,
    }
    const classes = ['wp-block-calendar']
    if (settings.className) classes.push(settings.className)
    const anchorAttr = settings.anchor ? ` id="${settings.anchor}"` : ''
    const header = WEEKDAYS
      .map((weekday) => `<th>${settings.showWeekdayInitials ? weekday.slice(0, 1) : weekday}</th>`)
      .join('')
    const rows = Array.from({ length: 4 }, (_, rowIndex) => {
      const cells = DAYS.slice(rowIndex * 7, rowIndex * 7 + 7)
        .map((entry) => {
          if (entry.day === null) return '<td>&nbsp;</td>'
          if (entry.hasPost) return `<td><a href="#day-${entry.day}">${entry.day}</a></td>`
          return `<td>${entry.day}</td>`
        })
        .join('')
      return `<tr>${cells}</tr>`
    }).join('')
    return `<div class="${classes.join(' ')}"${anchorAttr}><table><caption>${settings.monthLabel}</caption><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>`
  },
}
