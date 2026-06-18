export { createComposer } from './composer'
export { createComposerEngine } from './engine'
export type {
  // Message structure
  MessagePart,
  InlinePart,
  AttachmentPart,
  TextPart,
  MentionPart,
  CodeBlockPart,
  ImagePart,
  FilePart,
  ComposedMessage,
  // Upload
  UploadStatus,
  UploadHandler,
  // Config
  ComposerConfig,
  AttachmentConfig,
  MentionSource,
  MentionItem,
  // State & controller
  ComposerState,
  ComposerController,
  // Plugin
  ComposerPlugin,
} from './types'
// DOM utilities (useful for framework wrappers)
export {
  normalizeDOM,
  extractPartsFromDOM,
  createImageNode,
  createFileNode,
  createMentionNode,
  createCodeBlockNode,
  isComposerNode,
} from './dom'
export { createIMETracker } from './ime'
export { createAttachmentManager } from './attachment'
// Detection & composition utilities
export { looksLikeCode, detectLanguage } from './utils/codeDetection'
export { buildComposedMessage } from './utils/message'
export { resolveMentionSource } from './utils/mention'
