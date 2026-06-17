// Hooks
export { useComposer } from './hooks/useComposer'
export type { UseComposerReturn } from './hooks/useComposer'

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
