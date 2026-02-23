import type { Block, ImageAsset } from '../types'

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function assetKey(asset: ImageAsset): string {
  return [
    asset.url,
    asset.id ?? '',
    asset.width ?? '',
    asset.height ?? '',
    asset.alt ?? '',
    asset.blockClientId ?? '',
  ].join('|')
}

function pushImage(
  assets: ImageAsset[],
  seen: Set<string>,
  image: ImageAsset
): void {
  const url = normalizeString(image.url)
  if (!url) return

  const normalized: ImageAsset = {
    ...image,
    url,
  }
  const key = assetKey(normalized)
  if (seen.has(key)) return
  seen.add(key)
  assets.push(normalized)
}

function collectFromBlock(
  block: Block,
  assets: ImageAsset[],
  seen: Set<string>
): void {
  const attrs = block.attributes as Record<string, unknown>

  if (block.name === 'core/image') {
    pushImage(assets, seen, {
      url: String(attrs.url ?? ''),
      alt: normalizeString(attrs.alt),
      id: normalizeString(attrs.id) ?? normalizeNumber(attrs.id),
      width: normalizeNumber(attrs.width),
      height: normalizeNumber(attrs.height),
      caption: normalizeString(attrs.caption),
      blockClientId: block.clientId,
      blockName: block.name,
    })
  }

  if (block.name === 'core/gallery' && Array.isArray(attrs.images)) {
    for (const image of attrs.images) {
      if (!image || typeof image !== 'object') continue
      const galleryImage = image as Record<string, unknown>
      pushImage(assets, seen, {
        url: String(galleryImage.url ?? ''),
        alt: normalizeString(galleryImage.alt),
        id: normalizeString(galleryImage.id) ?? normalizeNumber(galleryImage.id),
        width: normalizeNumber(galleryImage.width),
        height: normalizeNumber(galleryImage.height),
        caption: normalizeString(galleryImage.caption),
        blockClientId: block.clientId,
        blockName: block.name,
      })
    }
  }

  if (block.name === 'core/cover') {
    pushImage(assets, seen, {
      url: String(attrs.url ?? ''),
      alt: normalizeString(attrs.alt),
      id: normalizeString(attrs.id) ?? normalizeNumber(attrs.id),
      blockClientId: block.clientId,
      blockName: block.name,
    })
  }

  if (block.name === 'core/media-text' && attrs.mediaType === 'image') {
    pushImage(assets, seen, {
      url: String(attrs.mediaUrl ?? ''),
      alt: normalizeString(attrs.mediaAlt),
      id: normalizeString(attrs.mediaId) ?? normalizeNumber(attrs.mediaId),
      width: normalizeNumber(attrs.mediaWidth),
      height: normalizeNumber(attrs.mediaHeight),
      blockClientId: block.clientId,
      blockName: block.name,
    })
  }

  for (const inner of block.innerBlocks) {
    collectFromBlock(inner, assets, seen)
  }
}

function collectFromRawHtml(
  rawHtml: string | undefined,
  assets: ImageAsset[],
  seen: Set<string>
): void {
  if (!rawHtml || typeof document === 'undefined') return
  const container = document.createElement('div')
  container.innerHTML = rawHtml
  const images = container.querySelectorAll('img[src]')
  for (const img of images) {
    pushImage(assets, seen, {
      url: img.getAttribute('src') ?? '',
      alt: normalizeString(img.getAttribute('alt')),
      width: normalizeNumber(img.getAttribute('width')),
      height: normalizeNumber(img.getAttribute('height')),
    })
  }
}

export function collectImageAssets(blocks: Block[], rawHtml?: string): ImageAsset[] {
  const assets: ImageAsset[] = []
  const seen = new Set<string>()

  for (const block of blocks) {
    collectFromBlock(block, assets, seen)
  }

  collectFromRawHtml(rawHtml, assets, seen)

  return assets
}
