import type {
  ComposerConfig,
  ComposerController,
  ComposerPlugin,
  ComposerState,
  MentionItem,
  MessagePart,
  ImagePart,
  FilePart,
  AttachmentPart,
  CodeBlockPart,
  MentionPart,
  TextPart,
} from './types'
import { detectLanguage, looksLikeCode } from './utils/codeDetection'
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

function generateId(): string {
  return `cc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function createComposer(config: ComposerConfig = {}): ComposerController {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const plugins: ComposerPlugin[] = []
  const listeners = new Set<(state: ComposerState) => void>()

  // ── Internal state ──────────────────────────────────────────────────────────
  let parts: MessagePart[] = []
  let isComposing = false
  let isMentionOpen = false
  let mentionQuery = ''
  let mentionItems: MentionItem[] = []
  let isSubmitting = false

  // ── State helpers ───────────────────────────────────────────────────────────
  function snapshot(): ComposerState {
    const attachments: AttachmentPart[] = parts.filter(
      (p) => p.type === 'image' || p.type === 'file',
    ) as AttachmentPart[]
    return {
      parts: [...parts],
      attachments,
      isComposing,
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
    const last = parts[parts.length - 1]
    if (last?.type === 'text') {
      ;(last as TextPart).content += text
    } else {
      parts.push({ type: 'text', content: text })
    }
    notify()
  }

  function insertMention(item: MentionItem) {
    // Remove the trailing @query from the last text part
    const last = parts[parts.length - 1]
    if (last?.type === 'text') {
      const t = last as TextPart
      const idx = t.content.lastIndexOf(cfg.mentionTrigger + mentionQuery)
      if (idx !== -1) t.content = t.content.slice(0, idx)
      if (t.content === '') parts.pop()
    }

    const mention: MentionPart = {
      type: 'mention',
      id: item.id,
      label: item.label,
      data: item.data,
    }
    parts.push(mention)
    // Insert a space after mention so user can keep typing
    parts.push({ type: 'text', content: ' ' })
    closeMention()
    notify()
  }

  function insertCodeBlock(code: string, language?: string) {
    const lang = language ?? detectLanguage(code)
    const block: CodeBlockPart = { type: 'code_block', language: lang, code }
    parts.push(block)
    notify()
  }

  function attachFile(file: File) {
    const {
      maxFiles = 10,
      maxFileSizeBytes = 10 * 1024 * 1024,
      accept,
      onReject,
    } = cfg.attachments ?? {}

    const attachments = parts.filter((p) => p.type === 'image' || p.type === 'file')
    if (attachments.length >= maxFiles) {
      onReject?.('count', file)
      return
    }
    if (file.size > maxFileSizeBytes) {
      onReject?.('size', file)
      return
    }
    if (accept && !accept.some((a) => file.type.match(a.replace('*', '.*')))) {
      onReject?.('type', file)
      return
    }

    const id = generateId()

    if (file.type.startsWith('image/')) {
      const img: ImagePart = {
        type: 'image',
        id,
        file,
        localUrl: URL.createObjectURL(file),
        uploadStatus: 'local',
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      }
      parts.push(img)
    } else {
      const f: FilePart = {
        type: 'file',
        id,
        file,
        uploadStatus: 'local',
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      }
      parts.push(f)
    }
    notify()
  }

  function removeAttachment(id: string) {
    const idx = parts.findIndex((p) => (p.type === 'image' || p.type === 'file') && p.id === id)
    if (idx === -1) return

    const removed = parts[idx]
    // Revoke object URL to prevent memory leaks
    if (removed.type === 'image') URL.revokeObjectURL((removed as ImagePart).localUrl)
    if (removed.type === 'file' && (removed as FilePart).localUrl) {
      URL.revokeObjectURL((removed as FilePart).localUrl!)
    }
    parts.splice(idx, 1)
    notify()
  }

  async function uploadAttachment(id: string) {
    const part = parts.find((p) => (p.type === 'image' || p.type === 'file') && p.id === id)
    if (!part || !cfg.onUpload) return

    const attachment = part as AttachmentPart
    attachment.uploadStatus = 'uploading'
    notify()

    try {
      const remoteUrl = await cfg.onUpload(attachment.file, id)
      attachment.remoteUrl = remoteUrl
      attachment.uploadStatus = 'uploaded'
    } catch (err) {
      attachment.uploadStatus = 'error'
      attachment.uploadError = err instanceof Error ? err.message : String(err)
    }
    notify()
  }

  function clear() {
    // Revoke all image object URLs
    parts.forEach((p) => {
      if (p.type === 'image') URL.revokeObjectURL((p as ImagePart).localUrl)
      if (p.type === 'file' && (p as FilePart).localUrl) {
        URL.revokeObjectURL((p as FilePart).localUrl!)
      }
    })
    parts = []
    isComposing = false
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

    let message = buildComposedMessage(parts)

    // Run beforeSubmit hooks — a plugin returning false cancels submission
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

  // ── Paste handler (exposed for framework wrappers) ───────────────────────────
  // Framework wrappers should call this on paste events
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

  // ── Destroy ──────────────────────────────────────────────────────────────────
  function destroy() {
    plugins.forEach((p) => p.onDestroy?.())
    parts.forEach((p) => {
      if (p.type === 'image') URL.revokeObjectURL((p as ImagePart).localUrl)
      if (p.type === 'file' && (p as FilePart).localUrl) {
        URL.revokeObjectURL((p as FilePart).localUrl!)
      }
    })
    listeners.clear()
  }

  const controller: ComposerController & { handlePaste: (e: ClipboardEvent) => void } = {
    getState: snapshot,
    subscribe(listener) {
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

  // Init plugins
  plugins.forEach((p) => p.onInit?.(controller))

  return controller
}
