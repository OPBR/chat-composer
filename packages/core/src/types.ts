// ─── Message Parts ────────────────────────────────────────────────────────────
// The structured output format sent to AI APIs

export type TextPart = {
  type: 'text'
  content: string
}

export type MentionPart = {
  type: 'mention'
  id: string
  label: string
  data?: Record<string, unknown>
}

export type CodeBlockPart = {
  type: 'code_block'
  language: string
  code: string
}

export type ImagePart = {
  type: 'image'
  file: File
  url: string // object URL for preview
  mimeType: string
  sizeBytes: number
}

export type FilePart = {
  type: 'file'
  file: File
  name: string
  mimeType: string
  sizeBytes: number
}

export type MessagePart = TextPart | MentionPart | CodeBlockPart | ImagePart | FilePart

// ─── Composed Message ─────────────────────────────────────────────────────────
// Final output handed to the AI

export type ComposedMessage = {
  parts: MessagePart[]
  // Convenience flattened fields for common use cases
  text: string
  mentions: MentionPart[]
  codeBlocks: CodeBlockPart[]
  images: ImagePart[]
  files: FilePart[]
}

// ─── Mention Source ───────────────────────────────────────────────────────────
// Pluggable data source for @mention suggestions

export type MentionItem = {
  id: string
  label: string
  description?: string
  avatar?: string
  data?: Record<string, unknown>
}

export type MentionSource =
  | MentionItem[]
  | ((query: string) => MentionItem[] | Promise<MentionItem[]>)

// ─── Attachment Config ────────────────────────────────────────────────────────

export type AttachmentConfig = {
  accept?: string[] // MIME types, e.g. ['image/*', 'application/pdf']
  maxFileSizeBytes?: number // default: 10MB
  maxFiles?: number // default: 10
  onReject?: (reason: 'size' | 'type' | 'count', file: File) => void
}

// ─── Composer State ───────────────────────────────────────────────────────────

export type ComposerState = {
  parts: MessagePart[]
  isMentionOpen: boolean
  mentionQuery: string
  mentionItems: MentionItem[]
  isSubmitting: boolean
  isEmpty: boolean
}

// ─── Composer Config ──────────────────────────────────────────────────────────

export type ComposerConfig = {
  placeholder?: string
  mentionTrigger?: string // default: '@'
  mentionSource?: MentionSource
  attachments?: AttachmentConfig
  codeDetection?: boolean // auto-detect pasted code, default: true
  imagePaste?: boolean // handle image paste, default: true
  maxLength?: number
  onSubmit?: (message: ComposedMessage) => void | Promise<void>
  onChange?: (state: ComposerState) => void
}

// ─── Plugin API ───────────────────────────────────────────────────────────────
// Extend composer behavior without forking the core

export type ComposerPlugin = {
  name: string
  onInit?: (composer: ComposerController) => void
  onBeforeSubmit?: (message: ComposedMessage) => ComposedMessage | false
  onDestroy?: () => void
}

// ─── Controller (public API) ──────────────────────────────────────────────────

export type ComposerController = {
  // State
  getState(): ComposerState
  subscribe(listener: (state: ComposerState) => void): () => void

  // Mutations
  insertText(text: string): void
  insertMention(item: MentionItem): void
  insertCodeBlock(code: string, language?: string): void
  attachFile(file: File): void
  removeAttachment(index: number): void
  clear(): void

  // Submission
  submit(): Promise<void>

  // Mention dropdown
  openMention(query?: string): void
  closeMention(): void
  updateMentionQuery(query: string): void

  // Plugin system
  use(plugin: ComposerPlugin): void

  // Cleanup
  destroy(): void
}
