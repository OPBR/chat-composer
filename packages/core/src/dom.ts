import type { AttachmentPart, MessagePart, MentionPart } from './types'

export function normalizeDOM(element: HTMLElement): void {
  // Merge adjacent text nodes
  element.normalize()

  // Convert Chrome-style <div><br></div> to <br>, then clean empty elements
  const children = Array.from(element.childNodes)
  for (const child of children) {
    if (child instanceof HTMLElement) {
      // <div><br></div> → <br>
      if (
        child.tagName === 'DIV' &&
        child.childNodes.length === 1 &&
        child.firstChild instanceof HTMLElement &&
        child.firstChild.tagName === 'BR'
      ) {
        const br = document.createElement('br')
        element.replaceChild(br, child)
        continue
      }

      // Skip composer nodes — they should never be pruned
      if (child.hasAttribute('data-cc-type')) continue

      // Skip <br> — line breaks are meaningful
      if (child.tagName === 'BR') continue

      // Remove truly empty elements (no text, no children)
      if (child.textContent === '' && child.childNodes.length === 0) {
        element.removeChild(child)
      }
    }
  }
}

export function createImageNode(id: string, src: string, fileName: string): HTMLElement {
  const span = document.createElement('span')
  span.className = 'cc-node-image'
  span.setAttribute('contenteditable', 'false')
  span.setAttribute('data-cc-type', 'image')
  span.setAttribute('data-cc-id', id)

  const img = document.createElement('img')
  img.setAttribute('src', src)
  img.setAttribute('alt', fileName)

  const label = document.createElement('span')
  label.className = 'cc-node-image-label'
  label.textContent = fileName

  span.appendChild(img)
  span.appendChild(label)
  return span
}

export function createFileNode(id: string, fileName: string, sizeBytes: number): HTMLElement {
  const span = document.createElement('span')
  span.className = 'cc-node-file'
  span.setAttribute('contenteditable', 'false')
  span.setAttribute('data-cc-type', 'file')
  span.setAttribute('data-cc-id', id)
  span.textContent = `${fileName} (${formatBytes(sizeBytes)})`
  return span
}

export function createCodeBlockNode(id: string, language: string, code: string): HTMLElement {
  const span = document.createElement('span')
  span.className = 'cc-node-code-block'
  span.setAttribute('contenteditable', 'false')
  span.setAttribute('data-cc-type', 'code_block')
  span.setAttribute('data-cc-id', id)
  span.textContent = `${language}\n${code}`
  return span
}

export function createMentionNode(id: string, label: string): HTMLElement {
  const span = document.createElement('span')
  span.className = 'cc-node-mention'
  span.setAttribute('contenteditable', 'false')
  span.setAttribute('data-cc-type', 'mention')
  span.setAttribute('data-cc-id', id)
  span.textContent = label
  return span
}

export function isComposerNode(node: Node): boolean {
  return node instanceof HTMLElement && node.hasAttribute('data-cc-type')
}

export function extractPartsFromDOM(
  element: HTMLElement,
  attachmentsMap: Map<string, AttachmentPart>,
  mentionsMap: Map<string, MentionPart>,
): MessagePart[] {
  const parts: MessagePart[] = []
  let textBuffer = ''

  function flushText() {
    if (textBuffer) {
      parts.push({ type: 'text', content: textBuffer })
      textBuffer = ''
    }
  }

  for (const child of Array.from(element.childNodes)) {
    if (isComposerNode(child)) {
      flushText()
      const el = child as HTMLElement
      const ccType = el.getAttribute('data-cc-type')!
      const ccId = el.getAttribute('data-cc-id')!

      if (ccType === 'mention') {
        const mention = mentionsMap.get(ccId)
        if (mention) parts.push(mention)
      } else if (ccType === 'code_block') {
        // Parse language\ncode from node textContent
        const content = el.textContent ?? ''
        const firstNewline = content.indexOf('\n')
        const language = firstNewline === -1 ? '' : content.slice(0, firstNewline)
        const code = firstNewline === -1 ? content : content.slice(firstNewline + 1)
        parts.push({ type: 'code_block', language, code })
      } else if (ccType === 'image' || ccType === 'file') {
        const attachment = attachmentsMap.get(ccId)
        if (attachment) parts.push(attachment)
      }
      // Unknown composer nodes (not in maps) are silently skipped
    } else if (child.nodeType === Node.TEXT_NODE) {
      textBuffer += (child as Text).textContent ?? ''
    } else if (child instanceof HTMLElement && child.tagName === 'BR') {
      textBuffer += '\n'
    }
    // Other HTML elements (non-composer) — treat their text content as text
    else if (child instanceof HTMLElement && !isComposerNode(child)) {
      textBuffer += child.textContent ?? ''
    }
  }

  flushText()
  return parts
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
