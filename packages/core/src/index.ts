export { createComposer } from './composer'
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
// Utilities (useful for framework wrappers)
export { looksLikeCode, detectLanguage } from './utils/codeDetection'
export { buildComposedMessage } from './utils/message'
export { resolveMentionSource } from './utils/mention'
