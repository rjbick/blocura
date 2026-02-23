import { useEffect, useMemo, useRef, useState } from 'react'
import { toggleMark } from 'prosemirror-commands'
import type { EditorView } from 'prosemirror-view'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  ChevronsDown,
  ChevronsUp,
  ChevronDown,
  Code2,
  Copy,
  CornerUpLeft,
  Group,
  Italic,
  Link2,
  List as ListIcon,
  ListOrdered,
  Lock,
  MapPinned,
  MoreVertical,
  PlusSquare,
  RefreshCw,
  Trash2,
  Unlink,
  Underline,
  Unlock,
} from 'lucide-react'
import { useEditorActions, useEditorStore } from '../../store'
import type { Block, BlockDefinition } from '../../types'
import { BlockRegistry } from '../../registry/BlockRegistry'
import { generateClientId } from '../../helpers/generateClientId'
import { blocksToRawHtml } from '../../helpers/blocksToRawHtml'
import { parseHtmlToBlocks } from '../../helpers/parseHtmlToBlocks'
import { cloneBlock } from '../../helpers/cloneBlock'
import { findBlockParent } from '../../helpers/flattenBlocks'
import { schema } from '../richtext/schema'
import { getViewForElement } from '../richtext/viewRegistry'
import { ToolbarButton } from '../toolbar/ToolbarButton'
import { useLinkDialog } from '../link/LinkDialogContext'
import { BlockMover } from './BlockMover'

interface BlockFloatingToolbarProps {
  block: Block
  def: BlockDefinition
  variant?: 'floating' | 'fixed'
  topOffset?: number
}

// Simple transform map: which block types can this block be converted to
const TRANSFORM_TO: Record<string, string[]> = {
  'core/paragraph': [
    'core/heading',
    'core/quote',
    'core/pullquote',
    'core/list',
    'core/code',
    'core/preformatted',
    'core/details',
  ],
  'core/heading': ['core/paragraph', 'core/quote', 'core/list', 'core/code'],
  'core/quote': ['core/paragraph', 'core/heading', 'core/pullquote'],
  'core/pullquote': ['core/quote', 'core/paragraph', 'core/heading'],
  'core/list': ['core/paragraph', 'core/quote', 'core/preformatted'],
  'core/code': ['core/paragraph', 'core/preformatted', 'core/quote'],
  'core/preformatted': ['core/paragraph', 'core/code', 'core/quote'],
  'core/details': ['core/group', 'core/paragraph'],
  'core/group': ['core/details'],
}

const STYLE_ATTRIBUTE_KEYS = [
  'style',
  'textColor',
  'backgroundColor',
  'gradient',
  'fontSize',
  'fontFamily',
  'align',
  'textAlign',
  'className',
] as const

const PROTECTED_BLOCK_CLASSES = new Set(['is-synced-pattern'])

type StyleClipboard = {
  sourceBlockName: string
  attributes: Record<string, unknown>
}

let copiedStyles: StyleClipboard | null = null

const dividerStyle: React.CSSProperties = {
  width: 1,
  height: 24,
  backgroundColor: '#e0e0e0',
  margin: '0 4px',
}

const compactSelectStyle: React.CSSProperties = {
  height: 30,
  border: '1px solid #ddd',
  borderRadius: 2,
  padding: '0 6px',
  fontSize: 12,
  fontFamily: 'var(--editor-font-family)',
  background: '#fff',
  color: '#1e1e1e',
  cursor: 'pointer',
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '8px 12px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--editor-font-family)',
  fontSize: 13,
  color: '#1e1e1e',
  textAlign: 'left',
}

const menuSectionLabelStyle: React.CSSProperties = {
  padding: '6px 12px 4px',
  fontSize: 11,
  fontWeight: 600,
  color: '#757575',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}


function getTextContent(block: Block): string {
  const attrs = block.attributes as Record<string, unknown>
  return (attrs.content as string) ||
    (attrs.value as string) ||
    (attrs.values as string) ||
    ''
}

function getSafeHeadingLevel(raw: unknown): number {
  const level = Number(raw)
  if (!Number.isFinite(level)) return 2
  return Math.min(6, Math.max(1, Math.floor(level)))
}

type TypographyPatch = {
  fontWeight?: string | undefined
  fontStyle?: string | undefined
  textDecoration?: string | undefined
}

function getTypography(attrs: Record<string, unknown>): TypographyPatch {
  const styleObj = attrs.style
  if (!styleObj || typeof styleObj !== 'object') return {}
  const typography = (styleObj as Record<string, unknown>).typography
  if (!typography || typeof typography !== 'object') return {}
  const source = typography as Record<string, unknown>
  return {
    fontWeight: typeof source.fontWeight === 'string' ? source.fontWeight : undefined,
    fontStyle: typeof source.fontStyle === 'string' ? source.fontStyle : undefined,
    textDecoration: typeof source.textDecoration === 'string' ? source.textDecoration : undefined,
  }
}

function withTypography(
  attrs: Record<string, unknown>,
  patch: TypographyPatch
): Record<string, unknown> {
  const styleObj = attrs.style
  const nextStyle = styleObj && typeof styleObj === 'object'
    ? { ...(styleObj as Record<string, unknown>) }
    : {}
  const currentTypography = nextStyle.typography
  const nextTypography = currentTypography && typeof currentTypography === 'object'
    ? { ...(currentTypography as Record<string, unknown>) }
    : {}

  const apply = (key: keyof TypographyPatch) => {
    const value = patch[key]
    if (typeof value === 'string' && value.length > 0) {
      nextTypography[key] = value
    } else {
      delete nextTypography[key]
    }
  }

  apply('fontWeight')
  apply('fontStyle')
  apply('textDecoration')

  if (Object.keys(nextTypography).length > 0) {
    nextStyle.typography = nextTypography
  } else {
    delete nextStyle.typography
  }

  return {
    style: Object.keys(nextStyle).length > 0 ? nextStyle : undefined,
  }
}

function isBoldWeight(weight: string | undefined): boolean {
  if (!weight) return false
  if (weight === 'bold' || weight === 'bolder') return true
  const parsed = Number(weight)
  return Number.isFinite(parsed) && parsed >= 600
}

function hasMark(view: EditorView, markName: 'bold' | 'italic' | 'underline' | 'link'): boolean {
  const markType = schema.marks[markName]
  if (!markType) return false
  const { state } = view
  const { empty, from, to, $from } = state.selection
  if (empty) {
    return Boolean(markType.isInSet(state.storedMarks ?? $from.marks()))
  }
  return state.doc.rangeHasMark(from, to, markType)
}

function getSelectedLinkHref(view: EditorView): string {
  const linkType = schema.marks.link
  if (!linkType) return ''
  const { state } = view
  const { empty, from, to, $from } = state.selection

  if (empty) {
    const mark = linkType.isInSet(state.storedMarks ?? $from.marks())
    return mark ? String((mark.attrs as { href?: unknown }).href ?? '') : ''
  }

  let href = ''
  state.doc.nodesBetween(from, to, (node) => {
    if (href) return false
    const mark = linkType.isInSet(node.marks)
    if (mark) {
      href = String((mark.attrs as { href?: unknown }).href ?? '')
    }
    return undefined
  })
  return href
}

function cloneJsonValue<T>(value: T): T {
  if (value === undefined) return value
  try {
    return JSON.parse(JSON.stringify(value)) as T
  } catch {
    return value
  }
}

function sanitizeUserClassName(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined
  const classes = raw
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((className) => !PROTECTED_BLOCK_CLASSES.has(className))

  return classes.length > 0 ? classes.join(' ') : undefined
}

function extractStyleAttributes(attrs: Record<string, unknown>): Record<string, unknown> {
  const extracted: Record<string, unknown> = {}

  for (const key of STYLE_ATTRIBUTE_KEYS) {
    if (!(key in attrs)) continue

    if (key === 'className') {
      const className = sanitizeUserClassName(attrs.className)
      if (className) extracted.className = className
      continue
    }

    const value = attrs[key]
    if (value === undefined) continue
    extracted[key] = cloneJsonValue(value)
  }

  return extracted
}

function buildStyleResetPatch(attrs: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {}

  for (const key of STYLE_ATTRIBUTE_KEYS) {
    if (!(key in attrs)) continue

    if (key === 'className') {
      const raw = attrs.className
      if (typeof raw !== 'string') {
        patch.className = undefined
        continue
      }

      const preserved = raw
        .split(/\s+/)
        .map((value) => value.trim())
        .filter(Boolean)
        .filter((className) => PROTECTED_BLOCK_CLASSES.has(className))
      patch.className = preserved.length > 0 ? preserved.join(' ') : undefined
      continue
    }

    patch[key] = undefined
  }

  return patch
}

function isAllowedChildInParent(parentName: string | null, childName: string): boolean {
  if (childName === 'core/column') {
    return parentName === 'core/columns'
  }
  if (parentName === 'core/columns') {
    return childName === 'core/column'
  }
  if (parentName === 'core/buttons') {
    return childName === 'core/button'
  }
  if (childName === 'core/list-item') {
    return parentName === 'core/list'
  }
  if (parentName === 'core/list') {
    return childName === 'core/list-item'
  }
  if (childName === 'core/list') {
    return parentName !== 'core/list'
  }
  if (parentName === 'core/list-item') {
    return childName === 'core/list'
  }
  if (childName === 'core/navigation-link') {
    return parentName === 'core/navigation'
  }
  if (parentName === 'core/navigation') {
    return childName === 'core/navigation-link'
  }
  if (childName === 'core/social-link') {
    return parentName === 'core/social-links'
  }
  if (parentName === 'core/social-links') {
    return childName === 'core/social-link'
  }
  return true
}

function areBlocksAllowedInParent(parentName: string | null, blocks: Block[]): boolean {
  return blocks.every((candidate) => isAllowedChildInParent(parentName, candidate.name))
}

export function BlockFloatingToolbar({
  block,
  def,
  variant = 'floating',
  topOffset = 64,
}: BlockFloatingToolbarProps) {
  const openLinkDialog = useLinkDialog()
  const {
    duplicateBlock,
    removeBlock,
    replaceBlock,
    moveBlockUp,
    moveBlockDown,
    moveBlockToPosition,
    insertBlock,
    updateBlockAttributes,
    selectBlock,
    createSuccessNotice,
    createInfoNotice,
    createErrorNotice,
    createWarningNotice,
    toggleListView,
    createSyncedPattern,
    refreshSyncedPatternFromInstance,
    detachSyncedPattern,
  } = useEditorActions()
  const blocks = useEditorStore((state) => state.blocks)
  const listViewOpen = useEditorStore((state) => state.listViewOpen)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<HTMLDivElement>(null)
  const attrs = block.attributes as Record<string, unknown>
  const parentBlock = useMemo(
    () => findBlockParent(blocks, block.clientId),
    [block.clientId, blocks]
  )
  const parentDef = useMemo(
    () => (parentBlock ? BlockRegistry.get(parentBlock.name) : null),
    [parentBlock]
  )
  const syncedPatternId = (block.attributes as Record<string, unknown>)?.syncedPatternId

  const transformTargets = (TRANSFORM_TO[block.name] ?? [])
    .map(name => BlockRegistry.get(name))
    .filter(Boolean) as BlockDefinition[]
  const parentClientId = parentBlock?.clientId ?? null
  const parentName = parentBlock?.name ?? null
  const siblings = parentBlock ? parentBlock.innerBlocks : blocks
  const currentIndex = siblings.findIndex((candidate) => candidate.clientId === block.clientId)
  const rawLock = attrs.lock && typeof attrs.lock === 'object'
    ? (attrs.lock as Record<string, unknown>)
    : {}
  const isMoveLocked = rawLock.move === true || rawLock.remove === true
  const isRemoveLocked = rawLock.remove === true
  const canMove = !isMoveLocked && currentIndex !== -1
  const canMoveUp = canMove && currentIndex > 0
  const canMoveDown = canMove && currentIndex < siblings.length - 1
  const typography = getTypography(attrs)
  const supportsTypography = def.supports.typography !== undefined
  const hasRichTextContent =
    typeof attrs.content === 'string' ||
    typeof attrs.value === 'string' ||
    typeof attrs.text === 'string'
  const directHrefKey = 'href' in attrs
    ? 'href'
    : 'url' in attrs
      ? 'url'
      : null
  const showTypographyControls = supportsTypography || hasRichTextContent || directHrefKey !== null
  const styleAttributes = useMemo(() => extractStyleAttributes(attrs), [attrs])
  const resetStylePatch = useMemo(() => buildStyleResetPatch(attrs), [attrs])
  const hasCopiedStyles = Boolean(copiedStyles && Object.keys(copiedStyles.attributes).length > 0)
  const htmlBlockContent = block.name === 'core/html' && typeof attrs.content === 'string'
    ? attrs.content
    : ''
  const htmlToBlockCandidates = useMemo(
    () => (block.name === 'core/html' ? parseHtmlToBlocks(htmlBlockContent) : []),
    [block.name, htmlBlockContent]
  )
  const canConvertHtmlToBlocks = block.name === 'core/html' &&
    htmlToBlockCandidates.length > 0 &&
    areBlocksAllowedInParent(parentName, htmlToBlockCandidates) &&
    !isRemoveLocked
  const canGroup = block.name !== 'core/group' &&
    isAllowedChildInParent(parentName, 'core/group') &&
    !isRemoveLocked
  const canUngroup = block.name === 'core/group' &&
    block.innerBlocks.length > 0 &&
    areBlocksAllowedInParent(parentName, block.innerBlocks) &&
    !isRemoveLocked
  const canCreateSyncedPattern = !syncedPatternId &&
    isAllowedChildInParent(parentName, 'core/group') &&
    !isRemoveLocked

  const setAttributes = (nextAttrs: Record<string, unknown>) => {
    updateBlockAttributes(block.clientId, nextAttrs)
  }

  const getRichTextViewForBlock = (): EditorView | null => {
    if (typeof window === 'undefined') return null
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer
      const el = container instanceof Element ? container : container.parentElement
      if (el) {
        const owningBlock = el.closest('[data-block]')?.getAttribute('data-block')
        if (owningBlock === block.clientId) {
          const view = getViewForElement(el)
          if (view) return view
        }
      }
    }

    const blockRoot = document.querySelector(`[data-block="${block.clientId}"]`)
    const richTextRoot = blockRoot?.querySelector('[data-richtext]') ?? null
    return getViewForElement(richTextRoot)
  }

  const closeOptions = () => setOptionsOpen(false)

  const insertParagraphAt = (index: number) => {
    const paragraph: Block = {
      clientId: generateClientId(),
      name: 'core/paragraph',
      attributes: { content: '' },
      innerBlocks: [],
    }
    insertBlock(paragraph, parentClientId, index)
    closeOptions()
  }

  const copyCurrentBlock = async () => {
    try {
      const html = blocksToRawHtml([block])
      await navigator.clipboard?.writeText(html)
      createSuccessNotice('Block copied.')
    } catch {
      createErrorNotice('Failed to copy block.')
    } finally {
      closeOptions()
    }
  }

  const toggleBlockLock = () => {
    if (isMoveLocked || isRemoveLocked) {
      setAttributes({ lock: undefined })
      createSuccessNotice('Block unlocked.')
    } else {
      setAttributes({ lock: { move: true, remove: true } })
      createSuccessNotice('Block locked.')
    }
    closeOptions()
  }

  const toggleTypographyMarkOrStyle = (
    markName: 'bold' | 'italic' | 'underline',
    patch: TypographyPatch
  ) => {
    const view = getRichTextViewForBlock()
    if (view && !view.state.selection.empty) {
      const markType = schema.marks[markName]
      if (markType) {
        toggleMark(markType)(view.state, view.dispatch)
        view.focus()
        return
      }
    }

    const nextPatch: TypographyPatch = {}
    if (patch.fontWeight !== undefined) {
      nextPatch.fontWeight = isBoldWeight(typography.fontWeight) ? undefined : patch.fontWeight
    }
    if (patch.fontStyle !== undefined) {
      nextPatch.fontStyle = typography.fontStyle === patch.fontStyle ? undefined : patch.fontStyle
    }
    if (patch.textDecoration !== undefined) {
      nextPatch.textDecoration = typography.textDecoration === patch.textDecoration
        ? undefined
        : patch.textDecoration
    }
    setAttributes(withTypography(attrs, nextPatch))
  }

  const handleHrefAction = async () => {
    if (directHrefKey === 'href' || directHrefKey === 'url') {
      const current = typeof attrs[directHrefKey] === 'string' ? attrs[directHrefKey] as string : ''
      const nextValue = await openLinkDialog({ initialHref: current, title: 'Add link' })
      if (nextValue === null) return
      const href = nextValue.trim()
      const nextAttrs: Record<string, unknown> = {
        [directHrefKey]: href || undefined,
      }
      if (block.name === 'core/image') {
        nextAttrs.linkDestination = href ? 'custom' : 'none'
      }
      setAttributes(nextAttrs)
      createSuccessNotice(href ? 'Link updated.' : 'Link removed.')
      return
    }

    if (!hasRichTextContent) {
      createWarningNotice('This block does not expose a link field.')
      return
    }

    const view = getRichTextViewForBlock()
    if (!view) {
      createWarningNotice('Select text to apply a link.')
      return
    }

    const { from, to, empty } = view.state.selection
    if (empty) {
      createWarningNotice('Select text to apply a link.')
      view.focus()
      return
    }

    const currentHref = getSelectedLinkHref(view)
    const nextValue = await openLinkDialog({ initialHref: currentHref, title: 'Add link' })
    if (nextValue === null) {
      view.focus()
      return
    }
    const href = nextValue.trim()
    const linkType = schema.marks.link
    if (!linkType) {
      createWarningNotice('Links are unavailable for this block.')
      return
    }
    let tr = view.state.tr.removeMark(from, to, linkType)
    if (href) {
      tr = tr.addMark(
        from,
        to,
        linkType.create({ href, target: '_blank', rel: 'noopener noreferrer' })
      )
    }
    view.dispatch(tr)
    view.focus()
    createSuccessNotice(href ? 'Link applied.' : 'Link removed.')
  }

  const copyStyles = () => {
    if (Object.keys(styleAttributes).length === 0) {
      createWarningNotice('No styles found on this block.')
      closeOptions()
      return
    }

    copiedStyles = {
      sourceBlockName: block.name,
      attributes: styleAttributes,
    }
    createSuccessNotice('Styles copied.')
    closeOptions()
  }

  const pasteStyles = () => {
    if (!copiedStyles || Object.keys(copiedStyles.attributes).length === 0) {
      createWarningNotice('No copied styles are available.')
      closeOptions()
      return
    }

    const nextStyles = { ...copiedStyles.attributes }
    if (def.supports.className === false) {
      delete nextStyles.className
    }

    if (Object.keys(nextStyles).length === 0) {
      createWarningNotice('No compatible styles can be pasted to this block.')
      closeOptions()
      return
    }

    setAttributes(nextStyles)
    createSuccessNotice(
      copiedStyles.sourceBlockName === block.name
        ? 'Styles pasted.'
        : 'Styles pasted where compatible.'
    )
    closeOptions()
  }

  const resetStyles = () => {
    if (Object.keys(resetStylePatch).length === 0) {
      createWarningNotice('No custom styles found to reset.')
      closeOptions()
      return
    }

    setAttributes(resetStylePatch)
    createSuccessNotice('Styles reset.')
    closeOptions()
  }

  const moveInListView = () => {
    if (!listViewOpen) {
      toggleListView()
    }
    createInfoNotice('List View opened. Drag the block handle in List View to reposition.')
    closeOptions()
  }

  const groupBlock = () => {
    if (!canGroup) {
      createWarningNotice('This block cannot be grouped in its current location.')
      closeOptions()
      return
    }

    const groupedBlock: Block = {
      clientId: generateClientId(),
      name: 'core/group',
      attributes: {
        tagName: 'div',
      },
      innerBlocks: [cloneBlock(block)],
    }

    replaceBlock(block.clientId, groupedBlock)
    selectBlock(groupedBlock.clientId)
    createSuccessNotice('Block grouped.')
    closeOptions()
  }

  const ungroupBlock = () => {
    if (!canUngroup) {
      createWarningNotice('This group cannot be ungrouped here.')
      closeOptions()
      return
    }

    const nextBlocks = block.innerBlocks.map((inner) => cloneBlock(inner))
    replaceBlock(block.clientId, nextBlocks)
    selectBlock(nextBlocks[0].clientId)
    createSuccessNotice('Group ungrouped.')
    closeOptions()
  }

  const createSyncedPatternFromSelection = () => {
    if (!canCreateSyncedPattern) {
      createWarningNotice('This block cannot be turned into a synced pattern here.')
      closeOptions()
      return
    }

    const patternTitle = `${def.title} pattern`
    const patternId = createSyncedPattern(patternTitle, [block])
    const instance: Block = {
      clientId: generateClientId(),
      name: 'core/group',
      attributes: {
        className: 'is-synced-pattern',
        syncedPatternId: patternId,
        syncedPatternTitle: patternTitle,
      },
      innerBlocks: [cloneBlock(block)],
    }

    replaceBlock(block.clientId, instance)
    selectBlock(instance.clientId)
    createSuccessNotice('Synced pattern created.')
    closeOptions()
  }

  const editAsHtml = () => {
    const rawHtml = blocksToRawHtml([block])
    const htmlBlock: Block = {
      clientId: generateClientId(),
      name: 'core/html',
      attributes: { content: rawHtml },
      innerBlocks: [],
    }

    replaceBlock(block.clientId, htmlBlock)
    selectBlock(htmlBlock.clientId)
    createSuccessNotice('Switched to HTML editing.')
    closeOptions()
  }

  const convertHtmlToBlocks = () => {
    if (!canConvertHtmlToBlocks) {
      createWarningNotice('This HTML cannot be converted into blocks in the current location.')
      closeOptions()
      return
    }

    replaceBlock(block.clientId, htmlToBlockCandidates)
    selectBlock(htmlToBlockCandidates[0].clientId)
    createSuccessNotice('Converted HTML to blocks.')
    closeOptions()
  }

  const menuAction = (
    action: () => void,
    options?: {
      disabled?: boolean
      closeMenu?: boolean
    }
  ) => {
    if (options?.disabled) {
      createWarningNotice('This action is unavailable for the selected block.')
      return
    }
    action()
    if (options?.closeMenu !== false) {
      closeOptions()
    }
  }

  const getMenuButtonStyle = (options?: { danger?: boolean; disabled?: boolean }): React.CSSProperties => ({
    ...menuItemStyle,
    color: options?.danger ? '#b32d2e' : '#1e1e1e',
    opacity: options?.disabled ? 0.45 : 1,
    cursor: options?.disabled ? 'default' : 'pointer',
  })

  const renderAlignmentControls = (
    attrKey: 'align' | 'textAlign',
    value: unknown
  ) => {
    const current = typeof value === 'string' ? value : ''
    return (
      <div style={{ display: 'flex', alignItems: 'center', paddingInline: 2 }}>
        <ToolbarButton
          icon={<AlignLeft size={16} />}
          tooltip="Align left"
          size="sm"
          isActive={current === '' || current === 'left'}
          onClick={() => setAttributes({ [attrKey]: 'left' } as Record<string, unknown>)}
        />
        <ToolbarButton
          icon={<AlignCenter size={16} />}
          tooltip="Align center"
          size="sm"
          isActive={current === 'center'}
          onClick={() => setAttributes({ [attrKey]: 'center' } as Record<string, unknown>)}
        />
        <ToolbarButton
          icon={<AlignRight size={16} />}
          tooltip="Align right"
          size="sm"
          isActive={current === 'right'}
          onClick={() => setAttributes({ [attrKey]: 'right' } as Record<string, unknown>)}
        />
      </div>
    )
  }

  const renderTypographyControls = () => {
    if (!showTypographyControls) return null

    const view = getRichTextViewForBlock()
    const boldActive = view ? hasMark(view, 'bold') : isBoldWeight(typography.fontWeight)
    const italicActive = view ? hasMark(view, 'italic') : typography.fontStyle === 'italic'
    const underlineActive = view ? hasMark(view, 'underline') : typography.textDecoration === 'underline'
    const hrefActive = view ? hasMark(view, 'link') : Boolean(directHrefKey && attrs[directHrefKey])

    return (
      <div style={{ display: 'flex', alignItems: 'center', paddingInline: 2 }}>
        {(supportsTypography || hasRichTextContent) && (
          <>
            <ToolbarButton
              icon={<Bold size={16} />}
              tooltip="Bold"
              size="sm"
              isActive={boldActive}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleTypographyMarkOrStyle('bold', { fontWeight: '700' })}
            />
            <ToolbarButton
              icon={<Italic size={16} />}
              tooltip="Italic"
              size="sm"
              isActive={italicActive}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleTypographyMarkOrStyle('italic', { fontStyle: 'italic' })}
            />
            <ToolbarButton
              icon={<Underline size={16} />}
              tooltip="Underline"
              size="sm"
              isActive={underlineActive}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleTypographyMarkOrStyle('underline', { textDecoration: 'underline' })}
            />
          </>
        )}

        <ToolbarButton
          icon={<Link2 size={16} />}
          tooltip="Edit href"
          size="sm"
          isActive={hrefActive}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            void handleHrefAction()
          }}
        />
      </div>
    )
  }

  const renderQuickControls = () => {
    const typographyControls = renderTypographyControls()

    if (block.name === 'core/heading') {
      const level = getSafeHeadingLevel(attrs.level)

      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingInline: 2 }}>
          <select
            aria-label="Heading level"
            value={String(level)}
            onChange={(e) => {
              setAttributes({ level: getSafeHeadingLevel(Number(e.target.value) || 2) })
            }}
            style={compactSelectStyle}
          >
            <option value="1">H1</option>
            <option value="2">H2</option>
            <option value="3">H3</option>
            <option value="4">H4</option>
            <option value="5">H5</option>
            <option value="6">H6</option>
          </select>

          {renderAlignmentControls('align', attrs.align)}
          {typographyControls}
        </div>
      )
    }

    if (block.name === 'core/paragraph') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingInline: 2 }}>
          {renderAlignmentControls('align', attrs.align)}
          {typographyControls}
        </div>
      )
    }

    if (block.name === 'core/list') {
      const ordered = attrs.ordered === true
      return (
        <div style={{ display: 'flex', alignItems: 'center', paddingInline: 2 }}>
          <ToolbarButton
            icon={<ListIcon size={16} />}
            tooltip="Bulleted list"
            size="sm"
            isActive={!ordered}
            onClick={() => setAttributes({ ordered: false })}
          />
          <ToolbarButton
            icon={<ListOrdered size={16} />}
            tooltip="Numbered list"
            size="sm"
            isActive={ordered}
            onClick={() =>
              setAttributes({
                ordered: true,
                start:
                  typeof attrs.start === 'number' && attrs.start > 0
                    ? attrs.start
                    : 1,
              })
            }
          />
        </div>
      )
    }

    if (block.name === 'core/image') {
      return renderAlignmentControls('align', attrs.align)
    }

    if (block.name === 'core/pullquote' || block.name === 'core/verse') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingInline: 2 }}>
          {renderAlignmentControls('textAlign', attrs.textAlign)}
          {typographyControls}
        </div>
      )
    }

    return typographyControls
  }

  const quickControls = renderQuickControls()

  function transformTo(targetDef: BlockDefinition) {
    const text = getTextContent(block)
    const newAttrs: Record<string, unknown> = {}

    // Map common text content
    if (targetDef.name === 'core/heading') {
      newAttrs.content = text
      newAttrs.level = 2
    } else if (targetDef.name === 'core/paragraph') {
      newAttrs.content = text
    } else if (targetDef.name === 'core/quote') {
      newAttrs.value = text
      newAttrs.citation = ''
    } else if (targetDef.name === 'core/list') {
      newAttrs.values = `<li>${text}</li>`
      newAttrs.ordered = false
    } else if (targetDef.name === 'core/code' || targetDef.name === 'core/preformatted') {
      newAttrs.content = text
    } else {
      // Generic: copy all attributes over
      Object.assign(newAttrs, block.attributes)
    }

    replaceBlock(block.clientId, {
      clientId: generateClientId(),
      name: targetDef.name,
      attributes: newAttrs,
      innerBlocks: [],
    })
    setSwitcherOpen(false)
  }

  useEffect(() => {
    if (!switcherOpen) return

    const onPointerDown = (event: PointerEvent) => {
      if (!switcherRef.current) return
      if (switcherRef.current.contains(event.target as Node)) return
      setSwitcherOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [switcherOpen])

  useEffect(() => {
    if (!optionsOpen) return

    const onPointerDown = (event: PointerEvent) => {
      if (!optionsRef.current) return
      if (optionsRef.current.contains(event.target as Node)) return
      setOptionsOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [optionsOpen])

  return (
    <>
      <div
        contentEditable={false}
        suppressContentEditableWarning
        style={{
          position: variant === 'fixed' ? 'fixed' : 'absolute',
          top: variant === 'fixed' ? topOffset : -46,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: variant === 'fixed' ? 120 : 20,
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#fff',
          borderRadius: 2,
          boxShadow: 'var(--editor-popover-shadow)',
          padding: '0 4px',
          height: 40,
          gap: 0,
          whiteSpace: 'nowrap',
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
      {/* Block type switcher button */}
      <div ref={switcherRef} style={{ position: 'relative' }}>
        <button
          type="button"
          aria-label={`${def.title} block type`}
          onClick={() => setSwitcherOpen(v => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            height: 40,
            padding: '0 8px',
            border: 'none',
            borderRight: '1px solid #e0e0e0',
            background: 'transparent',
            cursor: transformTargets.length > 0 ? 'pointer' : 'default',
            fontFamily: 'var(--editor-font-family)',
            fontSize: 11,
            color: '#757575',
          }}
        >
          {def.title}
          {transformTargets.length > 0 && <ChevronDown size={12} />}
        </button>

        {/* Switcher popover */}
        {switcherOpen && transformTargets.length > 0 && (
          <div
            className="editor-popover-content"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              backgroundColor: '#fff',
              borderRadius: 4,
              boxShadow: 'var(--editor-popover-shadow)',
              minWidth: 160,
              padding: '4px 0',
              zIndex: 30,
            }}
          >
            {transformTargets.map(targetDef => (
              <button
                className="block-transform-item"
                key={targetDef.name}
                type="button"
                onClick={() => transformTo(targetDef)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--editor-font-family)',
                  fontSize: 13,
                  color: '#1e1e1e',
                  textAlign: 'left',
                }}
              >
                <span style={{ width: 20, height: 20, flexShrink: 0, color: '#757575', display: 'flex', alignItems: 'center' }}>
                  {typeof targetDef.icon !== 'string' ? targetDef.icon : null}
                </span>
                {targetDef.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {parentBlock && (
        <>
          <ToolbarButton
            icon={<CornerUpLeft size={18} />}
            tooltip={`Select parent block${parentDef ? ` (${parentDef.title})` : ''}`}
            onClick={() => selectBlock(parentBlock.clientId)}
          />
          <div style={dividerStyle} />
        </>
      )}

      {/* Mover buttons */}
      <BlockMover clientId={block.clientId} />

      {quickControls && (
        <>
          <div style={dividerStyle} />
          {quickControls}
        </>
      )}

      <div style={dividerStyle} />

      <div ref={optionsRef} style={{ position: 'relative' }}>
        <button
          type="button"
          aria-label="Block options"
          onClick={() => setOptionsOpen(v => !v)}
          style={{
            width: 36,
            height: 36,
            minWidth: 36,
            border: 'none',
            borderRadius: 2,
            background: optionsOpen ? 'rgba(56,88,233,0.1)' : 'transparent',
            color: optionsOpen ? 'var(--editor-components-color-accent)' : '#1e1e1e',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <MoreVertical size={18} />
        </button>

        {optionsOpen && (
          <div
            role="menu"
            className="editor-popover-content"
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 4,
              minWidth: 210,
              backgroundColor: '#fff',
              borderRadius: 4,
              boxShadow: 'var(--editor-popover-shadow)',
              padding: '4px 0',
              zIndex: 1000,
            }}
          >
            <div style={menuSectionLabelStyle}>Insert</div>
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                menuAction(() => insertParagraphAt(Math.max(currentIndex, 0)))
              }
              style={getMenuButtonStyle({ disabled: currentIndex === -1 })}
              className="editor-dropdown-item"
            >
              <PlusSquare size={14} />
              <span>Insert before</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() =>
                menuAction(() => insertParagraphAt(Math.max(currentIndex, 0) + 1))
              }
              style={getMenuButtonStyle({ disabled: currentIndex === -1 })}
              className="editor-dropdown-item"
            >
              <PlusSquare size={14} />
              <span>Insert after</span>
            </button>

            <div style={{ height: 1, backgroundColor: '#e0e0e0', margin: '4px 0' }} />
            <div style={menuSectionLabelStyle}>Styles</div>
            <button
              type="button"
              role="menuitem"
              onClick={() => menuAction(copyStyles, { disabled: Object.keys(styleAttributes).length === 0 })}
              style={getMenuButtonStyle({ disabled: Object.keys(styleAttributes).length === 0 })}
              className="editor-dropdown-item"
            >
              <Copy size={14} />
              <span>Copy styles</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => menuAction(pasteStyles, { disabled: !hasCopiedStyles })}
              style={getMenuButtonStyle({ disabled: !hasCopiedStyles })}
              className="editor-dropdown-item"
            >
              <Copy size={14} />
              <span>Paste styles</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => menuAction(resetStyles, { disabled: Object.keys(resetStylePatch).length === 0 })}
              style={getMenuButtonStyle({ disabled: Object.keys(resetStylePatch).length === 0 })}
              className="editor-dropdown-item"
            >
              <RefreshCw size={14} />
              <span>Reset styles</span>
            </button>

            <div style={{ height: 1, backgroundColor: '#e0e0e0', margin: '4px 0' }} />
            <div style={menuSectionLabelStyle}>Move</div>
            <button
              type="button"
              role="menuitem"
              onClick={() => menuAction(() => moveBlockUp(block.clientId), { disabled: !canMoveUp })}
              style={getMenuButtonStyle({ disabled: !canMoveUp })}
              className="editor-dropdown-item"
            >
              <ArrowUp size={14} />
              <span>Move up</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => menuAction(() => moveBlockDown(block.clientId), { disabled: !canMoveDown })}
              style={getMenuButtonStyle({ disabled: !canMoveDown })}
              className="editor-dropdown-item"
            >
              <ArrowDown size={14} />
              <span>Move down</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() =>
                menuAction(
                  () => moveBlockToPosition(block.clientId, parentClientId, parentClientId, 0),
                  { disabled: !canMoveUp }
                )
              }
              style={getMenuButtonStyle({ disabled: !canMoveUp })}
              className="editor-dropdown-item"
            >
              <ChevronsUp size={14} />
              <span>Move to top</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() =>
                menuAction(
                  () =>
                    moveBlockToPosition(
                      block.clientId,
                      parentClientId,
                      parentClientId,
                      siblings.length
                    ),
                  { disabled: !canMoveDown }
                )
              }
              style={getMenuButtonStyle({ disabled: !canMoveDown })}
              className="editor-dropdown-item"
            >
              <ChevronsDown size={14} />
              <span>Move to bottom</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => menuAction(moveInListView)}
              style={getMenuButtonStyle()}
              className="editor-dropdown-item"
            >
              <MapPinned size={14} />
              <span>Move to…</span>
            </button>

            <div style={{ height: 1, backgroundColor: '#e0e0e0', margin: '4px 0' }} />
            <div style={menuSectionLabelStyle}>Actions</div>
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                void copyCurrentBlock()
              }
              style={getMenuButtonStyle()}
              className="editor-dropdown-item"
            >
              <Copy size={14} />
              <span>Copy</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() =>
                menuAction(() => duplicateBlock(block.clientId))
              }
              style={getMenuButtonStyle()}
              className="editor-dropdown-item"
            >
              <Copy size={14} />
              <span>Duplicate</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() =>
                menuAction(
                  block.name === 'core/group' ? ungroupBlock : groupBlock,
                  { disabled: block.name === 'core/group' ? !canUngroup : !canGroup }
                )
              }
              style={getMenuButtonStyle({ disabled: block.name === 'core/group' ? !canUngroup : !canGroup })}
              className="editor-dropdown-item"
            >
              <Group size={14} />
              <span>{block.name === 'core/group' ? 'Ungroup' : 'Group'}</span>
            </button>

            {(typeof syncedPatternId !== 'string' || syncedPatternId.length === 0) && (
              <button
                type="button"
                role="menuitem"
                onClick={() => menuAction(createSyncedPatternFromSelection, { disabled: !canCreateSyncedPattern })}
                style={getMenuButtonStyle({ disabled: !canCreateSyncedPattern })}
                className="editor-dropdown-item"
              >
                <RefreshCw size={14} />
                <span>Create synced pattern</span>
              </button>
            )}

            {block.name !== 'core/html' && (
              <button
                type="button"
                role="menuitem"
                onClick={() => menuAction(editAsHtml, { disabled: def.supports.html === false || isRemoveLocked })}
                style={getMenuButtonStyle({ disabled: def.supports.html === false || isRemoveLocked })}
                className="editor-dropdown-item"
              >
                <Code2 size={14} />
                <span>Edit as HTML</span>
              </button>
            )}

            {block.name === 'core/html' && (
              <button
                type="button"
                role="menuitem"
                onClick={() => menuAction(convertHtmlToBlocks, { disabled: !canConvertHtmlToBlocks })}
                style={getMenuButtonStyle({ disabled: !canConvertHtmlToBlocks })}
                className="editor-dropdown-item"
              >
                <Code2 size={14} />
                <span>Convert to blocks</span>
              </button>
            )}

            {typeof syncedPatternId === 'string' && syncedPatternId.length > 0 && (
              <>
                <div style={{ height: 1, backgroundColor: '#e0e0e0', margin: '4px 0' }} />
                <div style={menuSectionLabelStyle}>Synced pattern</div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() =>
                    menuAction(() => refreshSyncedPatternFromInstance(block.clientId))
                  }
                  style={getMenuButtonStyle()}
                  className="editor-dropdown-item"
                >
                  <RefreshCw size={14} />
                  <span>Update synced pattern</span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() =>
                    menuAction(() => detachSyncedPattern(block.clientId))
                  }
                  style={getMenuButtonStyle()}
                  className="editor-dropdown-item"
                >
                  <Unlink size={14} />
                  <span>Detach synced pattern</span>
                </button>
              </>
            )}

            <div style={{ height: 1, backgroundColor: '#e0e0e0', margin: '4px 0' }} />
            <div style={menuSectionLabelStyle}>Settings</div>
            <button
              type="button"
              role="menuitem"
              onClick={toggleBlockLock}
              style={getMenuButtonStyle()}
              className="editor-dropdown-item"
            >
              {isMoveLocked || isRemoveLocked ? <Unlock size={14} /> : <Lock size={14} />}
              <span>{isMoveLocked || isRemoveLocked ? 'Unlock block' : 'Lock block'}</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => menuAction(() => removeBlock(block.clientId), { disabled: isRemoveLocked })}
              style={getMenuButtonStyle({ danger: true, disabled: isRemoveLocked })}
              className="editor-dropdown-item"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
      </div>
    </>
  )
}
