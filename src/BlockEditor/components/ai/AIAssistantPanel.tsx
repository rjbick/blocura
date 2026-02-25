import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Sparkles, X } from 'lucide-react'
import { useEditorActions, useEditorStore, useEditorStoreApi } from '../../store'
import { useEditorRuntime } from '../../context'
import type { AiAssistantResponse, Block } from '../../types'
import { findBlock } from '../../helpers/flattenBlocks'
import { blocksToRawHtml } from '../../helpers/blocksToRawHtml'
import { parseHtmlToBlocks } from '../../helpers/parseHtmlToBlocks'
import { parseBlocksJson } from '../../helpers/parseBlocksJson'
import { cloneBlock } from '../../helpers/cloneBlock'
import { areBlocksAllowedAtRoot, getInsertTargetFromSelection } from '../../helpers/insertionRules'

function normalizeResponseBlocks(response: AiAssistantResponse): Block[] {
  if (response.type === 'blocks') {
    const parsedBlocks = parseBlocksJson(response.blocks)
    if (parsedBlocks.length > 0) return parsedBlocks
    if (typeof response.blocks === 'string') {
      return parseHtmlToBlocks(response.blocks)
    }
    return []
  }

  if (response.type === 'html') {
    return parseHtmlToBlocks(response.html)
  }

  return parseHtmlToBlocks(response.text)
}

export function AIAssistantPanel() {
  const store = useEditorStoreApi()
  const isOpen = useEditorStore((s) => s.aiAssistantOpen)
  const [prompt, setPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastMessage, setLastMessage] = useState<string | null>(null)
  const { onPromptAI } = useEditorRuntime()
  const {
    closeAIAssistant,
    createErrorNotice,
    createSuccessNotice,
  } = useEditorActions()

  const canSubmit = useMemo(
    () => Boolean(onPromptAI) && prompt.trim().length > 0 && !isSubmitting,
    [isSubmitting, onPromptAI, prompt]
  )

  if (!isOpen) return null

  const handleClose = () => {
    if (isSubmitting) return
    closeAIAssistant()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || !onPromptAI) return

    setIsSubmitting(true)
    setLastMessage(null)

    try {
      const snapshot = store.getState()
      const selectedBlocks = snapshot.selectedClientIds
        .map((clientId) => findBlock(snapshot.blocks, clientId))
        .filter((block): block is Block => block !== null)

      const response = await onPromptAI({
        prompt: trimmedPrompt,
        context: {
          title: snapshot.title,
          blocks: snapshot.blocks,
          rawHtml: blocksToRawHtml(snapshot.blocks, {
            title: snapshot.title,
            includeTitle: snapshot.postSettings.includeTitleInContent,
          }),
          selectedClientIds: snapshot.selectedClientIds,
          selectedBlocks,
        },
      })

      const responseBlocks = normalizeResponseBlocks(response)
      if (responseBlocks.length === 0) {
        setLastMessage(response.message ?? null)
        createErrorNotice('AI returned no insertable content.')
        return
      }

      const blocksToInsert = responseBlocks.map(cloneBlock)
      const currentState = store.getState()
      const selectedClientId = currentState.selectedClientIds[0] ?? null
      const target = getInsertTargetFromSelection(currentState.blocks, selectedClientId)

      if (areBlocksAllowedAtRoot(blocksToInsert, currentState.blocks, target.rootClientId)) {
        currentState.insertBlocks(blocksToInsert, target.rootClientId, target.index)
      } else if (areBlocksAllowedAtRoot(blocksToInsert, currentState.blocks, null)) {
        currentState.insertBlocks(blocksToInsert, null, currentState.blocks.length)
      } else {
        createErrorNotice('AI response cannot be inserted at the current location.')
        setLastMessage(response.message ?? null)
        return
      }

      if (response.message) {
        setLastMessage(response.message)
      }
      createSuccessNotice(response.message ?? 'AI content inserted.')
      setPrompt('')
      closeAIAssistant()
    } catch {
      createErrorNotice('AI request failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ask AI"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10001,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        style={{
          width: 'min(640px, 92vw)',
          backgroundColor: '#fff',
          borderRadius: 4,
          boxShadow: 'var(--editor-popover-shadow)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--editor-font-family)',
          maxHeight: '80vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #e0e0e0',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} />
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1e1e1e' }}>
              Ask AI
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close"
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: isSubmitting ? 'default' : 'pointer',
              borderRadius: 2,
              color: '#757575',
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ padding: 20, display: 'grid', gap: 12, overflowY: 'auto' }}
        >
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#50575e' }}>Prompt</span>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask for content changes, block drafts, or rewrite suggestions..."
              rows={7}
              disabled={isSubmitting}
              style={{
                width: '100%',
                border: '1px solid #dcdcde',
                borderRadius: 2,
                padding: '8px 10px',
                fontSize: 13,
                lineHeight: 1.5,
                fontFamily: 'var(--editor-font-family)',
                resize: 'vertical',
                minHeight: 120,
              }}
            />
          </label>

          {lastMessage && (
            <div
              style={{
                fontSize: 12,
                lineHeight: 1.4,
                color: '#50575e',
                backgroundColor: '#f6f7f7',
                border: '1px solid #dcdcde',
                borderRadius: 2,
                padding: '8px 10px',
              }}
            >
              {lastMessage}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              paddingTop: 4,
            }}
          >
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{
                height: 32,
                padding: '0 12px',
                borderRadius: 2,
                border: '1px solid #dcdcde',
                backgroundColor: '#fff',
                color: '#1e1e1e',
                fontSize: 13,
                cursor: isSubmitting ? 'default' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                height: 32,
                padding: '0 12px',
                borderRadius: 2,
                border: '1px solid #2271b1',
                backgroundColor: '#2271b1',
                color: '#fff',
                fontSize: 13,
                cursor: canSubmit ? 'pointer' : 'default',
                opacity: canSubmit ? 1 : 0.6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {isSubmitting && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              Insert Result
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
