import type { Block, BlockAttributeSchema, BlockDefinition } from '../types'
import { BlockRegistry } from '../registry/BlockRegistry'
import { generateClientId } from './generateClientId'
import { validateBlock } from './validateBlock'

const BLOCK_COMMENT_RE =
  /<!--\s+wp:([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?)(?:\s+(\{[\s\S]*?\}))?\s*(\/)?\s*-->|<!--\s+\/wp:([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?)\s+-->/g

interface ParseContext {
  name: string
  attrs: Record<string, unknown>
  contentStart: number
  innerBlocks: Block[]
}

function expandName(name: string): string {
  return name.includes('/') ? name : `core/${name}`
}

function parseCommentAttributes(raw?: string): Record<string, unknown> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    // ignore malformed comment attrs
  }
  return {}
}

function castBySchemaType(value: unknown, schema: BlockAttributeSchema): unknown {
  if (value === undefined || value === null) return undefined

  switch (schema.type) {
    case 'string':
      return String(value)
    case 'number': {
      if (typeof value === 'number') return value
      const n = Number(value)
      return Number.isFinite(n) ? n : undefined
    }
    case 'boolean':
      if (typeof value === 'boolean') return value
      if (value === 'true' || value === '1') return true
      if (value === 'false' || value === '0') return false
      return Boolean(value)
    case 'array':
      if (Array.isArray(value)) return value
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          return Array.isArray(parsed) ? parsed : undefined
        } catch {
          return undefined
        }
      }
      return undefined
    case 'object':
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return value
      }
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
            ? parsed
            : undefined
        } catch {
          return undefined
        }
      }
      return undefined
    case 'null':
      return null
    default:
      return value
  }
}

function extractFromSchema(
  container: HTMLDivElement,
  schema: BlockAttributeSchema
): unknown {
  const source = schema.source
  const selector = schema.selector

  if (!source) return undefined

  const node = selector ? container.querySelector(selector) : container
  if (!node) return undefined

  switch (source) {
    case 'attribute':
      if (!schema.attribute || !(node instanceof Element)) return undefined
      return node.getAttribute(schema.attribute)
    case 'text':
      return node.textContent ?? ''
    case 'html':
    case 'children':
      return node.innerHTML
    default:
      return undefined
  }
}

function setParsedAttribute(
  attrs: Record<string, unknown>,
  commentAttrs: Record<string, unknown>,
  key: string,
  value: unknown,
  force = false
): void {
  if (value === undefined || value === null || value === '') return
  if (key in commentAttrs) return
  if (force) {
    attrs[key] = value
    return
  }
  const existing = attrs[key]
  if (existing === undefined || existing === null || existing === '') {
    attrs[key] = value
  }
}

function applyBlockSpecificExtraction(
  name: string,
  container: HTMLDivElement,
  attrs: Record<string, unknown>,
  commentAttrs: Record<string, unknown>
): void {
  switch (name) {
    case 'core/paragraph': {
      const p = container.querySelector('p')
      setParsedAttribute(attrs, commentAttrs, 'content', p?.innerHTML)
      break
    }
    case 'core/heading': {
      const heading = container.querySelector('h1,h2,h3,h4,h5,h6')
      setParsedAttribute(attrs, commentAttrs, 'content', heading?.innerHTML)
      if (heading) {
        const level = Number(heading.tagName.slice(1))
        if (Number.isFinite(level)) {
          setParsedAttribute(attrs, commentAttrs, 'level', level, true)
        }
      }
      break
    }
    case 'core/list': {
      const list = container.querySelector('ol,ul')
      if (list) {
        const isOrdered = list.tagName.toLowerCase() === 'ol'
        setParsedAttribute(attrs, commentAttrs, 'ordered', isOrdered, true)
        setParsedAttribute(attrs, commentAttrs, 'values', list.innerHTML, true)
        if (isOrdered) {
          const startAttr = list.getAttribute('start')
          const parsedStart = startAttr ? Number(startAttr) : undefined
          if (parsedStart && Number.isFinite(parsedStart)) {
            setParsedAttribute(attrs, commentAttrs, 'start', parsedStart, true)
          }
        }
      }
      break
    }
    case 'core/list-item': {
      const li = container.querySelector('li')
      if (li) {
        const clone = li.cloneNode(true) as HTMLLIElement
        Array.from(clone.children).forEach((child) => {
          const tag = child.tagName.toLowerCase()
          if (tag === 'ol' || tag === 'ul') child.remove()
        })
        setParsedAttribute(attrs, commentAttrs, 'content', clone.innerHTML, true)
      }
      break
    }
    case 'core/image': {
      const figure = container.querySelector('figure')
      const img = container.querySelector('img')
      const link = container.querySelector('a')
      const caption = container.querySelector('figcaption')
      if (img) {
        setParsedAttribute(attrs, commentAttrs, 'url', img.getAttribute('src'))
        setParsedAttribute(attrs, commentAttrs, 'alt', img.getAttribute('alt') ?? '', true)
        const width = img.getAttribute('width')
        const height = img.getAttribute('height')
        if (width) setParsedAttribute(attrs, commentAttrs, 'width', Number(width), true)
        if (height) setParsedAttribute(attrs, commentAttrs, 'height', Number(height), true)
      }
      if (caption) {
        setParsedAttribute(attrs, commentAttrs, 'caption', caption.innerHTML, true)
      }
      if (link) {
        setParsedAttribute(attrs, commentAttrs, 'href', link.getAttribute('href'))
      }
      if (figure instanceof HTMLElement) {
        const classes = figure.className.split(/\s+/).filter(Boolean)
        const alignClass = classes.find((cls) => cls.startsWith('align'))
        if (alignClass) {
          setParsedAttribute(attrs, commentAttrs, 'align', alignClass.replace(/^align/, ''), true)
        }
        const customClasses = classes.filter(
          (cls) => cls !== 'wp-block-image' && !cls.startsWith('align')
        )
        if (customClasses.length > 0) {
          setParsedAttribute(attrs, commentAttrs, 'className', customClasses.join(' '), true)
        }
      }
      break
    }
    case 'core/gallery': {
      const galleryFigure = container.querySelector('figure.wp-block-gallery') as HTMLElement | null
      const classSource = galleryFigure ?? (container.firstElementChild as HTMLElement | null)
      if (classSource) {
        const classes = classSource.className.split(/\s+/).filter(Boolean)
        const columnsClass = classes.find((cls) => /^columns-\d+$/.test(cls))
        if (columnsClass) {
          const parsed = Number(columnsClass.replace('columns-', ''))
          if (Number.isFinite(parsed)) {
            setParsedAttribute(attrs, commentAttrs, 'columns', parsed, true)
          }
        }
        setParsedAttribute(attrs, commentAttrs, 'imageCrop', classes.includes('is-cropped'), true)
      }

      const imageFigures = Array.from(container.querySelectorAll('figure.wp-block-image'))
      const images = imageFigures.length > 0
        ? imageFigures.map((figure) => {
            const img = figure.querySelector('img')
            if (!img) return null
            const caption = figure.querySelector('figcaption')
            return {
              url: img.getAttribute('src') ?? '',
              alt: img.getAttribute('alt') ?? '',
              caption: caption?.innerHTML ?? '',
            }
          }).filter((item): item is { url: string; alt: string; caption: string } => item !== null)
        : Array.from(container.querySelectorAll('img')).map((img) => ({
            url: img.getAttribute('src') ?? '',
            alt: img.getAttribute('alt') ?? '',
            caption: '',
          }))

      if (images.length > 0) {
        setParsedAttribute(attrs, commentAttrs, 'images', images, true)
      }
      break
    }
    case 'core/video': {
      const video = container.querySelector('video')
      const source = video?.querySelector('source')
      const caption = container.querySelector('figcaption')
      const src = video?.getAttribute('src') || source?.getAttribute('src')
      setParsedAttribute(attrs, commentAttrs, 'src', src, true)
      setParsedAttribute(attrs, commentAttrs, 'poster', video?.getAttribute('poster') ?? '', true)
      setParsedAttribute(attrs, commentAttrs, 'preload', video?.getAttribute('preload') ?? 'metadata', true)
      setParsedAttribute(attrs, commentAttrs, 'autoplay', Boolean(video?.hasAttribute('autoplay')), true)
      setParsedAttribute(attrs, commentAttrs, 'loop', Boolean(video?.hasAttribute('loop')), true)
      setParsedAttribute(attrs, commentAttrs, 'muted', Boolean(video?.hasAttribute('muted')), true)
      setParsedAttribute(attrs, commentAttrs, 'controls', Boolean(video?.hasAttribute('controls')), true)
      setParsedAttribute(attrs, commentAttrs, 'caption', caption?.innerHTML ?? '', true)
      break
    }
    case 'core/audio': {
      const audio = container.querySelector('audio')
      const source = audio?.querySelector('source')
      const caption = container.querySelector('figcaption')
      const src = audio?.getAttribute('src') || source?.getAttribute('src')
      setParsedAttribute(attrs, commentAttrs, 'src', src, true)
      setParsedAttribute(attrs, commentAttrs, 'preload', audio?.getAttribute('preload') ?? 'metadata', true)
      setParsedAttribute(attrs, commentAttrs, 'autoplay', Boolean(audio?.hasAttribute('autoplay')), true)
      setParsedAttribute(attrs, commentAttrs, 'loop', Boolean(audio?.hasAttribute('loop')), true)
      setParsedAttribute(attrs, commentAttrs, 'controls', Boolean(audio?.hasAttribute('controls')), true)
      setParsedAttribute(attrs, commentAttrs, 'caption', caption?.innerHTML ?? '', true)
      break
    }
    case 'core/file': {
      const links = Array.from(container.querySelectorAll('a'))
      const downloadButton = links.find((link) => link.classList.contains('wp-block-file__button'))
      const mainLink = links.find((link) => link !== downloadButton) ?? links[0]
      if (mainLink) {
        setParsedAttribute(attrs, commentAttrs, 'href', mainLink.getAttribute('href') ?? '', true)
        setParsedAttribute(attrs, commentAttrs, 'filename', mainLink.textContent ?? '', true)
      }
      setParsedAttribute(attrs, commentAttrs, 'showDownloadButton', Boolean(downloadButton), true)
      if (downloadButton) {
        setParsedAttribute(attrs, commentAttrs, 'downloadButtonText', downloadButton.textContent ?? 'Download', true)
      }
      break
    }
    case 'core/table': {
      const table = container.querySelector('table')
      const tbody = table?.querySelector('tbody')
      const caption = container.querySelector('figcaption, table caption')
      setParsedAttribute(attrs, commentAttrs, 'body', tbody?.innerHTML, true)
      setParsedAttribute(attrs, commentAttrs, 'caption', caption?.innerHTML ?? '', true)
      setParsedAttribute(attrs, commentAttrs, 'hasFixedLayout', table?.classList.contains('has-fixed-layout') ?? false, true)
      break
    }
    case 'core/cover': {
      const cover = container.querySelector('.wp-block-cover') as HTMLElement | null
      const classSource = cover ?? (container.firstElementChild as HTMLElement | null)
      const image = container.querySelector('.wp-block-cover__image-background, img') as HTMLImageElement | null
      const overlay = container.querySelector('.wp-block-cover__background') as HTMLElement | null
      if (image) {
        setParsedAttribute(attrs, commentAttrs, 'url', image.getAttribute('src') ?? '', true)
        setParsedAttribute(attrs, commentAttrs, 'alt', image.getAttribute('alt') ?? '', true)
      }
      if (overlay) {
        const opacity = overlay.style.opacity ? Number(overlay.style.opacity) : undefined
        if (opacity !== undefined && Number.isFinite(opacity)) {
          setParsedAttribute(attrs, commentAttrs, 'dimRatio', Math.round(opacity * 100), true)
        }
        setParsedAttribute(attrs, commentAttrs, 'overlayColor', overlay.style.backgroundColor ?? '', true)
      }
      if (classSource instanceof HTMLElement) {
        const classes = classSource.className.split(/\s+/).filter(Boolean)
        setParsedAttribute(attrs, commentAttrs, 'isDark', classes.includes('is-dark'), true)
        const alignClass = classes.find((cls) => cls.startsWith('align'))
        if (alignClass) {
          setParsedAttribute(attrs, commentAttrs, 'align', alignClass.replace(/^align/, ''), true)
        }
        const minHeight = classSource.style.minHeight
        const parsedHeight = minHeight ? Number(minHeight.replace('px', '')) : undefined
        if (parsedHeight && Number.isFinite(parsedHeight)) {
          setParsedAttribute(attrs, commentAttrs, 'minHeight', parsedHeight, true)
        }
      }
      break
    }
    case 'core/media-text': {
      const mediaText = container.querySelector('.wp-block-media-text') as HTMLElement | null
      const classSource = mediaText ?? (container.firstElementChild as HTMLElement | null)
      const image = container.querySelector('.wp-block-media-text__media img, img') as HTMLImageElement | null
      const video = container.querySelector('.wp-block-media-text__media video, video') as HTMLVideoElement | null
      if (video?.getAttribute('src')) {
        setParsedAttribute(attrs, commentAttrs, 'mediaUrl', video.getAttribute('src') ?? '', true)
        setParsedAttribute(attrs, commentAttrs, 'mediaType', 'video', true)
      } else if (image) {
        setParsedAttribute(attrs, commentAttrs, 'mediaUrl', image.getAttribute('src') ?? '', true)
        setParsedAttribute(attrs, commentAttrs, 'mediaType', 'image', true)
        setParsedAttribute(attrs, commentAttrs, 'mediaAlt', image.getAttribute('alt') ?? '', true)
      }
      if (classSource instanceof HTMLElement) {
        const classes = classSource.className.split(/\s+/).filter(Boolean)
        setParsedAttribute(
          attrs,
          commentAttrs,
          'mediaPosition',
          classes.includes('has-media-on-the-right') ? 'right' : 'left',
          true
        )
        setParsedAttribute(attrs, commentAttrs, 'imageFill', classes.includes('is-image-fill'), true)
        const alignClass = classes.find((cls) => cls.startsWith('align'))
        if (alignClass) {
          setParsedAttribute(attrs, commentAttrs, 'align', alignClass.replace(/^align/, ''), true)
        }
        const style = classSource.getAttribute('style') ?? ''
        const widthMatch = style.match(/grid-template-columns\s*:\s*([0-9.]+)%/i)
        if (widthMatch) {
          const parsedWidth = Number(widthMatch[1])
          if (Number.isFinite(parsedWidth)) {
            setParsedAttribute(attrs, commentAttrs, 'mediaWidth', parsedWidth, true)
          }
        }
      }
      break
    }
    case 'core/embed': {
      const figure = container.querySelector('figure')
      const iframe = container.querySelector('iframe')
      const link = container.querySelector('a')
      const wrapper = container.querySelector('.wp-block-embed__wrapper')
      const caption = container.querySelector('figcaption')
      if (iframe?.getAttribute('src')) {
        setParsedAttribute(attrs, commentAttrs, 'url', iframe.getAttribute('src') ?? '', true)
      } else if (link?.getAttribute('href')) {
        setParsedAttribute(attrs, commentAttrs, 'url', link.getAttribute('href') ?? '', true)
      }
      setParsedAttribute(attrs, commentAttrs, 'previewHtml', wrapper?.innerHTML ?? '', true)
      setParsedAttribute(attrs, commentAttrs, 'caption', caption?.innerHTML ?? '', true)
      if (figure instanceof HTMLElement) {
        const classes = figure.className.split(/\s+/).filter(Boolean)
        const typeClass = classes.find((cls) => cls.startsWith('is-type-'))
        const providerClass = classes.find((cls) => cls.startsWith('is-provider-'))
        if (typeClass) {
          setParsedAttribute(attrs, commentAttrs, 'type', typeClass.replace('is-type-', ''), true)
        }
        if (providerClass) {
          setParsedAttribute(
            attrs,
            commentAttrs,
            'providerNameSlug',
            providerClass.replace('is-provider-', ''),
            true
          )
        }
      }
      break
    }
    case 'core/navigation': {
      const nav = container.querySelector('nav') as HTMLElement | null
      if (nav) {
        const classes = nav.className.split(/\s+/).filter(Boolean)
        setParsedAttribute(attrs, commentAttrs, 'orientation', classes.includes('is-vertical') ? 'vertical' : 'horizontal', true)
        const list = nav.querySelector('.wp-block-navigation__container') as HTMLElement | null
        if (list?.style.justifyContent) {
          const justifyMap: Record<string, string> = {
            'flex-start': 'left',
            center: 'center',
            'flex-end': 'right',
            'space-between': 'space-between',
          }
          setParsedAttribute(
            attrs,
            commentAttrs,
            'justifyContent',
            justifyMap[list.style.justifyContent] ?? 'left',
            true
          )
        }
      }
      break
    }
    case 'core/navigation-link': {
      const link = container.querySelector('a')
      if (link) {
        setParsedAttribute(attrs, commentAttrs, 'label', link.innerHTML, true)
        setParsedAttribute(attrs, commentAttrs, 'url', link.getAttribute('href') ?? '', true)
        setParsedAttribute(attrs, commentAttrs, 'rel', link.getAttribute('rel') ?? '', true)
        setParsedAttribute(attrs, commentAttrs, 'title', link.getAttribute('title') ?? '', true)
        setParsedAttribute(attrs, commentAttrs, 'opensInNewTab', link.getAttribute('target') === '_blank', true)
      }
      break
    }
    case 'core/social-links': {
      const list = container.querySelector('ul')
      if (list) {
        const classes = list.className.split(/\s+/).filter(Boolean)
        const sizeClass = classes.find((cls) => /has-(small|normal|large|huge)-icon-size/.test(cls))
        if (sizeClass) {
          setParsedAttribute(attrs, commentAttrs, 'size', sizeClass, true)
        }
        const iconColorClass = classes.find((cls) => /^has-.*-color$/.test(cls))
        if (iconColorClass) {
          setParsedAttribute(attrs, commentAttrs, 'iconColor', iconColorClass.replace(/^has-/, '').replace(/-color$/, ''), true)
        }
        if (list.getAttribute('style')) {
          const style = list.getAttribute('style') ?? ''
          const colorMatch = style.match(/color\s*:\s*([^;]+)/i)
          if (colorMatch) {
            setParsedAttribute(attrs, commentAttrs, 'iconColorValue', colorMatch[1].trim(), true)
          }
        }
      }
      break
    }
    case 'core/social-link': {
      const link = container.querySelector('a')
      const li = container.querySelector('li')
      if (link) {
        setParsedAttribute(attrs, commentAttrs, 'url', link.getAttribute('href') ?? '', true)
        setParsedAttribute(attrs, commentAttrs, 'label', link.textContent ?? '', true)
        setParsedAttribute(attrs, commentAttrs, 'opensInNewTab', link.getAttribute('target') === '_blank', true)
        setParsedAttribute(attrs, commentAttrs, 'rel', link.getAttribute('rel') ?? '', true)
      }
      if (li) {
        const classes = li.className.split(/\s+/).filter(Boolean)
        const serviceClass = classes.find((cls) => cls.startsWith('wp-social-link-'))
        if (serviceClass) {
          setParsedAttribute(attrs, commentAttrs, 'service', serviceClass.replace('wp-social-link-', ''), true)
        }
      }
      break
    }
    case 'core/details': {
      const details = container.querySelector('details')
      const summary = details?.querySelector('summary')
      setParsedAttribute(attrs, commentAttrs, 'summary', summary?.innerHTML ?? '', true)
      setParsedAttribute(attrs, commentAttrs, 'open', details?.hasAttribute('open') ?? false, true)
      break
    }
    case 'core/read-more': {
      const link = container.querySelector('a')
      setParsedAttribute(attrs, commentAttrs, 'content', link?.innerHTML ?? '', true)
      setParsedAttribute(attrs, commentAttrs, 'url', link?.getAttribute('href') ?? '', true)
      setParsedAttribute(attrs, commentAttrs, 'linkTarget', link?.getAttribute('target') ?? '', true)
      setParsedAttribute(attrs, commentAttrs, 'rel', link?.getAttribute('rel') ?? '', true)
      break
    }
    case 'core/button': {
      const link = container.querySelector('a')
      if (link) {
        setParsedAttribute(attrs, commentAttrs, 'text', link.innerHTML, true)
        setParsedAttribute(attrs, commentAttrs, 'url', link.getAttribute('href') ?? '', true)
        setParsedAttribute(attrs, commentAttrs, 'linkTarget', link.getAttribute('target') ?? '', true)
        setParsedAttribute(attrs, commentAttrs, 'rel', link.getAttribute('rel') ?? '', true)
      }
      break
    }
    case 'core/quote': {
      const paragraph = container.querySelector('blockquote p, p')
      const cite = container.querySelector('blockquote cite, cite')
      setParsedAttribute(attrs, commentAttrs, 'value', paragraph?.innerHTML, true)
      setParsedAttribute(attrs, commentAttrs, 'citation', cite?.innerHTML, true)
      break
    }
    case 'core/pullquote': {
      const paragraph = container.querySelector('blockquote p, p')
      const cite = container.querySelector('blockquote cite, cite')
      setParsedAttribute(attrs, commentAttrs, 'value', paragraph?.innerHTML, true)
      setParsedAttribute(attrs, commentAttrs, 'citation', cite?.innerHTML, true)
      break
    }
    case 'core/preformatted':
    case 'core/verse': {
      const pre = container.querySelector('pre')
      setParsedAttribute(attrs, commentAttrs, 'content', pre?.innerHTML, true)
      break
    }
    case 'core/code': {
      const code = container.querySelector('pre code, code')
      setParsedAttribute(attrs, commentAttrs, 'content', code?.textContent ?? '', true)
      break
    }
    case 'core/html': {
      setParsedAttribute(attrs, commentAttrs, 'content', container.innerHTML, true)
      break
    }
    case 'core/shortcode': {
      const shortcode = container.querySelector('.wp-block-shortcode')
      setParsedAttribute(attrs, commentAttrs, 'text', shortcode?.innerHTML ?? container.innerHTML, true)
      break
    }
    case 'core/classic': {
      const classic = container.querySelector('.wp-block-classic')
      setParsedAttribute(attrs, commentAttrs, 'content', classic?.innerHTML ?? container.innerHTML, true)
      break
    }
    default:
      break
  }
}

function buildAttributes(
  def: BlockDefinition,
  commentAttrs: Record<string, unknown>,
  innerHTML: string
): Record<string, unknown> {
  const attrs: Record<string, unknown> = {}
  for (const [key, schema] of Object.entries(def.attributes)) {
    if (schema.default !== undefined) {
      attrs[key] = schema.default
    }
  }
  Object.assign(attrs, commentAttrs)

  if (!innerHTML.trim()) return attrs

  const container = document.createElement('div')
  container.innerHTML = innerHTML

  for (const [key, schema] of Object.entries(def.attributes)) {
    if (key in commentAttrs) continue
    const extracted = extractFromSchema(container, schema)
    const cast = castBySchemaType(extracted, schema)
    if (cast !== undefined) {
      setParsedAttribute(attrs, commentAttrs, key, cast, true)
    }
  }

  applyBlockSpecificExtraction(def.name, container, attrs, commentAttrs)
  return attrs
}

function isListElement(node: Element): node is HTMLOListElement | HTMLUListElement {
  const tag = node.tagName.toLowerCase()
  return tag === 'ol' || tag === 'ul'
}

function createListBlockFromElement(listEl: HTMLOListElement | HTMLUListElement): Block {
  const ordered = listEl.tagName.toLowerCase() === 'ol'
  const startAttr = listEl.getAttribute('start')
  const parsedStart = startAttr ? Number(startAttr) : 1
  const className = listEl.getAttribute('class') ?? ''
  const anchor = listEl.getAttribute('id') ?? ''

  return {
    clientId: generateClientId(),
    name: 'core/list',
    attributes: {
      values: '',
      ordered,
      start: Number.isFinite(parsedStart) && parsedStart > 0 ? parsedStart : 1,
      ...(className ? { className } : {}),
      ...(anchor ? { anchor } : {}),
    },
    innerBlocks: parseListItemsFromElement(listEl),
  }
}

function parseListItemsFromElement(listEl: HTMLOListElement | HTMLUListElement): Block[] {
  return Array.from(listEl.children)
    .filter((child): child is HTMLLIElement => child.tagName.toLowerCase() === 'li')
    .map((li) => {
      const clone = li.cloneNode(true) as HTMLLIElement
      const nestedLists = Array.from(li.children).filter(isListElement)
      Array.from(clone.children).forEach((child) => {
        if (isListElement(child)) child.remove()
      })

      const className = li.getAttribute('class') ?? ''
      const anchor = li.getAttribute('id') ?? ''

      return {
        clientId: generateClientId(),
        name: 'core/list-item',
        attributes: {
          content: clone.innerHTML.trim(),
          ...(className ? { className } : {}),
          ...(anchor ? { anchor } : {}),
        },
        innerBlocks: nestedLists.map((nested) => createListBlockFromElement(nested)),
      }
    })
}

function deriveInnerBlocksFromMarkup(
  name: string,
  innerHTML: string,
  innerBlocks: Block[]
): Block[] {
  if (innerBlocks.length > 0) return innerBlocks
  if (!innerHTML.trim()) return innerBlocks

  const container = document.createElement('div')
  container.innerHTML = innerHTML

  if (name === 'core/list') {
    const list = container.querySelector('ol,ul')
    if (!list || !isListElement(list)) return innerBlocks
    const parsed = parseListItemsFromElement(list)
    return parsed.length > 0 ? parsed : innerBlocks
  }

  if (name === 'core/navigation') {
    const listContainer =
      container.querySelector('.wp-block-navigation__container') ??
      container.querySelector('nav ul') ??
      container.querySelector('ul')
    if (!listContainer) return innerBlocks
    const parsed = Array.from(listContainer.children)
      .filter((child): child is HTMLLIElement => child.tagName.toLowerCase() === 'li')
      .map((li) => {
        const link = li.querySelector('a')
        const className = li.getAttribute('class') ?? ''
        const anchor = li.getAttribute('id') ?? ''
        return {
          clientId: generateClientId(),
          name: 'core/navigation-link',
          attributes: {
            label: link?.innerHTML ?? '',
            url: link?.getAttribute('href') ?? '',
            title: link?.getAttribute('title') ?? '',
            rel: link?.getAttribute('rel') ?? '',
            opensInNewTab: link?.getAttribute('target') === '_blank',
            ...(className ? { className } : {}),
            ...(anchor ? { anchor } : {}),
          },
          innerBlocks: [],
        } satisfies Block
      })
    return parsed.length > 0 ? parsed : innerBlocks
  }

  if (name === 'core/social-links') {
    const listContainer = container.querySelector('ul')
    if (!listContainer) return innerBlocks
    const parsed = Array.from(listContainer.children)
      .filter((child): child is HTMLLIElement => child.tagName.toLowerCase() === 'li')
      .map((li) => {
        const link = li.querySelector('a')
        const classes = li.className.split(/\s+/).filter(Boolean)
        const serviceClass = classes.find((cls) => cls.startsWith('wp-social-link-'))
        const service = serviceClass ? serviceClass.replace('wp-social-link-', '') : 'link'
        const className = classes
          .filter((cls) => cls !== 'wp-social-link' && !cls.startsWith('wp-social-link-'))
          .join(' ')
        const anchor = li.getAttribute('id') ?? ''
        return {
          clientId: generateClientId(),
          name: 'core/social-link',
          attributes: {
            service,
            url: link?.getAttribute('href') ?? '',
            label: link?.textContent ?? '',
            opensInNewTab: link?.getAttribute('target') === '_blank',
            rel: link?.getAttribute('rel') ?? '',
            ...(className ? { className } : {}),
            ...(anchor ? { anchor } : {}),
          },
          innerBlocks: [],
        } satisfies Block
      })
    return parsed.length > 0 ? parsed : innerBlocks
  }

  if (name === 'core/details') {
    const details = container.querySelector('details')
    if (!details) return innerBlocks
    const clone = details.cloneNode(true) as HTMLDetailsElement
    clone.querySelector('summary')?.remove()
    const contentHtml = clone.innerHTML.trim()
    if (!contentHtml) return innerBlocks
    if (!BlockRegistry.has('core/html')) return innerBlocks
    return [createBlock('core/html', { content: contentHtml }, contentHtml, [])]
  }

  return innerBlocks
}

function createBlock(
  name: string,
  commentAttrs: Record<string, unknown>,
  innerHTML: string,
  innerBlocks: Block[]
): Block {
  const def = BlockRegistry.get(name)
  const originalContent = innerHTML.trim() || undefined

  if (!def) {
    return {
      clientId: generateClientId(),
      name,
      attributes: { ...commentAttrs },
      innerBlocks,
      originalContent,
      isValid: true,
    }
  }

  const normalizedInnerBlocks = deriveInnerBlocksFromMarkup(name, innerHTML, innerBlocks)

  const block: Block = {
    clientId: generateClientId(),
    name,
    attributes: buildAttributes(def, commentAttrs, innerHTML),
    innerBlocks: normalizedInnerBlocks,
    originalContent,
  }

  return {
    ...block,
    isValid: validateBlock(block, def),
  }
}

function pushFreeformBlock(blocks: Block[], html: string): void {
  const trimmed = html.trim()
  if (!trimmed) return
  if (!BlockRegistry.has('core/html')) return
  blocks.push(createBlock('core/html', { content: trimmed }, trimmed, []))
}

export function parseBlockMarkup(markup: string): Block[] {
  if (!markup || !markup.trim()) return []

  const root: Block[] = []
  const stack: ParseContext[] = []
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = BLOCK_COMMENT_RE.exec(markup)) !== null) {
    const tokenStart = match.index
    const tokenEnd = tokenStart + match[0].length

    if (stack.length === 0 && tokenStart > cursor) {
      pushFreeformBlock(root, markup.slice(cursor, tokenStart))
    }

    const openName = match[1]
    const attrsRaw = match[2]
    const isSelfClosing = Boolean(match[3])
    const closeName = match[4]

    if (openName) {
      const name = expandName(openName)
      const attrs = parseCommentAttributes(attrsRaw)
      if (isSelfClosing) {
        const block = createBlock(name, attrs, '', [])
        if (stack.length > 0) {
          stack[stack.length - 1].innerBlocks.push(block)
        } else {
          root.push(block)
        }
      } else {
        stack.push({
          name,
          attrs,
          contentStart: tokenEnd,
          innerBlocks: [],
        })
      }
    } else if (closeName) {
      if (stack.length === 0) {
        cursor = tokenEnd
        continue
      }
      const expected = expandName(closeName)
      const ctx = stack[stack.length - 1]
      if (ctx.name !== expected) {
        cursor = tokenEnd
        continue
      }
      stack.pop()
      const innerHTML = markup.slice(ctx.contentStart, tokenStart)
      const block = createBlock(ctx.name, ctx.attrs, innerHTML, ctx.innerBlocks)
      if (stack.length > 0) {
        stack[stack.length - 1].innerBlocks.push(block)
      } else {
        root.push(block)
      }
    }

    cursor = tokenEnd
  }

  if (stack.length === 0 && cursor < markup.length) {
    pushFreeformBlock(root, markup.slice(cursor))
  }

  while (stack.length > 0) {
    const dangling = stack.pop()!
    const innerHTML = markup.slice(dangling.contentStart)
    const block = createBlock(dangling.name, dangling.attrs, innerHTML, dangling.innerBlocks)
    if (stack.length > 0) {
      stack[stack.length - 1].innerBlocks.push(block)
    } else {
      root.push(block)
    }
  }

  return root
}
