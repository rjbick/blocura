import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { BlockEditor } from './index'
import type { Block, BlockEditorProps, SavePayload } from './types'

const initialBlocks: Block[] = [
  {
    clientId: 'payload-1',
    name: 'core/paragraph',
    attributes: {
      content: 'Hello world',
      className: 'lead',
    },
    innerBlocks: [],
  },
]

async function renderEditorAndSave(
  props: Omit<BlockEditorProps, 'onSave'>,
  onSave: ReturnType<typeof vi.fn>
): Promise<SavePayload> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  await act(async () => {
    root.render(<BlockEditor {...props} onSave={onSave} />)
  })

  const saveButton = container.querySelector<HTMLButtonElement>('button[aria-label="Save draft"]')
  if (!saveButton) {
    throw new Error('Save button was not found.')
  }

  await act(async () => {
    saveButton.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  const payload = onSave.mock.calls[0]?.[0] as SavePayload | undefined
  if (!payload) {
    throw new Error('onSave did not receive a payload.')
  }

  await act(async () => {
    root.unmount()
  })

  return payload
}

describe('save payload', () => {
  it('includes title markup by default and keeps metadata in JSON payload', async () => {
    const onSave = vi.fn()

    const payload = await renderEditorAndSave({
      initialBlocks,
      initialTitle: 'Landing Page',
      initialPostSettings: {
        meta: {
          seo_title: 'Landing Page | Example',
        },
      },
    }, onSave)

    expect(payload.rawHtml.startsWith('<h1>Landing Page</h1>')).toBe(true)
    expect(payload.titleIncludedInContent).toBe(true)
    expect(payload.postSettings.includeTitleInContent).toBe(true)
    expect(payload.metadata).toEqual({
      seo_title: 'Landing Page | Example',
    })
    expect(payload.tailwindSafelist).toEqual(['lead'])
    expect(payload.blocksJson).toBe(JSON.stringify(payload.blocks))
  })

  it('forces body-only output in body mode while keeping metadata in JSON payload', async () => {
    const onSave = vi.fn()

    const payload = await renderEditorAndSave({
      initialBlocks,
      initialTitle: 'Landing Page',
      initialPostSettings: {
        includeTitleInContent: true,
        meta: {
          seo_title: 'Landing Page | Example',
          seo_description: 'Body editor mode test',
        },
      },
      settings: {
        contentMode: 'body',
        showDocumentMetadata: true,
      },
    }, onSave)

    expect(payload.rawHtml).not.toContain('<h1>')
    expect(payload.titleIncludedInContent).toBe(false)
    expect(payload.postSettings.includeTitleInContent).toBe(false)
    expect(payload.metadata).toEqual({
      seo_title: 'Landing Page | Example',
      seo_description: 'Body editor mode test',
    })
    expect(payload.tailwindSafelist).toEqual(['lead'])
    expect(payload.blocksJson).toBe(JSON.stringify(payload.blocks))
  })
})
