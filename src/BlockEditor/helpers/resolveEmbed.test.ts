import { describe, expect, it } from 'vitest'
import { getEmbedProviderName, resolveEmbedInput } from './resolveEmbed'

describe('resolveEmbedInput', () => {
  it('resolves standard YouTube watch URLs', () => {
    const result = resolveEmbedInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(result?.providerNameSlug).toBe('youtube')
    expect(result?.type).toBe('video')
    expect(result?.previewHtml).toContain('/embed/dQw4w9WgXcQ')
    expect(result?.previewHtml).toContain('youtube-nocookie.com')
    expect(result?.previewHtml).toContain('allowfullscreen')
  })

  it('resolves YouTube shorts URLs', () => {
    const result = resolveEmbedInput('https://www.youtube.com/shorts/dQw4w9WgXcQ')
    expect(result?.providerNameSlug).toBe('youtube')
    expect(result?.previewHtml).toContain('/embed/dQw4w9WgXcQ')
  })

  it('resolves YouTube embed URLs and youtu.be URLs without protocol', () => {
    const embedUrl = resolveEmbedInput('https://www.youtube.com/embed/dQw4w9WgXcQ')
    expect(embedUrl?.providerNameSlug).toBe('youtube')
    expect(embedUrl?.previewHtml).toContain('/embed/dQw4w9WgXcQ')

    const shortUrl = resolveEmbedInput('youtu.be/dQw4w9WgXcQ')
    expect(shortUrl?.providerNameSlug).toBe('youtube')
    expect(shortUrl?.url.startsWith('https://')).toBe(true)
  })

  it('resolves youtu.be URLs with tracking params', () => {
    const result = resolveEmbedInput('https://youtu.be/JAqB2vx0Kbs?si=kmMDYOOcqn0cdRfi')
    expect(result?.providerNameSlug).toBe('youtube')
    expect(result?.type).toBe('video')
    expect(result?.previewHtml).toContain('/embed/JAqB2vx0Kbs')
  })

  it('resolves Vimeo URLs', () => {
    const result = resolveEmbedInput('https://vimeo.com/12345678')
    expect(result?.providerNameSlug).toBe('vimeo')
    expect(result?.previewHtml).toContain('player.vimeo.com/video/12345678')
  })
})

describe('getEmbedProviderName', () => {
  it('identifies youtube-nocookie hosts as YouTube', () => {
    const provider = getEmbedProviderName('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(provider).toBe('youtube')
  })
})
