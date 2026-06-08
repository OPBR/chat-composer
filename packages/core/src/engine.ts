import type {
  ComposerConfig,
  ComposerState,
  MentionItem,
  MentionPart,
  MessagePart,
  ComposerPlugin,
} from './types'
import {
  normalizeDOM,
  extractPartsFromDOM,
  createImageNode,
  createFileNode,
  createMentionNode,
  createCodeBlockNode,
} from './dom'
import { createIMETracker } from './ime'
import { createAttachmentManager } from './attachment'
import { looksLikeCode, detectLanguage } from './utils/codeDetection'
import { buildComposedMessage } from './utils/message'
import { resolveMentionSource } from './utils/mention'

const DEFAULT_CONFIG: Required<
  Pick<
    ComposerConfig,
    'placeholder' | 'mentionTrigger' | 'codeDetection' | 'imagePaste' | 'maxLength'
  >
> = {
  placeholder: 'Type a message…',
  mentionTrigger: '@',
  codeDetection: true,
  imagePaste: true,
  maxLength: 32_000,
}

export function createComposerEngine(element: HTMLElement, config: ComposerConfig = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const plugins: ComposerPlugin[] = []
  const ime = createIMETracker()
  const attachmentMgr = createAttachmentManager(cfg.attachments, cfg.onUpload)
  const mentionsMap = new Map<string, MentionPart>()
  const listeners = new Set<(state: ComposerState) => void>()
  let isSubmitting = false
  let isMentionOpen = false
  let mentionQuery = ''
  let mentionItems: MentionItem[] = []

  // ── Sync state ──────────────────────────────────────────────────────────────
  function syncParts(): MessagePart[] {
    normalizeDOM(element)
    return extractPartsFromDOM(
      element,
      new Map(attachmentMgr.getAll().map((a) => [a.id, a])),
      mentionsMap,
    )
  }

  function snapshot(): ComposerState {
    const parts = syncParts()
    return {
      parts,
      attachments: attachmentMgr.getAll(),
      isComposing: ime.isComposing(),
      isMentionOpen,
      mentionQuery,
      mentionItems: [...mentionItems],
      isSubmitting,
      isEmpty:
        parts.length === 0 || parts.every((p) => p.type === 'text' && p.content.trim() === ''),
    }
  }

  function notify() {
    const state = snapshot()
    listeners.forEach((fn) => fn(state))
    cfg.onChange?.(state)
  }

  // ── Mutations ───────────────────────────────────────────────────────────────
  function insertText(text: string) {
    element.focus()
    const sel = window.getSelection()
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0)
      range.deleteContents()
      range.insertNode(document.createTextNode(text))
      range.collapse(false)
    } else {
      element.appendChild(document.createTextNode(text))
    }
    notify()
  }

  function insertMention(item: MentionItem) {
    // Remove the trailing @query text from the editor
    const textContent = element.textContent ?? ''
    const triggerIdx = textContent.lastIndexOf(cfg.mentionTrigger + mentionQuery)
    if (triggerIdx !== -1) {
      // Walk text nodes to find and trim the trigger+query
      for (const node of Array.from(element.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE) {
          const t = node as Text
          const idx = t.textContent?.lastIndexOf(cfg.mentionTrigger + mentionQuery) ?? -1
          if (idx !== -1) {
            t.textContent = t.textContent!.slice(0, idx)
            if (t.textContent === '') element.removeChild(node)
            break
          }
        }
      }
    }

    const mention: MentionPart = {
      type: 'mention',
      id: item.id,
      label: item.label,
      data: item.data,
    }
    mentionsMap.set(item.id, mention)

    const node = createMentionNode(item.id, item.label)
    element.appendChild(node)
    element.appendChild(document.createTextNode(' '))
    closeMention()
    notify()
  }

  function insertCodeBlock(code: string, language?: string) {
    const lang = language ?? detectLanguage(code)
    const id = `cb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
    const node = createCodeBlockNode(id, lang, code)
    element.appendChild(node)
    notify()
  }

  function attachFile(file: File) {
    const part = attachmentMgr.attachFile(file)
    if (!part) return

    if (part.type === 'image') {
      const node = createImageNode(part.id, part.localUrl, part.fileName)
      element.appendChild(node)
    } else {
      const node = createFileNode(part.id, part.fileName, part.sizeBytes)
      element.appendChild(node)
    }
    notify()
  }

  function removeAttachment(id: string) {
    // Remove DOM node
    const domNode = element.querySelector(`[data-cc-id="${id}"]`)
    if (domNode) element.removeChild(domNode)

    // Remove from attachment manager (also revokes object URLs)
    attachmentMgr.removeAttachment(id)
    notify()
  }

  async function uploadAttachment(id: string) {
    await attachmentMgr.uploadAttachment(id)
    // Update image src if remote URL is now available
    const part = attachmentMgr.getById(id)
    if (part?.remoteUrl) {
      const imgEl = element.querySelector(`[data-cc-id="${id}"] img`) as HTMLImageElement | null
      if (imgEl) imgEl.src = part.remoteUrl
    }
    notify()
  }

  function clear() {
    attachmentMgr.clear()
    mentionsMap.clear()
    element.textContent = ''
    isMentionOpen = false
    mentionQuery = ''
    mentionItems = []
    notify()
  }

  // ── Mention ─────────────────────────────────────────────────────────────────
  function openMention(query = '') {
    isMentionOpen = true
    updateMentionQuery(query)
  }

  function closeMention() {
    isMentionOpen = false
    mentionQuery = ''
    mentionItems = []
    notify()
  }

  async function updateMentionQuery(query: string) {
    mentionQuery = query
    if (cfg.mentionSource) {
      mentionItems = await resolveMentionSource(cfg.mentionSource, query)
    }
    notify()
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function submit() {
    if (isSubmitting) return

    let message = buildComposedMessage(syncParts())

    for (const plugin of plugins) {
      if (plugin.onBeforeSubmit) {
        const result = plugin.onBeforeSubmit(message)
        if (result === false) return
        message = result
      }
    }

    isSubmitting = true
    notify()

    try {
      await cfg.onSubmit?.(message)
      clear()
    } finally {
      isSubmitting = false
      notify()
    }
  }

  // ── Plugins ──────────────────────────────────────────────────────────────────
  function use(plugin: ComposerPlugin) {
    plugins.push(plugin)
    plugin.onInit?.(controller)
  }

  // ── Event handlers ───────────────────────────────────────────────────────────
  function onKeyDown(e: KeyboardEvent) {
    // Mention navigation
    if (isMentionOpen) {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMention()
      }
      return
    }

    // Submit on Enter (not Shift+Enter), but not during IME composition
    if (e.key === 'Enter' && !e.shiftKey && !ime.isComposing()) {
      e.preventDefault()
      submit()
    }

    // Backspace/Delete on composer nodes
    if (e.key === 'Backspace' || e.key === 'Delete') {
      handleDeleteKey(e)
    }
  }

  function handleDeleteKey(e: KeyboardEvent) {
    const sel = window.getSelection()
    if (!sel || !sel.anchorNode) return

    // Check if cursor is adjacent to a composer node
    const direction = e.key === 'Backspace' ? 'before' : 'after'
    const anchor = sel.anchorNode

    let adjacentNode: Node | null
    if (direction === 'before') {
      adjacentNode =
        anchor.nodeType === Node.TEXT_NODE
          ? anchor.previousSibling
          : (anchor as HTMLElement).previousElementSibling
    } else {
      adjacentNode =
        anchor.nodeType === Node.TEXT_NODE
          ? anchor.nextSibling
          : (anchor as HTMLElement).nextElementSibling
    }

    if (adjacentNode instanceof HTMLElement && adjacentNode.hasAttribute('data-cc-type')) {
      e.preventDefault()
      const ccId = adjacentNode.getAttribute('data-cc-id') ?? ''
      const ccType = adjacentNode.getAttribute('data-cc-type') ?? ''
      if (ccType === 'image' || ccType === 'file') {
        removeAttachment(ccId)
      } else if (ccType === 'mention') {
        mentionsMap.delete(ccId)
        element.removeChild(adjacentNode)
        notify()
      }
    }
  }

  function onInput() {
    if (ime.isComposing()) return
    // Check for mention trigger
    const text = element.textContent ?? ''
    const triggerIdx = text.lastIndexOf(cfg.mentionTrigger)
    if (triggerIdx !== -1) {
      const query = text.slice(triggerIdx + 1)
      if (!query.includes(' ')) {
        openMention(query)
        return
      }
    }
    if (isMentionOpen) closeMention()
    notify()
  }

  function handlePaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items
    if (!items) return

    // Image paste
    if (cfg.imagePaste) {
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          event.preventDefault()
          const file = item.getAsFile()
          if (file) attachFile(file)
          return
        }
      }
    }

    // Code detection
    if (cfg.codeDetection) {
      const text = event.clipboardData?.getData('text/plain') ?? ''
      if (looksLikeCode(text)) {
        event.preventDefault()
        insertCodeBlock(text)
        return
      }
    }
  }

  // ── Bind events ──────────────────────────────────────────────────────────────
  element.addEventListener('keydown', onKeyDown)
  element.addEventListener('input', onInput)
  element.addEventListener('paste', handlePaste)
  element.addEventListener('compositionstart', () => {
    ime.start()
    notify()
  })
  element.addEventListener('compositionend', () => {
    ime.end()
    notify()
  })

  // ── Destroy ──────────────────────────────────────────────────────────────────
  function destroy() {
    plugins.forEach((p) => p.onDestroy?.())
    element.removeEventListener('keydown', onKeyDown)
    element.removeEventListener('input', onInput)
    element.removeEventListener('paste', handlePaste)
    attachmentMgr.clear()
    mentionsMap.clear()
    listeners.clear()
  }

  const controller = {
    getState: snapshot,
    subscribe(listener: (state: ComposerState) => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    insertText,
    insertMention,
    insertCodeBlock,
    attachFile,
    removeAttachment,
    uploadAttachment,
    clear,
    submit,
    openMention,
    closeMention,
    updateMentionQuery,
    use,
    destroy,
    handlePaste,
  }

  return controller
}
