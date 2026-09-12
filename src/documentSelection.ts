import type { Selection } from './documentCommands'

/** UTF-16 offsets used by DOM selections; never place a restored caret inside a surrogate pair. */
export function clampOffset(text: string, offset: number): number {
  let result = Math.max(0, Math.min(text.length, Number.isFinite(offset) ? Math.trunc(offset) : 0))
  if (result > 0 && result < text.length && /[\uD800-\uDBFF]/.test(text[result - 1]) && /[\uDC00-\uDFFF]/.test(text[result])) result--
  return result
}
export function readSelection(root: HTMLElement): Selection | undefined {
  const selection = window.getSelection()
  if (!selection?.anchorNode || !selection.focusNode || !root.contains(selection.anchorNode) || !root.contains(selection.focusNode)) return
  const offset = (node: Node, position: number) => {
    const range = document.createRange()
    range.selectNodeContents(root)
    range.setEnd(node, position)
    return range.toString().length
  }
  const anchor = offset(selection.anchorNode, selection.anchorOffset)
  const focus = offset(selection.focusNode, selection.focusOffset)
  return { start: Math.min(anchor, focus), end: Math.max(anchor, focus), direction: anchor > focus ? 'backward' : 'forward' }
}
export function restoreSelection(root: HTMLElement, selection?: Selection) {
  const text = root.textContent ?? ''
  const start = clampOffset(text, selection?.start ?? 0)
  const end = clampOffset(text, selection?.end ?? start)
  const point = (offset: number): [Node, number] => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const length = node.textContent?.length ?? 0
      if (offset <= length) return [node, offset]
      offset -= length; node = walker.nextNode()
    }
    return [root, root.childNodes.length]
  }
  const [startNode, startOffset] = point(start)
  const [endNode, endOffset] = point(end)
  const backward = selection?.direction === 'backward'
  window.getSelection()?.setBaseAndExtent(backward ? endNode : startNode, backward ? endOffset : startOffset, backward ? startNode : endNode, backward ? startOffset : endOffset)
}
