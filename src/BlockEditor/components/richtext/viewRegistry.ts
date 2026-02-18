/**
 * Module-level registry mapping DOM elements to their ProseMirror EditorViews.
 * This lets the FormatToolbar find the active view without prop-threading.
 */
import type { EditorView } from 'prosemirror-view'

const registry = new WeakMap<Element, EditorView>()

export function registerView(el: Element, view: EditorView): void {
  registry.set(el, view)
}

export function unregisterView(el: Element): void {
  registry.delete(el)
}

/**
 * Walk up from `el` to find a registered ProseMirror view.
 */
export function getViewForElement(el: Element | null): EditorView | null {
  let node: Element | null = el
  while (node) {
    const view = registry.get(node)
    if (view) return view
    node = node.parentElement
  }
  return null
}
