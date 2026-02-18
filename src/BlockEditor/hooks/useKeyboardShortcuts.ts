import { useEffect, useContext } from 'react'
import type { Block } from '../types'
import { EditorStoreContext } from '../store'
import { flattenBlocks, findBlockParent } from '../helpers/flattenBlocks'
import { blocksToBlockMarkup } from '../helpers/blocksToBlockMarkup'
import { parseBlockMarkup } from '../helpers/parseBlockMarkup'
import { generateClientId } from '../helpers/generateClientId'
import {
  areBlocksAllowedAtRoot,
  createDefaultBlockForRoot,
  getInsertTargetFromSelection,
  isBlockNameAllowedAtRoot,
} from '../helpers/insertionRules'

interface UseKeyboardShortcutsOptions {
  onSave?: () => void
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function toParagraphHtml(text: string): string {
  return escapeHtml(text).replace(/\r?\n/g, '<br>')
}

function withTextContent(block: Block, text: string): Block {
  const attrs = { ...(block.attributes as Record<string, unknown>) }
  const paragraphHtml = toParagraphHtml(text)

  if ('content' in attrs) {
    attrs.content = paragraphHtml
  } else if ('text' in attrs) {
    attrs.text = paragraphHtml
  } else if ('value' in attrs) {
    attrs.value = paragraphHtml
  } else if ('label' in attrs) {
    attrs.label = text
  }

  return {
    ...block,
    attributes: attrs,
  }
}

export function useKeyboardShortcuts({ onSave }: UseKeyboardShortcutsOptions = {}) {
  // Access the store instance (not its state) — so no subscription, no re-renders
  const storeInstance = useContext(EditorStoreContext)

  useEffect(() => {
    if (!storeInstance) return

    function handleKeyDown(event: KeyboardEvent) {
      // Always read fresh state inside the event handler
      const s = storeInstance!.getState()
      const target = event.target as HTMLElement
      const isInInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      const hasUserTextSelection = Boolean(window.getSelection()?.toString())

      // Save
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 's') {
        event.preventDefault()
        onSave?.()
        return
      }

      // Command palette
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        s.openCommandPalette()
        return
      }

      // Toggle block inserter (Shift+Mod+K)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && !event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        s.toggleInserter()
        return
      }

      // Undo — skip when focus is in a rich text (ProseMirror handles it)
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'z') {
        if (!isInInput) {
          event.preventDefault()
          s.undo()
        }
        return
      }

      // Redo
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z') {
        if (!isInInput) {
          event.preventDefault()
          s.redo()
        }
        return
      }

      // Redo alternative (Ctrl/Cmd+Y)
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'y') {
        if (!isInInput) {
          event.preventDefault()
          s.redo()
        }
        return
      }

      // Toggle list view
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'J') {
        event.preventDefault()
        s.toggleListView()
        return
      }

      // Preferences / Settings (Ctrl/Cmd+,)
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key === ',') {
        event.preventDefault()
        s.openPreferences()
        return
      }

      // Duplicate block
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault()
        const selected = s.selectedClientIds[0]
        if (selected) s.duplicateBlock(selected)
        return
      }

      // Insert block before selected (Ctrl+Alt+T)
      if ((event.ctrlKey || event.metaKey) && event.altKey && !event.shiftKey && event.key.toLowerCase() === 't') {
        event.preventDefault()
        const selected = s.selectedClientIds[0]
        if (selected) {
          const parent = findBlockParent(s.blocks, selected)
          const siblings = parent ? parent.innerBlocks : s.blocks
          const idx = siblings.findIndex((b) => b.clientId === selected)
          if (idx !== -1) {
            const block = createDefaultBlockForRoot(s.blocks, parent?.clientId ?? null)
            if (!block) return
            s.insertBlock(block, parent?.clientId ?? null, idx)
          }
        }
        return
      }

      // Insert block after selected (Ctrl+Alt+Y)
      if ((event.ctrlKey || event.metaKey) && event.altKey && !event.shiftKey && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        const selected = s.selectedClientIds[0]
        if (selected) {
          const parent = findBlockParent(s.blocks, selected)
          const siblings = parent ? parent.innerBlocks : s.blocks
          const idx = siblings.findIndex((b) => b.clientId === selected)
          if (idx !== -1) {
            const block = createDefaultBlockForRoot(s.blocks, parent?.clientId ?? null)
            if (!block) return
            s.insertBlock(block, parent?.clientId ?? null, idx + 1)
          }
        }
        return
      }

      // Delete block (Shift+Alt+Z)
      if (event.shiftKey && event.altKey && event.key === 'z') {
        event.preventDefault()
        const selected = s.selectedClientIds[0]
        if (selected) s.removeBlock(selected)
        return
      }

      // Toggle fullscreen (Ctrl+Shift+Alt+F)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.altKey && event.key === 'f') {
        event.preventDefault()
        s.toggleFullscreen()
        return
      }

      // Toggle distraction free (Ctrl+Shift+\)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '\\') {
        event.preventDefault()
        s.toggleDistractionFree()
        return
      }

      // Toggle zoom out (Ctrl+Shift+-)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '-') {
        event.preventDefault()
        s.toggleZoomOut()
        return
      }

      // Copy/cut selected block when not editing text
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && (event.key === 'c' || event.key === 'x')) {
        if (!isInInput && !hasUserTextSelection) {
          if (s.selectedClientIds.length === 0) return
          const selectedIds = new Set(s.selectedClientIds)
          const selectedBlocks = flattenBlocks(s.blocks).filter((block) => selectedIds.has(block.clientId))
          if (selectedBlocks.length === 0) return
          event.preventDefault()
          const markup = blocksToBlockMarkup(selectedBlocks)
          navigator.clipboard?.writeText(markup).catch(() => {})
          if (event.key === 'x') {
            s.removeBlocks(selectedBlocks.map((block) => block.clientId))
          }
        }
        return
      }

      // Paste blocks from clipboard when not editing text
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && !event.altKey && event.key.toLowerCase() === 'v') {
        if (isInInput) return
        event.preventDefault()
        if (!navigator.clipboard?.readText) {
          s.createWarningNotice('Clipboard paste is not available in this browser.')
          return
        }

        void navigator.clipboard.readText()
          .then((text) => {
            const raw = text.trim()
            if (!raw) return

            const current = storeInstance!.getState()
            const insertTarget = getInsertTargetFromSelection(
              current.blocks,
              current.selectedClientIds[0] ?? null
            )

            const chunks = raw
              .split(/\n{2,}/)
              .map((part) => part.trim())
              .filter(Boolean)

            if (chunks.length === 0) return

            let blocksToInsert: Block[]

            if (isBlockNameAllowedAtRoot('core/paragraph', current.blocks, insertTarget.rootClientId)) {
              blocksToInsert = chunks.map((chunk) => ({
                clientId: generateClientId(),
                name: 'core/paragraph',
                attributes: { content: toParagraphHtml(chunk), dropCap: false },
                innerBlocks: [],
              }))
            } else {
              const template = createDefaultBlockForRoot(current.blocks, insertTarget.rootClientId)
              if (!template) return
              blocksToInsert = chunks.map((chunk) =>
                withTextContent(
                  {
                    ...template,
                    clientId: generateClientId(),
                    innerBlocks: [],
                  },
                  chunk
                )
              )
            }

            if (!areBlocksAllowedAtRoot(blocksToInsert, current.blocks, insertTarget.rootClientId)) {
              current.createWarningNotice('Those blocks can’t be pasted here.')
              return
            }

            current.insertBlocks(blocksToInsert, insertTarget.rootClientId, insertTarget.index)
            current.selectBlock(blocksToInsert[0].clientId)
          })
          .catch(() => {
            storeInstance!.getState().createWarningNotice('Unable to read clipboard contents.')
          })
        return
      }

      // Paste blocks from clipboard when not editing text
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key === 'v') {
        if (isInInput) return
        event.preventDefault()
        if (!navigator.clipboard?.readText) {
          s.createWarningNotice('Clipboard paste is not available in this browser.')
          return
        }

        void navigator.clipboard.readText()
          .then((text) => {
            if (!text.trim()) return
            const current = storeInstance!.getState()
            const insertTarget = getInsertTargetFromSelection(
              current.blocks,
              current.selectedClientIds[0] ?? null
            )
            const parsedBlocks = parseBlockMarkup(text)
            if (parsedBlocks.length === 0) return
            if (!areBlocksAllowedAtRoot(parsedBlocks, current.blocks, insertTarget.rootClientId)) {
              current.createWarningNotice('Those blocks can’t be pasted here.')
              return
            }
            current.insertBlocks(parsedBlocks, insertTarget.rootClientId, insertTarget.index)
            current.selectBlock(parsedBlocks[0].clientId)
          })
          .catch(() => {
            storeInstance!.getState().createWarningNotice('Unable to read clipboard contents.')
          })
        return
      }

      // Select all blocks (Ctrl+Shift+A) — always, or Ctrl+A when not in text
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'A') {
        event.preventDefault()
        s.selectAll()
        return
      }

      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'a') {
        if (!isInInput) {
          event.preventDefault()
          s.selectAll()
        }
        return
      }

      // Tab — navigate to next block (when not in a text input)
      if (event.key === 'Tab' && !event.shiftKey && !isInInput) {
        const flat = flattenBlocks(s.blocks)
        if (flat.length === 0) return
        const currentId = s.selectedClientIds[0]
        const idx = currentId ? flat.findIndex(b => b.clientId === currentId) : -1
        const nextIdx = Math.min(idx + 1, flat.length - 1)
        if (flat[nextIdx] && flat[nextIdx].clientId !== currentId) {
          event.preventDefault()
          s.selectBlock(flat[nextIdx].clientId)
        }
        return
      }

      // Shift+Tab — navigate to previous block (when not in a text input)
      if (event.key === 'Tab' && event.shiftKey && !isInInput) {
        const flat = flattenBlocks(s.blocks)
        if (flat.length === 0) return
        const currentId = s.selectedClientIds[0]
        const idx = currentId ? flat.findIndex(b => b.clientId === currentId) : flat.length
        const prevIdx = Math.max(idx - 1, 0)
        if (flat[prevIdx] && flat[prevIdx].clientId !== currentId) {
          event.preventDefault()
          s.selectBlock(flat[prevIdx].clientId)
        }
        return
      }

      // Escape
      if (event.key === 'Escape') {
        if (s.commandPaletteOpen) {
          s.closeCommandPalette()
        } else if (s.keyboardShortcutsOpen) {
          s.closeKeyboardShortcuts()
        } else if (s.preferencesOpen) {
          s.closePreferences()
        } else if (s.inserterOpen) {
          s.closeInserter()
        } else if (s.selectedClientIds.length > 0) {
          s.clearSelection()
        }
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [storeInstance, onSave])
}
