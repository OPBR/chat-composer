export { useComposer } from './useComposer'
export type { UseComposerReturn } from './useComposer'

// Components
export { default as ComposerInput } from './components/ComposerInput.vue'
export { default as MentionDropdown } from './components/MentionDropdown.vue'
export { default as AttachmentList } from './components/AttachmentList.vue'

export type {
  ComposerConfig,
  ComposerController,
  ComposerState,
  ComposedMessage,
  MessagePart,
  MentionItem,
  MentionSource,
  AttachmentConfig,
  AttachmentPart,
  ComposerPlugin,
} from '@chat-composer/core'
