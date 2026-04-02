import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { BlockEditor } from '../../index'
import type { Block } from '../../types'

describe('BlockEditor render stability', () => {
  it('renders a first block without entering an update loop', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const initialBlocks: Block[] = [
      {
        clientId: 'stability-1',
        name: 'core/separator',
        attributes: {},
        innerBlocks: [],
      },
    ]

    await act(async () => {
      root.render(<BlockEditor initialBlocks={initialBlocks} />)
    })

    expect(container.querySelector('[data-block="stability-1"]')).not.toBeNull()

    await act(async () => {
      root.unmount()
    })
  })

  it('applies a preset layout when initializing an empty columns block', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const onChange = vi.fn()

    const initialBlocks: Block[] = [
      {
        clientId: 'columns-root',
        name: 'core/columns',
        attributes: {},
        innerBlocks: [],
      },
    ]

    await act(async () => {
      root.render(<BlockEditor initialBlocks={initialBlocks} onChange={onChange} />)
    })

    const presetButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Select 33 / 67 columns layout"]'
    )
    if (!presetButton) throw new Error('Columns preset layout button was not rendered.')

    await act(async () => {
      presetButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    expect(
      onChange.mock.calls.some((call) => {
        const blocks = call[0] as Block[]
        const columnsBlock = blocks.find((candidate) => candidate.clientId === 'columns-root')
        if (!columnsBlock) return false
        const widths = columnsBlock.innerBlocks
          .map((candidate) => String((candidate.attributes as { width?: unknown }).width ?? ''))
        return widths.length === 2 && widths[0] === '33.33%' && widths[1] === '66.67%'
      })
    ).toBe(true)

    await act(async () => {
      root.unmount()
    })
  })

  it('applies imported group and section presentation styles to the rendered container element', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const initialBlocks: Block[] = [
      {
        clientId: 'styled-group',
        name: 'core/group',
        attributes: {
          className: 'three-col',
          __htmlStyle: 'display:flex;gap:24px;background-image:url(https://example.com/group.jpg)',
        },
        innerBlocks: [
          {
            clientId: 'styled-group-paragraph',
            name: 'core/paragraph',
            attributes: { content: 'Inside group' },
            innerBlocks: [],
          },
        ],
      },
      {
        clientId: 'styled-section',
        name: 'core/section',
        attributes: {
          className: 'hero-bg',
          __htmlStyle: 'background-image:url(https://example.com/hero.jpg);min-height:320px',
        },
        innerBlocks: [
          {
            clientId: 'styled-section-paragraph',
            name: 'core/paragraph',
            attributes: { content: 'Inside section' },
            innerBlocks: [],
          },
        ],
      },
    ]

    await act(async () => {
      root.render(<BlockEditor initialBlocks={initialBlocks} />)
    })

    const groupBlock = container.querySelector<HTMLElement>('[data-block="styled-group"]')
    if (!groupBlock) throw new Error('Styled group block was not rendered.')
    const groupWrapper = groupBlock.querySelector<HTMLElement>('[data-block-name="core/group"] > div')
    if (!groupWrapper) throw new Error('Styled group wrapper was not rendered.')
    const renderedGroup = groupWrapper.firstElementChild as HTMLElement | null
    if (!renderedGroup) throw new Error('Rendered group element was not found.')

    expect(groupWrapper.className).toContain('editor-block-group')
    expect(groupWrapper.className).not.toContain('three-col')
    expect(groupWrapper.style.display).toBe('')
    expect(renderedGroup.className).toContain('three-col')
    expect(renderedGroup.style.display).toBe('flex')
    expect(renderedGroup.style.gap).toBe('24px')
    expect(renderedGroup.style.backgroundImage).toContain('group.jpg')

    const sectionBlock = container.querySelector<HTMLElement>('[data-block="styled-section"]')
    if (!sectionBlock) throw new Error('Styled section block was not rendered.')
    const sectionWrapper = sectionBlock.querySelector<HTMLElement>('[data-block-name="core/section"] > div')
    if (!sectionWrapper) throw new Error('Styled section wrapper was not rendered.')
    const renderedSection = sectionWrapper.firstElementChild as HTMLElement | null
    if (!renderedSection) throw new Error('Rendered section element was not found.')

    expect(sectionWrapper.className).toContain('editor-block-section')
    expect(sectionWrapper.className).not.toContain('hero-bg')
    expect(renderedSection.className).toContain('hero-bg')
    expect(renderedSection.style.backgroundImage).toContain('hero.jpg')
    expect(renderedSection.style.minHeight).toBe('320px')

    await act(async () => {
      root.unmount()
    })
  })

  it('applies imported columns and column presentation styles to the rendered container elements', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const initialBlocks: Block[] = [
      {
        clientId: 'styled-columns',
        name: 'core/columns',
        attributes: {
          className: 'three-col',
          __htmlStyle: 'display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px',
        },
        innerBlocks: [
          {
            clientId: 'styled-column',
            name: 'core/column',
            attributes: {
              className: 'fcard',
              __htmlStyle: 'background:rgba(15,35,64,.06);padding:24px',
            },
            innerBlocks: [
              {
                clientId: 'styled-column-paragraph',
                name: 'core/paragraph',
                attributes: { content: 'Inside column' },
                innerBlocks: [],
              },
            ],
          },
        ],
      },
    ]

    await act(async () => {
      root.render(<BlockEditor initialBlocks={initialBlocks} />)
    })

    const columnsBlock = container.querySelector<HTMLElement>('[data-block="styled-columns"]')
    if (!columnsBlock) throw new Error('Styled columns block was not rendered.')
    const columnsWrapper = columnsBlock.querySelector<HTMLElement>('[data-block-name="core/columns"] > div')
    if (!columnsWrapper) throw new Error('Styled columns wrapper was not rendered.')
    const renderedColumns = columnsWrapper.firstElementChild as HTMLElement | null
    if (!renderedColumns) throw new Error('Rendered columns element was not found.')
    const renderedColumnsList = renderedColumns.querySelector<HTMLElement>('[data-block-list]')
    if (!renderedColumnsList) throw new Error('Rendered columns block list was not found.')

    expect(columnsWrapper.className).toContain('editor-block-columns')
    expect(columnsWrapper.className).not.toContain('three-col')
    expect(renderedColumns.className).not.toContain('three-col')
    expect(renderedColumnsList.className).toContain('three-col')
    expect(renderedColumnsList.style.display).toBe('grid')
    expect(renderedColumnsList.style.gridTemplateColumns).toContain('repeat(3')
    expect(renderedColumnsList.style.gap).toBe('24px')

    const columnBlock = container.querySelector<HTMLElement>('[data-block="styled-column"]')
    if (!columnBlock) throw new Error('Styled column block was not rendered.')
    const columnWrapper = columnBlock.querySelector<HTMLElement>('[data-block-name="core/column"] > div')
    if (!columnWrapper) throw new Error('Styled column wrapper was not rendered.')
    const renderedColumn = columnWrapper.firstElementChild as HTMLElement | null
    if (!renderedColumn) throw new Error('Rendered column element was not found.')

    expect(columnWrapper.className).toContain('editor-block-column')
    expect(columnWrapper.className).not.toContain('fcard')
    expect(renderedColumn.className).toContain('fcard')
    expect(renderedColumn.style.background).toContain('rgba(15, 35, 64, 0.06)')
    expect(renderedColumn.style.padding).toBe('24px')

    await act(async () => {
      root.unmount()
    })
  })
})
