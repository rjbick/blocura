import type { Block } from '../types'
import { BlockRegistry } from '../registry/BlockRegistry'
import { generateClientId } from './generateClientId'
import { getEmbedProviderName } from './resolveEmbed'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function createBlock(
  name: string,
  attributes: Record<string, unknown>,
  innerBlocks: Block[] = [],
  originalContent?: string
): Block {
  return {
    clientId: generateClientId(),
    name,
    attributes,
    innerBlocks,
    ...(originalContent ? { originalContent } : {}),
  }
}

function classListWithout(
  value: string,
  excludes: string[] = [],
  excludePrefixes: string[] = []
): string | undefined {
  const classes = value
    .split(/\s+/)
    .map((v) => v.trim())
    .filter(Boolean)
    .filter((cls) => !excludes.includes(cls))
    .filter((cls) => !excludePrefixes.some((prefix) => cls.startsWith(prefix)))

  return classes.length > 0 ? classes.join(' ') : undefined
}

function toHtmlBlock(html: string): Block[] {
  const trimmed = html.trim()
  if (!trimmed) return []

  if (BlockRegistry.has('core/html')) {
    return [createBlock('core/html', { content: trimmed }, [], trimmed)]
  }

  if (BlockRegistry.has('core/paragraph')) {
    return [createBlock('core/paragraph', { content: escapeHtml(trimmed) }, [])]
  }

  return []
}

function toParagraphBlockFromText(text: string): Block[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  if (BlockRegistry.has('core/paragraph')) {
    return [createBlock('core/paragraph', { content: escapeHtml(trimmed) }, [])]
  }
  return toHtmlBlock(escapeHtml(trimmed))
}

function isListElement(node: Element): node is HTMLOListElement | HTMLUListElement {
  const tag = node.tagName.toLowerCase()
  return tag === 'ol' || tag === 'ul'
}

function parseListItemsFromElement(listEl: HTMLOListElement | HTMLUListElement): Block[] {
  return Array.from(listEl.children)
    .filter((child): child is HTMLLIElement => child.tagName.toLowerCase() === 'li')
    .map((li) => {
      const clone = li.cloneNode(true) as HTMLLIElement
      const nestedListChildren = Array.from(li.children).filter(isListElement)
      Array.from(clone.children).forEach((child) => {
        if (isListElement(child)) child.remove()
      })

      const className = classListWithout(li.className)
      const anchor = li.getAttribute('id') ?? ''

      return createBlock(
        'core/list-item',
        {
          content: clone.innerHTML.trim(),
          ...(className ? { className } : {}),
          ...(anchor ? { anchor } : {}),
        },
        nestedListChildren.map((nested) => createListBlockFromElement(nested))
      )
    })
}

function createListBlockFromElement(listEl: HTMLOListElement | HTMLUListElement): Block {
  const ordered = listEl.tagName.toLowerCase() === 'ol'
  const startAttr = listEl.getAttribute('start')
  const parsedStart = startAttr ? Number(startAttr) : 1
  const className = classListWithout(listEl.className, ['editor-block-list'])
  const anchor = listEl.getAttribute('id') ?? ''

  return createBlock(
    'core/list',
    {
      values: '',
      ordered,
      start: Number.isFinite(parsedStart) && parsedStart > 0 ? parsedStart : 1,
      ...(className ? { className } : {}),
      ...(anchor ? { anchor } : {}),
    },
    parseListItemsFromElement(listEl)
  )
}

function parseImageBlock(node: HTMLElement): Block[] {
  const figure = node.tagName.toLowerCase() === 'figure' ? node : null
  const img = (figure ?? node).querySelector('img') ?? (node.tagName.toLowerCase() === 'img' ? (node as HTMLImageElement) : null)
  if (!img) return toHtmlBlock(node.outerHTML)

  const classes = (figure?.className ?? img.className).split(/\s+/).filter(Boolean)
  const alignClass = classes.find((cls) => cls.startsWith('align'))
  const imageIdClass = classes.find((cls) => /^editor-image-\d+$/.test(cls))
  const parsedId = imageIdClass ? Number(imageIdClass.replace('editor-image-', '')) : undefined
  const className = classListWithout(
    figure?.className ?? img.className,
    ['editor-block-image', imageIdClass ?? ''],
    ['align']
  )

  const caption = figure?.querySelector('figcaption')?.innerHTML ?? ''
  const link = img.closest('a')
  const href = link?.getAttribute('href') ?? ''
  const url = img.getAttribute('src') ?? ''
  const linkDestination = href
    ? href === url
      ? 'media'
      : 'custom'
    : 'none'
  const width = img.getAttribute('width')
  const height = img.getAttribute('height')
  const anchor = figure?.getAttribute('id') ?? img.getAttribute('id') ?? ''

  return [createBlock('core/image', {
    url,
    alt: img.getAttribute('alt') ?? '',
    caption,
    sizeSlug: 'full',
    linkDestination,
    ...(href ? { href } : {}),
    ...(alignClass ? { align: alignClass.replace(/^align/, '') } : {}),
    ...(Number.isFinite(parsedId) ? { id: parsedId } : {}),
    ...(width ? { width: Number(width) } : {}),
    ...(height ? { height: Number(height) } : {}),
    ...(className ? { className } : {}),
    ...(anchor ? { anchor } : {}),
  })]
}

function parseVideoBlock(node: HTMLElement): Block[] {
  const figure = node.tagName.toLowerCase() === 'figure' ? node : null
  const video = (figure ?? node).querySelector('video') ?? (node.tagName.toLowerCase() === 'video' ? (node as HTMLVideoElement) : null)
  if (!video) return toHtmlBlock(node.outerHTML)

  const source = video.querySelector('source')
  const src = video.getAttribute('src') || source?.getAttribute('src') || ''
  if (!src) return toHtmlBlock(node.outerHTML)

  const className = classListWithout(figure?.className ?? '', ['editor-block-video'], ['align'])
  const alignClass = (figure?.className ?? '').split(/\s+/).find((cls) => cls.startsWith('align'))
  const caption = figure?.querySelector('figcaption')?.innerHTML ?? ''
  const anchor = figure?.getAttribute('id') ?? video.getAttribute('id') ?? ''

  return [createBlock('core/video', {
    src,
    caption,
    autoplay: video.hasAttribute('autoplay'),
    loop: video.hasAttribute('loop'),
    muted: video.hasAttribute('muted'),
    controls: video.hasAttribute('controls') || !video.hasAttribute('autoplay'),
    poster: video.getAttribute('poster') ?? '',
    preload: video.getAttribute('preload') ?? 'metadata',
    ...(alignClass ? { align: alignClass.replace(/^align/, '') } : {}),
    ...(className ? { className } : {}),
    ...(anchor ? { anchor } : {}),
  })]
}

function parseAudioBlock(node: HTMLElement): Block[] {
  const figure = node.tagName.toLowerCase() === 'figure' ? node : null
  const audio = (figure ?? node).querySelector('audio') ?? (node.tagName.toLowerCase() === 'audio' ? (node as HTMLAudioElement) : null)
  if (!audio) return toHtmlBlock(node.outerHTML)

  const source = audio.querySelector('source')
  const src = audio.getAttribute('src') || source?.getAttribute('src') || ''
  if (!src) return toHtmlBlock(node.outerHTML)

  const className = classListWithout(figure?.className ?? '', ['editor-block-audio'])
  const caption = figure?.querySelector('figcaption')?.innerHTML ?? ''
  const anchor = figure?.getAttribute('id') ?? audio.getAttribute('id') ?? ''

  return [createBlock('core/audio', {
    src,
    caption,
    autoplay: audio.hasAttribute('autoplay'),
    loop: audio.hasAttribute('loop'),
    controls: audio.hasAttribute('controls') || !audio.hasAttribute('autoplay'),
    preload: audio.getAttribute('preload') ?? 'metadata',
    ...(className ? { className } : {}),
    ...(anchor ? { anchor } : {}),
  })]
}

function parseTableBlock(node: HTMLElement): Block[] {
  const figure = node.tagName.toLowerCase() === 'figure' ? node : null
  const table = (figure ?? node).querySelector('table') ?? (node.tagName.toLowerCase() === 'table' ? (node as HTMLTableElement) : null)
  if (!table) return toHtmlBlock(node.outerHTML)

  const tbody = table.querySelector('tbody')
  const body = tbody
    ? tbody.innerHTML
    : Array.from(table.querySelectorAll('tr')).map((row) => row.outerHTML).join('')

  const caption =
    figure?.querySelector('figcaption')?.innerHTML ??
    table.querySelector('caption')?.innerHTML ??
    ''
  const hasFixedLayout = table.classList.contains('has-fixed-layout')
  const className = classListWithout(figure?.className ?? '', ['editor-block-table'])
  const anchor = figure?.getAttribute('id') ?? table.getAttribute('id') ?? ''

  return [createBlock('core/table', {
    body,
    hasFixedLayout,
    caption,
    ...(className ? { className } : {}),
    ...(anchor ? { anchor } : {}),
  })]
}

function parseEmbedBlock(node: HTMLElement): Block[] {
  const figure = node.tagName.toLowerCase() === 'figure' ? node : null
  const iframe = (figure ?? node).querySelector('iframe') ?? (node.tagName.toLowerCase() === 'iframe' ? (node as HTMLIFrameElement) : null)
  if (!iframe) return toHtmlBlock(node.outerHTML)

  const url = iframe.getAttribute('src') ?? ''
  if (!url) return toHtmlBlock(node.outerHTML)

  const providerNameSlug = getEmbedProviderName(url)
  const type = providerNameSlug === 'youtube' || providerNameSlug === 'vimeo' ? 'video' : 'rich'
  const caption = figure?.querySelector('figcaption')?.innerHTML ?? ''
  const className = classListWithout(
    figure?.className ?? '',
    ['editor-block-embed', `editor-block-embed-${providerNameSlug}`, `is-provider-${providerNameSlug}`]
  )
  const anchor = figure?.getAttribute('id') ?? iframe.getAttribute('id') ?? ''

  return [createBlock('core/embed', {
    url,
    type,
    providerNameSlug,
    previewHtml: iframe.outerHTML,
    caption,
    ...(className ? { className } : {}),
    ...(anchor ? { anchor } : {}),
  })]
}

function parseFileBlock(node: HTMLElement): Block[] {
  const links = Array.from(node.querySelectorAll('a'))
  if (links.length === 0) return toHtmlBlock(node.outerHTML)

  const downloadButton = links.find((link) => link.classList.contains('editor-block-file__button'))
  const mainLink = links.find((link) => link !== downloadButton) ?? links[0]
  if (!mainLink) return toHtmlBlock(node.outerHTML)

  const className = classListWithout(node.className, ['editor-block-file'])
  const anchor = node.getAttribute('id') ?? ''

  return [createBlock('core/file', {
    href: mainLink.getAttribute('href') ?? '',
    filename: (mainLink.textContent ?? '').trim(),
    showDownloadButton: Boolean(downloadButton),
    downloadButtonText: (downloadButton?.textContent ?? 'Download').trim(),
    ...(className ? { className } : {}),
    ...(anchor ? { anchor } : {}),
  })]
}

function parseButtonBlock(node: HTMLElement): Block[] {
  const link = node.querySelector('a') ?? (node.tagName.toLowerCase() === 'a' ? node : null)
  if (!(link instanceof HTMLAnchorElement)) return toHtmlBlock(node.outerHTML)

  const className = classListWithout(node.className, ['editor-block-button'])
  const anchor = node.getAttribute('id') ?? ''

  return [createBlock('core/button', {
    text: link.innerHTML || link.textContent || '',
    url: link.getAttribute('href') ?? '',
    linkTarget: link.getAttribute('target') ?? '',
    rel: link.getAttribute('rel') ?? '',
    ...(className ? { className } : {}),
    ...(anchor ? { anchor } : {}),
  })]
}

function parseButtonsBlock(node: HTMLElement): Block[] {
  const children = Array.from(node.children)
  const innerBlocks = children.flatMap((child) => {
    const el = child as HTMLElement
    if (el.classList.contains('editor-block-button')) return parseButtonBlock(el)
    if (el.tagName.toLowerCase() === 'a') return parseButtonBlock(el)
    return []
  })

  const className = classListWithout(node.className, ['editor-block-buttons'])
  const anchor = node.getAttribute('id') ?? ''

  return [createBlock('core/buttons', {
    ...(className ? { className } : {}),
    ...(anchor ? { anchor } : {}),
  }, innerBlocks)]
}

function parseQuoteBlock(node: HTMLElement): Block[] {
  const figure = node.tagName.toLowerCase() === 'figure' ? node : null
  const quote = (figure ?? node).querySelector('blockquote') ?? (node.tagName.toLowerCase() === 'blockquote' ? node : null)
  if (!quote) return toHtmlBlock(node.outerHTML)

  const value = quote.querySelector('p')?.innerHTML ?? quote.innerHTML
  const citation = quote.querySelector('cite')?.innerHTML ?? ''
  const isPullquote = (figure ?? quote).classList.contains('editor-block-pullquote')

  if (isPullquote) {
    const className = classListWithout(
      figure?.className ?? quote.className,
      ['editor-block-pullquote'],
      ['has-text-align-']
    )
    const alignClass = (figure?.className ?? quote.className).split(/\s+/).find((cls) => cls.startsWith('has-text-align-'))
    const anchor = figure?.getAttribute('id') ?? quote.getAttribute('id') ?? ''
    return [createBlock('core/pullquote', {
      value,
      citation,
      ...(alignClass ? { textAlign: alignClass.replace('has-text-align-', '') } : {}),
      ...(className ? { className } : {}),
      ...(anchor ? { anchor } : {}),
    })]
  }

  const className = classListWithout(quote.className, ['editor-block-quote'])
  const anchor = quote.getAttribute('id') ?? ''
  return [createBlock('core/quote', {
    value,
    citation,
    ...(className ? { className } : {}),
    ...(anchor ? { anchor } : {}),
  })]
}

function parseHeadingBlock(node: HTMLElement): Block[] {
  const level = Number(node.tagName.toLowerCase().replace('h', ''))
  const alignClass = node.className.split(/\s+/).find((cls) => cls.startsWith('has-text-align-'))
  const className = classListWithout(node.className, ['editor-block-heading'], ['has-text-align-'])
  const anchor = node.getAttribute('id') ?? ''
  const textDecoration = node.style.textDecorationLine || node.style.textDecoration

  return [createBlock('core/heading', {
    content: node.innerHTML,
    level: Number.isFinite(level) ? level : 2,
    ...(alignClass ? { align: alignClass.replace('has-text-align-', '') } : {}),
    ...(
      textDecoration === 'underline' || textDecoration === 'line-through'
        ? { style: { typography: { textDecoration } } }
        : {}
    ),
    ...(className ? { className } : {}),
    ...(anchor ? { anchor } : {}),
  })]
}

function parseParagraphBlock(node: HTMLElement): Block[] {
  const alignClass = node.className.split(/\s+/).find((cls) => cls.startsWith('has-text-align-'))
  const className = classListWithout(
    node.className,
    ['editor-block-paragraph', 'has-drop-cap'],
    ['has-text-align-']
  )
  const anchor = node.getAttribute('id') ?? ''

  return [createBlock('core/paragraph', {
    content: node.innerHTML,
    dropCap: node.classList.contains('has-drop-cap'),
    ...(alignClass ? { align: alignClass.replace('has-text-align-', '') } : {}),
    ...(className ? { className } : {}),
    ...(anchor ? { anchor } : {}),
  })]
}

function parsePreBlock(node: HTMLElement): Block[] {
  const code = node.querySelector('code')
  if (code) {
    const content = code.textContent ?? ''
    return [createBlock('core/code', { content })]
  }

  const className = classListWithout(node.className, ['editor-block-preformatted'])
  const anchor = node.getAttribute('id') ?? ''
  return [createBlock('core/preformatted', {
    content: node.innerHTML,
    ...(className ? { className } : {}),
    ...(anchor ? { anchor } : {}),
  })]
}

function parseNavigationLinkBlock(node: HTMLElement): Block[] {
  const link = node.querySelector('a')
  if (!(link instanceof HTMLAnchorElement)) return []

  const className = classListWithout(node.className, ['editor-block-navigation-item'])
  const anchor = node.getAttribute('id') ?? ''

  return [createBlock('core/navigation-link', {
    label: link.innerHTML || link.textContent || '',
    url: link.getAttribute('href') ?? '',
    title: link.getAttribute('title') ?? '',
    rel: link.getAttribute('rel') ?? '',
    opensInNewTab: link.getAttribute('target') === '_blank',
    ...(className ? { className } : {}),
    ...(anchor ? { anchor } : {}),
  })]
}

function parseNavigationBlock(node: HTMLElement): Block[] {
  const list = node.querySelector('ul')
  const innerBlocks = list
    ? Array.from(list.children)
        .filter((child): child is HTMLElement => child.tagName.toLowerCase() === 'li')
        .flatMap((item) => parseNavigationLinkBlock(item))
    : []

  const className = classListWithout(node.className, ['editor-block-navigation', 'is-vertical'])
  const anchor = node.getAttribute('id') ?? ''
  const orientation = node.classList.contains('is-vertical') ? 'vertical' : 'horizontal'

  return [createBlock('core/navigation', {
    orientation,
    ...(className ? { className } : {}),
    ...(anchor ? { anchor } : {}),
  }, innerBlocks)]
}

function parseGroupBlock(node: HTMLElement): Block[] {
  const container = node.querySelector('.editor-block-group__inner-container') as HTMLElement | null
  const source = container ?? node
  const innerBlocks = parseNodesToBlocks(Array.from(source.childNodes))
  const className = classListWithout(node.className, ['editor-block-group'])
  const anchor = node.getAttribute('id') ?? ''
  return [createBlock('core/group', {
    ...(className ? { className } : {}),
    ...(anchor ? { anchor } : {}),
  }, innerBlocks)]
}

function parseColumnBlock(node: HTMLElement): Block[] {
  const innerBlocks = parseNodesToBlocks(Array.from(node.childNodes))
  const className = classListWithout(node.className, ['editor-block-column'])
  const anchor = node.getAttribute('id') ?? ''
  return [createBlock('core/column', {
    ...(className ? { className } : {}),
    ...(anchor ? { anchor } : {}),
  }, innerBlocks)]
}

function parseColumnsBlock(node: HTMLElement): Block[] {
  const columns = Array.from(node.children).filter((child) =>
    (child as HTMLElement).classList?.contains('editor-block-column')
  ) as HTMLElement[]
  const innerBlocks = columns.flatMap((col) => parseColumnBlock(col))
  const className = classListWithout(node.className, ['editor-block-columns'])
  const anchor = node.getAttribute('id') ?? ''
  return [createBlock('core/columns', {
    ...(className ? { className } : {}),
    ...(anchor ? { anchor } : {}),
  }, innerBlocks)]
}

function parseElement(node: HTMLElement): Block[] {
  const tag = node.tagName.toLowerCase()

  if (node.classList.contains('editor-block-group') && BlockRegistry.has('core/group')) {
    return parseGroupBlock(node)
  }
  if (node.classList.contains('editor-block-columns') && BlockRegistry.has('core/columns')) {
    return parseColumnsBlock(node)
  }
  if (node.classList.contains('editor-block-column') && BlockRegistry.has('core/column')) {
    return parseColumnBlock(node)
  }
  if (node.classList.contains('editor-block-buttons') && BlockRegistry.has('core/buttons')) {
    return parseButtonsBlock(node)
  }
  if (node.classList.contains('editor-block-button') && BlockRegistry.has('core/button')) {
    return parseButtonBlock(node)
  }
  if (node.classList.contains('editor-block-file') && BlockRegistry.has('core/file')) {
    return parseFileBlock(node)
  }
  if (node.classList.contains('editor-block-navigation') && BlockRegistry.has('core/navigation')) {
    return parseNavigationBlock(node)
  }
  if (node.classList.contains('editor-block-navigation-item') && BlockRegistry.has('core/navigation-link')) {
    return parseNavigationLinkBlock(node)
  }

  if (tag === 'p' && BlockRegistry.has('core/paragraph')) return parseParagraphBlock(node)
  if (/^h[1-6]$/.test(tag) && BlockRegistry.has('core/heading')) return parseHeadingBlock(node)
  if ((tag === 'ul' || tag === 'ol') && BlockRegistry.has('core/list')) return [createListBlockFromElement(node as HTMLOListElement | HTMLUListElement)]
  if (tag === 'li' && BlockRegistry.has('core/list-item')) {
    const className = classListWithout(node.className)
    const anchor = node.getAttribute('id') ?? ''
    const clone = node.cloneNode(true) as HTMLLIElement
    const nested = Array.from(node.children).filter(isListElement)
    Array.from(clone.children).forEach((child) => {
      if (isListElement(child)) child.remove()
    })
    return [createBlock('core/list-item', {
      content: clone.innerHTML.trim(),
      ...(className ? { className } : {}),
      ...(anchor ? { anchor } : {}),
    }, nested.map((el) => createListBlockFromElement(el)))]
  }
  if (tag === 'blockquote' && BlockRegistry.has('core/quote')) return parseQuoteBlock(node)
  if (tag === 'pre') return parsePreBlock(node)
  if (tag === 'hr' && BlockRegistry.has('core/separator')) return [createBlock('core/separator', {})]
  if (tag === 'img' && BlockRegistry.has('core/image')) return parseImageBlock(node)
  if (tag === 'table' && BlockRegistry.has('core/table')) return parseTableBlock(node)
  if (tag === 'video' && BlockRegistry.has('core/video')) return parseVideoBlock(node)
  if (tag === 'audio' && BlockRegistry.has('core/audio')) return parseAudioBlock(node)
  if (tag === 'iframe' && BlockRegistry.has('core/embed')) return parseEmbedBlock(node)
  if (tag === 'nav' && BlockRegistry.has('core/navigation')) return parseNavigationBlock(node)

  if (tag === 'figure') {
    if (node.querySelector('img') && BlockRegistry.has('core/image')) return parseImageBlock(node)
    if (node.querySelector('video') && BlockRegistry.has('core/video')) return parseVideoBlock(node)
    if (node.querySelector('audio') && BlockRegistry.has('core/audio')) return parseAudioBlock(node)
    if (node.querySelector('table') && BlockRegistry.has('core/table')) return parseTableBlock(node)
    if (node.querySelector('iframe') && BlockRegistry.has('core/embed')) return parseEmbedBlock(node)
    if (node.classList.contains('editor-block-pullquote') && BlockRegistry.has('core/pullquote')) return parseQuoteBlock(node)
  }

  if (tag === 'code' && BlockRegistry.has('core/code')) {
    return [createBlock('core/code', { content: node.textContent ?? '' })]
  }

  return toHtmlBlock(node.outerHTML)
}

function parseNodesToBlocks(nodes: ChildNode[]): Block[] {
  return nodes.flatMap((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ''
      return toParagraphBlockFromText(text)
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return []
    return parseElement(node as HTMLElement)
  })
}

export function parseHtmlToBlocks(html: string): Block[] {
  if (!html || !html.trim()) return []

  const container = document.createElement('div')
  container.innerHTML = html
  return parseNodesToBlocks(Array.from(container.childNodes))
}
