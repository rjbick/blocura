import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { TextSelection } from 'prosemirror-state'
import { describe, expect, it, vi } from 'vitest'
import { BlockEditor } from '../../index'
import type { Block } from '../../types'
import { getViewForElement } from '../richtext/viewRegistry'

async function openBlockOptionsMenu(blockEl: HTMLElement): Promise<void> {
  const optionsButton = blockEl.querySelector<HTMLButtonElement>('button[aria-label="Block options"]')
  if (!optionsButton) {
    throw new Error('Block options button was not rendered.')
  }

  await act(async () => {
    optionsButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    optionsButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await Promise.resolve()
  })
}

function findMenuItemByLabel(label: string): HTMLElement {
  const menuItem = [
    ...Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]')),
    ...Array.from(document.querySelectorAll<HTMLElement>('.editor-dropdown-item')),
  ].find((el) => el.textContent?.trim() === label)

  if (!menuItem) {
    throw new Error(`${label} menu item was not rendered.`)
  }

  return menuItem
}

function setInputValue(input: HTMLInputElement, value: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')
  descriptor?.set?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('BlockFloatingToolbar quick controls', () => {
  it('supports heading level, alignment, and text decoration from the floating toolbar', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const initialBlocks: Block[] = [
      {
        clientId: 'heading-1',
        name: 'core/heading',
        attributes: {
          content: 'Toolbar heading',
          level: 2,
        },
        innerBlocks: [],
      },
    ]

    await act(async () => {
      root.render(<BlockEditor initialBlocks={initialBlocks} />)
    })

    const blockEl = container.querySelector<HTMLElement>('[data-block="heading-1"]')
    if (!blockEl) throw new Error('Heading block was not rendered.')

    await act(async () => {
      blockEl.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const levelSelect = blockEl.querySelector<HTMLSelectElement>('select[aria-label="Heading level"]')
    if (!levelSelect) throw new Error('Heading level control was not rendered.')

    await act(async () => {
      levelSelect.value = '4'
      levelSelect.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const heading = blockEl.querySelector<HTMLElement>('h4')
    expect(heading).not.toBeNull()

    const alignCenterButton = blockEl.querySelector<HTMLButtonElement>('button[aria-label="Align center"]')
    if (!alignCenterButton) throw new Error('Align center control was not rendered.')

    await act(async () => {
      alignCenterButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const headingAfterAlign = blockEl.querySelector<HTMLElement>('h4')
    expect(headingAfterAlign?.style.textAlign).toBe('center')

    const underlineButton = blockEl.querySelector<HTMLButtonElement>('button[aria-label="Underline"]')
    if (!underlineButton) throw new Error('Underline control was not rendered.')

    await act(async () => {
      underlineButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      underlineButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const headingAfterDecoration = blockEl.querySelector<HTMLElement>('h4')
    expect(headingAfterDecoration?.style.textDecoration).toContain('underline')

    await act(async () => {
      root.unmount()
    })
  })

  it('allows selecting the parent block from the floating toolbar', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const initialBlocks: Block[] = [
      {
        clientId: 'group-1',
        name: 'core/group',
        attributes: {
          tagName: 'div',
          className: '',
        },
        innerBlocks: [
          {
            clientId: 'paragraph-1',
            name: 'core/paragraph',
            attributes: {
              content: 'Nested paragraph',
            },
            innerBlocks: [],
          },
        ],
      },
    ]

    await act(async () => {
      root.render(<BlockEditor initialBlocks={initialBlocks} />)
    })

    const paragraphEl = container.querySelector<HTMLElement>('[data-block="paragraph-1"]')
    if (!paragraphEl) throw new Error('Nested paragraph block was not rendered.')

    await act(async () => {
      paragraphEl.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const selectParent = paragraphEl.querySelector<HTMLButtonElement>(
      'button[aria-label="Select parent block (Group)"]'
    )
    if (!selectParent) throw new Error('Select parent control was not rendered.')

    await act(async () => {
      selectParent.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const groupEl = container.querySelector<HTMLElement>('[data-block="group-1"]')
    expect(groupEl?.querySelector('button[aria-label="Group block type"]')).not.toBeNull()

    await act(async () => {
      root.unmount()
    })
  })

  it('shows an ellipsis options menu and selects the duplicated block', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const initialBlocks: Block[] = [
      {
        clientId: 'paragraph-dup-source',
        name: 'core/paragraph',
        attributes: {
          content: 'Duplicate source',
        },
        innerBlocks: [],
      },
    ]

    await act(async () => {
      root.render(<BlockEditor initialBlocks={initialBlocks} />)
    })

    const sourceEl = container.querySelector<HTMLElement>('[data-block="paragraph-dup-source"]')
    if (!sourceEl) throw new Error('Source paragraph block was not rendered.')

    await act(async () => {
      sourceEl.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await openBlockOptionsMenu(sourceEl)

    const duplicateMenuItem = findMenuItemByLabel('Duplicate')

    await act(async () => {
      duplicateMenuItem.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const blocks = Array.from(container.querySelectorAll<HTMLElement>('[data-block-name="core/paragraph"]'))
    expect(blocks).toHaveLength(2)

    const clonedBlock = blocks.find((el) => el.dataset.block !== 'paragraph-dup-source')
    expect(clonedBlock).toBeDefined()
    expect(clonedBlock?.querySelector('button[aria-label="Paragraph block type"]')).not.toBeNull()
    expect(sourceEl.querySelector('button[aria-label="Paragraph block type"]')).toBeNull()

    await act(async () => {
      root.unmount()
    })
  })

  it('converts a paragraph block to an HTML block from the ellipsis menu', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const initialBlocks: Block[] = [
      {
        clientId: 'paragraph-html-source',
        name: 'core/paragraph',
        attributes: {
          content: 'Convert me to HTML',
        },
        innerBlocks: [],
      },
    ]

    await act(async () => {
      root.render(<BlockEditor initialBlocks={initialBlocks} />)
    })

    const sourceEl = container.querySelector<HTMLElement>('[data-block="paragraph-html-source"]')
    if (!sourceEl) throw new Error('Paragraph block was not rendered.')

    await act(async () => {
      sourceEl.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await openBlockOptionsMenu(sourceEl)
    const editAsHtmlMenuItem = findMenuItemByLabel('Edit as HTML')

    await act(async () => {
      editAsHtmlMenuItem.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const htmlBlock = container.querySelector<HTMLElement>('[data-block-name="core/html"]')
    expect(htmlBlock).not.toBeNull()
    expect(container.querySelector('[data-block-name="core/paragraph"]')).toBeNull()

    await act(async () => {
      root.unmount()
    })
  })

  it('converts an HTML block back to blocks from the ellipsis menu', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)

    const initialBlocks: Block[] = [
      {
        clientId: 'html-convert-source',
        name: 'core/html',
        attributes: {
          content: '<p>Converted back to paragraph</p>',
        },
        innerBlocks: [],
      },
    ]

    await act(async () => {
      root.render(<BlockEditor initialBlocks={initialBlocks} />)
    })

    const sourceEl = container.querySelector<HTMLElement>('[data-block="html-convert-source"]')
    if (!sourceEl) throw new Error('HTML block was not rendered.')

    await act(async () => {
      sourceEl.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    await openBlockOptionsMenu(sourceEl)
    const convertToBlocksMenuItem = findMenuItemByLabel('Convert to blocks')

    await act(async () => {
      convertToBlocksMenuItem.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const paragraphBlock = container.querySelector<HTMLElement>('[data-block-name="core/paragraph"]')
    expect(paragraphBlock).not.toBeNull()
    expect(container.querySelector('[data-block-name="core/html"]')).toBeNull()

    await act(async () => {
      root.unmount()
    })
  })

  it('edits direct block links using the in-page dialog and does not use window.prompt', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const onChange = vi.fn()
    const promptSpy = vi.spyOn(window, 'prompt')

    const initialBlocks: Block[] = [
      {
        clientId: 'button-link-source',
        name: 'core/button',
        attributes: {
          text: 'Call to action',
          url: '',
        },
        innerBlocks: [],
      },
    ]

    await act(async () => {
      root.render(<BlockEditor initialBlocks={initialBlocks} onChange={onChange} />)
    })

    const buttonBlock = container.querySelector<HTMLElement>('[data-block="button-link-source"]')
    if (!buttonBlock) throw new Error('Button block was not rendered.')

    await act(async () => {
      buttonBlock.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const editHrefButton = buttonBlock.querySelector<HTMLButtonElement>('button[aria-label="Edit href"]')
    if (!editHrefButton) throw new Error('Edit href control was not rendered.')

    await act(async () => {
      editHrefButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      editHrefButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    const urlInput = document.querySelector<HTMLInputElement>('input[id="editor-link-url"]')
    if (!urlInput) throw new Error('Link URL dialog input was not rendered.')

    await act(async () => {
      setInputValue(urlInput, 'https://example.com/about')
    })

    const linkForm = urlInput.closest('form')
    if (!linkForm) throw new Error('Link dialog form was not rendered.')

    await act(async () => {
      linkForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await Promise.resolve()
    })

    expect(promptSpy).not.toHaveBeenCalled()
    expect(
      onChange.mock.calls.some((call) => {
        const blocks = call[0] as Block[]
        const attrs = blocks[0]?.attributes as { url?: string } | undefined
        return attrs?.url === 'https://example.com/about'
      })
    ).toBe(true)

    promptSpy.mockRestore()

    await act(async () => {
      root.unmount()
    })
  })

  it('uses host page suggestions for link selection when onSearchPages is provided', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const onChange = vi.fn()
    const onSearchPages = vi.fn(async (options: { query: string; page: number; perPage: number }) => {
      const allPages = [
        { id: 1, title: 'Home', url: '/home' },
        { id: 2, title: 'Pricing', url: '/pricing' },
        { id: 3, title: 'Documentation', url: '/docs' },
      ].filter((page) => page.title.toLowerCase().includes(options.query.toLowerCase()))
      const start = (options.page - 1) * options.perPage
      const pages = allPages.slice(start, start + options.perPage)
      return {
        pages,
        nextPage: start + options.perPage < allPages.length ? options.page + 1 : null,
      }
    })

    const initialBlocks: Block[] = [
      {
        clientId: 'button-link-suggested',
        name: 'core/button',
        attributes: {
          text: 'Get pricing',
          url: '',
        },
        innerBlocks: [],
      },
    ]

    await act(async () => {
      root.render(
        <BlockEditor
          initialBlocks={initialBlocks}
          onChange={onChange}
          onSearchPages={onSearchPages}
        />
      )
    })

    const buttonBlock = container.querySelector<HTMLElement>('[data-block="button-link-suggested"]')
    if (!buttonBlock) throw new Error('Button block was not rendered.')

    await act(async () => {
      buttonBlock.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const editHrefButton = buttonBlock.querySelector<HTMLButtonElement>('button[aria-label="Edit href"]')
    if (!editHrefButton) throw new Error('Edit href control was not rendered.')

    await act(async () => {
      editHrefButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      editHrefButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 20))
    })

    const pageSearchInput = document.querySelector<HTMLInputElement>('input[id="editor-link-pages-search"]')
    if (!pageSearchInput) throw new Error('Page search input was not rendered.')

    await act(async () => {
      setInputValue(pageSearchInput, 'pri')
      await new Promise((resolve) => setTimeout(resolve, 220))
    })

    expect(onSearchPages).toHaveBeenCalled()
    expect(onSearchPages).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'pri',
        page: 1,
        perPage: 20,
      })
    )

    const pricingOption = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.includes('Pricing'))
    if (!pricingOption) throw new Error('Suggested page option was not rendered.')

    await act(async () => {
      pricingOption.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    const urlInput = document.querySelector<HTMLInputElement>('input[id="editor-link-url"]')
    expect(urlInput?.value).toBe('/pricing')

    const linkForm = urlInput?.closest('form')
    if (!linkForm) throw new Error('Link dialog form was not rendered.')

    await act(async () => {
      linkForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await Promise.resolve()
    })

    await act(async () => {
      editHrefButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      editHrefButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
    })

    const persistedUrlInput = document.querySelector<HTMLInputElement>('input[id="editor-link-url"]')
    expect(persistedUrlInput?.value).toBe('/pricing')

    await act(async () => {
      root.unmount()
    })
  })

  it('supports keyboard link insertion (Ctrl/Cmd+K) using the in-page dialog', async () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const promptSpy = vi.spyOn(window, 'prompt')

    const initialBlocks: Block[] = [
      {
        clientId: 'paragraph-keyboard-link',
        name: 'core/paragraph',
        attributes: {
          content: 'Keyboard shortcut link target',
        },
        innerBlocks: [],
      },
    ]

    await act(async () => {
      root.render(<BlockEditor initialBlocks={initialBlocks} />)
    })

    const blockEl = container.querySelector<HTMLElement>('[data-block="paragraph-keyboard-link"]')
    if (!blockEl) throw new Error('Paragraph block was not rendered.')

    const prose = blockEl.querySelector<HTMLElement>('.ProseMirror')
    if (!prose) throw new Error('ProseMirror surface was not rendered.')
    const view = getViewForElement(prose)
    if (!view) throw new Error('Editor view was not registered.')

    await act(async () => {
      prose.focus()
      const safeTo = Math.min(9, Math.max(2, view.state.doc.content.size - 1))
      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1, safeTo)))
      prose.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))
      await Promise.resolve()
    })

    const urlInput = document.querySelector<HTMLInputElement>('input[id="editor-link-url"]')
    if (!urlInput) throw new Error('Keyboard link dialog was not rendered.')

    await act(async () => {
      setInputValue(urlInput, '/keyboard-link')
    })

    const linkForm = urlInput.closest('form')
    if (!linkForm) throw new Error('Keyboard link form was not rendered.')

    await act(async () => {
      linkForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await Promise.resolve()
    })

    expect(promptSpy).not.toHaveBeenCalled()
    expect(prose.querySelector('a[href="/keyboard-link"]')).not.toBeNull()

    promptSpy.mockRestore()

    await act(async () => {
      root.unmount()
    })
  })
})
