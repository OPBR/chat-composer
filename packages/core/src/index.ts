export { createComposer } from './composer.js'
export type {
  // Message structure
  MessagePart,
  TextPart,
  MentionPart,
  CodeBlockPart,
  ImagePart,
  FilePart,
  ComposedMessage,
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
} from './types.js'
// Utilities (useful for framework wrappers)
export { looksLikeCode, detectLanguage } from './utils/codeDetection.js'
export { buildComposedMessage } from './utils/message.js'
export { resolveMentionSource } from './utils/mention.js'
