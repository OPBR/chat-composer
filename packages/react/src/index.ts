// Hooks
export { useComposer, useComposerInput } from './hooks/useComposer.js'

// Re-export core types so consumers only need one import
export type {
  ComposerConfig,
  ComposerController,
  ComposerState,
  ComposedMessage,
  MessagePart,
  MentionItem,
  MentionSource,
  AttachmentConfig,
  ComposerPlugin,
} from '@chat-composer/core'
