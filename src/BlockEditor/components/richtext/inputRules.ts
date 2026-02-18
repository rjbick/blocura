import { inputRules, InputRule } from 'prosemirror-inputrules'
import { schema } from './schema'

// Markdown-like input rules
// Note: block-level transforms (## → heading) are handled at the block level
// These are inline transforms within RichText

export function buildInputRulesPlugin() {
  const rules: InputRule[] = [
    // Bold: **text**
    new InputRule(/\*\*([^*]+)\*\*$/, (state, match, start, end) => {
      const { tr } = state
      const text = match[1]
      const bold = schema.marks.bold
      return tr.replaceWith(
        start,
        end,
        schema.text(text, [bold.create()])
      )
    }),

    // Italic: *text* or _text_
    new InputRule(/(?:^|[^*_])(\*|_)([^*_]+)\1$/, (state, match, start, end) => {
      const { tr } = state
      const text = match[2]
      const italic = schema.marks.italic
      return tr.replaceWith(
        start,
        end,
        schema.text(text, [italic.create()])
      )
    }),

    // Code: `text`
    new InputRule(/`([^`]+)`$/, (state, match, start, end) => {
      const { tr } = state
      const text = match[1]
      const code = schema.marks.code
      return tr.replaceWith(
        start,
        end,
        schema.text(text, [code.create()])
      )
    }),
  ]

  return inputRules({ rules })
}
