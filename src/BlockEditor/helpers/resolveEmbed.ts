export interface ResolvedEmbed {
  url: string
  type: 'video' | 'rich'
  providerNameSlug: string
  previewHtml: string
}

function coerceUrl(input: string): URL | null {
  const raw = input.trim()
  if (!raw) return null

  const withProtocol = raw.startsWith('//')
    ? `https:${raw}`
    : raw

  try {
    return new URL(withProtocol)
  } catch {
    const looksLikeHostname = /^[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#].*)?$/i.test(withProtocol)
    if (!looksLikeHostname) return null
    try {
      return new URL(`https://${withProtocol}`)
    } catch {
      return null
    }
  }
}

function normalizeHost(url: URL): string {
  return url.hostname
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/^m\./, '')
}

function normalizeYouTubeId(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null
  const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, '')
  if (!sanitized) return null
  return sanitized
}

function extractYouTubeId(url: URL): string | null {
  const host = normalizeHost(url)
  const pathSegments = url.pathname.split('/').filter(Boolean)

  if (host.includes('youtu.be')) {
    return normalizeYouTubeId(pathSegments[0] ?? '')
  }

  if (!host.includes('youtube.com') && !host.includes('youtube-nocookie.com')) {
    return null
  }

  const fromSearch = url.searchParams.get('v') ?? url.searchParams.get('vi')
  if (fromSearch) {
    const normalized = normalizeYouTubeId(fromSearch)
    if (normalized) return normalized
  }

  const markerIndex = pathSegments.findIndex((segment) =>
    segment === 'embed' ||
    segment === 'shorts' ||
    segment === 'live' ||
    segment === 'v'
  )
  if (markerIndex >= 0) {
    const candidate = normalizeYouTubeId(pathSegments[markerIndex + 1] ?? '')
    if (candidate) return candidate
  }

  return null
}

function extractVimeoId(url: URL): string | null {
  const host = normalizeHost(url)
  if (!host.includes('vimeo.com')) return null
  const segments = url.pathname.split('/').filter(Boolean)
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const candidate = segments[index]
    if (/^\d+$/.test(candidate)) return candidate
  }
  return null
}

export function getEmbedProviderName(urlString: string): string {
  const url = coerceUrl(urlString)
  if (!url) return 'url'
  const host = normalizeHost(url)
  if (host.includes('youtube.com') || host.includes('youtube-nocookie.com') || host.includes('youtu.be')) {
    return 'youtube'
  }
  if (host.includes('vimeo.com')) return 'vimeo'
  if (host.includes('spotify.com')) return 'spotify'
  const firstLabel = host.split('.')[0]
  return firstLabel || 'url'
}

export function resolveEmbedInput(urlString: string): ResolvedEmbed | null {
  const url = coerceUrl(urlString)
  if (!url) return null

  const ytId = extractYouTubeId(url)
  if (ytId) {
    return {
      url: url.toString(),
      type: 'video',
      providerNameSlug: 'youtube',
      previewHtml: `<iframe src="https://www.youtube-nocookie.com/embed/${ytId}" title="YouTube embed" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="display:block;width:100%;min-height:315px;aspect-ratio:16/9;border:0"></iframe>`,
    }
  }

  const vimeoId = extractVimeoId(url)
  if (vimeoId) {
    return {
      url: url.toString(),
      type: 'video',
      providerNameSlug: 'vimeo',
      previewHtml: `<iframe src="https://player.vimeo.com/video/${vimeoId}" title="Vimeo embed" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="display:block;width:100%;min-height:315px;aspect-ratio:16/9;border:0"></iframe>`,
    }
  }

  const host = normalizeHost(url)
  if (host.includes('spotify.com')) {
    return {
      url: url.toString(),
      type: 'rich',
      providerNameSlug: 'spotify',
      previewHtml: `<iframe src="${url.toString()}" title="Spotify embed" loading="lazy" style="width:100%;height:352px;border:0"></iframe>`,
    }
  }

  return {
    url: url.toString(),
    type: 'rich',
    providerNameSlug: 'url',
    previewHtml: `<p><a href="${url.toString()}">${url.toString()}</a></p>`,
  }
}
