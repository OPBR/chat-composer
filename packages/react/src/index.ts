// Hooks
export { useComposer } from './hooks/useComposer'
export type { UseComposerReturn } from './hooks/useComposer'

// Components
export { ComposerInput } from './components/ComposerInput'
export type { ComposerInputProps } from './components/ComposerInput'
export { MentionDropdown } from './components/MentionDropdown'
export type { MentionDropdownProps } from './components/MentionDropdown'
export { AttachmentList } from './components/AttachmentList'
export type { AttachmentListProps } from './components/AttachmentList'

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
  AttachmentPart,
  ComposerPlugin,
} from '@chat-composer/core'
