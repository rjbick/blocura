import { describe, expect, it } from 'vitest'
import { scopeCss, transformEditorStyles, EDITOR_STYLES_SCOPE } from './transformEditorStyles'

const SCOPE = EDITOR_STYLES_SCOPE

describe('scopeCss', () => {
  it('prefixes bare element selectors with the scope', () => {
    expect(scopeCss('h1 { color: red; }', SCOPE)).toBe(`${SCOPE} h1 { color: red; }`)
  })

  it('prefixes every selector in a comma list', () => {
    expect(scopeCss('h1, .hero a { color: red; }', SCOPE)).toBe(
      `${SCOPE} h1, ${SCOPE} .hero a { color: red; }`
    )
  })

  it('maps :root, html, and body onto the scope itself', () => {
    expect(scopeCss(':root { --x: 1; }', SCOPE)).toBe(`${SCOPE} { --x: 1; }`)
    expect(scopeCss('html { font-size: 16px; }', SCOPE)).toBe(`${SCOPE} { font-size: 16px; }`)
    expect(scopeCss('body { margin: 0; }', SCOPE)).toBe(`${SCOPE} { margin: 0; }`)
    expect(scopeCss('html body { margin: 0; }', SCOPE)).toBe(`${SCOPE} { margin: 0; }`)
  })

  it('re-attaches qualifiers from body/html compounds to the scope', () => {
    expect(scopeCss('body.dark { background: #000; }', SCOPE)).toBe(
      `${SCOPE}.dark { background: #000; }`
    )
    expect(scopeCss('body.dark .card { color: #fff; }', SCOPE)).toBe(
      `${SCOPE}.dark .card { color: #fff; }`
    )
  })

  it('leaves selectors already under the scope untouched', () => {
    const css = `${SCOPE} h1 { color: red; }`
    expect(scopeCss(css, SCOPE)).toBe(css)
  })

  it('recurses into conditional group at-rules', () => {
    const result = scopeCss('@media (max-width: 640px) { h1 { font-size: 1rem; } }', SCOPE)
    expect(result).toContain('@media (max-width: 640px) {')
    expect(result).toContain(`${SCOPE} h1 { font-size: 1rem; }`)
  })

  it('passes @keyframes and @font-face through untouched', () => {
    const keyframes = '@keyframes fadeUp { from { opacity: 0; } to { opacity: 1; } }'
    expect(scopeCss(keyframes, SCOPE)).toBe(keyframes)

    const fontFace = "@font-face { font-family: X; src: url('https://fonts.example/x.woff2'); }"
    expect(scopeCss(fontFace, SCOPE)).toBe(fontFace)
  })

  it('passes statement at-rules like @import through untouched', () => {
    const css = "@import url('https://fonts.googleapis.com/css2?family=DM+Sans&display=swap');"
    expect(scopeCss(css, SCOPE)).toBe(css)
  })

  it('strips comments, including ones containing braces', () => {
    expect(scopeCss('/* body { margin: 0 } */ h1 { color: red; }', SCOPE)).toBe(
      `${SCOPE} h1 { color: red; }`
    )
  })

  it('does not split selectors on commas inside parentheses', () => {
    expect(scopeCss(':is(h1, h2) { margin: 0; }', SCOPE)).toBe(
      `${SCOPE} :is(h1, h2) { margin: 0; }`
    )
  })

  it('handles strings containing braces and semicolons', () => {
    const css = 'a::after { content: "};{"; }'
    expect(scopeCss(css, SCOPE)).toBe(`${SCOPE} a::after { content: "};{"; }`)
  })

  it('rewrites relative url() against the base URL', () => {
    const result = scopeCss(
      '.hero { background-image: url("images/boat.jpg"); }',
      SCOPE,
      'https://example.com/pages/'
    )
    expect(result).toContain('url("https://example.com/pages/images/boat.jpg")')
  })

  it('resolves root-relative url() against the base origin', () => {
    const result = scopeCss(
      '.hero { background: url(/uploads/cms/boat.jpg); }',
      SCOPE,
      'https://example.com'
    )
    expect(result).toContain('url(https://example.com/uploads/cms/boat.jpg)')
  })

  it('leaves absolute, data:, and fragment url() untouched', () => {
    const css =
      '.a { background: url(https://cdn.example.com/x.png); } .b { background: url(data:image/gif;base64,R0lGOD); } .c { fill: url(#gradient); }'
    const result = scopeCss(css, SCOPE, 'https://example.com')
    expect(result).toContain('url(https://cdn.example.com/x.png)')
    expect(result).toContain('url(data:image/gif;base64,R0lGOD)')
    expect(result).toContain('url(#gradient)')
  })

  it('returns empty output for empty or whitespace input', () => {
    expect(scopeCss('', SCOPE)).toBe('')
    expect(scopeCss('   \n ', SCOPE)).toBe('')
  })

  it('survives a realistic page stylesheet (fonts + keyframes + hero background)', () => {
    const pageCss = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'DM Sans', sans-serif; background: #fff; color: #1f2937; }
      @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      .fu1 { animation: fadeUp 0.7s ease both; }
      .hero-bg {
        background-image: linear-gradient(to bottom, rgba(10,25,52,.55), rgba(10,25,52,.72)),
          url('https://images.unsplash.com/photo?w=1600');
        background-size: cover;
      }
      @media (max-width: 640px) { .hero-bg { min-height: 320px; } }
    `
    const result = scopeCss(pageCss, SCOPE)

    expect(result).toContain("@import url('https://fonts.googleapis.com/css2?family=DM+Sans")
    expect(result).toContain(`${SCOPE} * { box-sizing: border-box`)
    expect(result).toContain(`${SCOPE} { font-family: 'DM Sans'`)
    expect(result).toContain('@keyframes fadeUp { from { opacity:0;')
    expect(result).toContain(`${SCOPE} .fu1 { animation: fadeUp`)
    expect(result).toContain(`${SCOPE} .hero-bg {`)
    expect(result).toContain('@media (max-width: 640px) {')
    expect(result).toContain(`${SCOPE} .hero-bg { min-height: 320px; }`)
    expect(result).not.toMatch(new RegExp(`@keyframes[^{]*\\{[^}]*${SCOPE.replace('.', '\\.')}`))
  })
})

describe('transformEditorStyles', () => {
  it('returns empty string for missing or empty styles', () => {
    expect(transformEditorStyles(undefined, SCOPE)).toBe('')
    expect(transformEditorStyles([], SCOPE)).toBe('')
  })

  it('transforms css entries and skips assetUrl entries', () => {
    const result = transformEditorStyles(
      [{ css: 'h1 { color: red; }' }, { assetUrl: 'https://example.com/site.css' }],
      SCOPE
    )
    expect(result).toBe(`${SCOPE} h1 { color: red; }`)
  })

  it('applies each entry base URL to its own css', () => {
    const result = transformEditorStyles(
      [{ css: '.a { background: url(x.png); }', baseURL: 'https://example.com/base/' }],
      SCOPE
    )
    expect(result).toContain('url(https://example.com/base/x.png)')
  })
})
