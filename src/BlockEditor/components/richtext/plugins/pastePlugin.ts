import { Plugin, PluginKey } from 'prosemirror-state'
import type { Block } from '../../../types'
import { parseHtmlToBlocks } from '../../../helpers/parseHtmlToBlocks'
import { migrateLegacyHtmlClasses } from '../../../helpers/migrateLegacyClasses'

export interface PastePluginOptions {
  onBlocks?: (blocks: Block[]) => void
}

export const pastePluginKey = new PluginKey('richtext-paste')

function parsePastedBlocks(text: string, html: string | null): Block[] {
  if (html && html.trim()) {
    const migratedHtml = migrateLegacyHtmlClasses(html)
    const fromHtml = parseHtmlToBlocks(migratedHtml.value)
    if (fromHtml.length > 0) return fromHtml
  }

  if (text && text.trim()) {
    const migratedText = migrateLegacyHtmlClasses(text)
    const fromText = parseHtmlToBlocks(migratedText.value)
    if (fromText.length > 0) return fromText
  }

  return []
}

export function createPastePlugin(options: PastePluginOptions = {}) {
  return new Plugin({
    key: pastePluginKey,
    props: {
      handlePaste(_view, event) {
        const clipboard = event.clipboardData
        if (!clipboard) return false

        const text = clipboard.getData('text/plain') ?? ''
        const html = clipboard.getData('text/html') || null
        const blocks = parsePastedBlocks(text, html)
        if (blocks.length === 0) return false

        event.preventDefault()
        options.onBlocks?.(blocks)
        return Boolean(options.onBlocks)
      },
    },
  })
}
